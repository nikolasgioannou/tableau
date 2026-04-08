import { type NextApiRequest, type NextApiResponse } from "next";
import {
  streamText,
  tool,
  type ModelMessage,
  type ToolModelMessage,
  type JSONValue,
  createUIMessageStreamResponse,
  stepCountIs,
} from "ai";
import { z } from "zod";
import { model } from "~/lib/ai";
import { db } from "~/server/db";

const SYSTEM_PROMPT = `You are Tableau, an expert presentation designer. You create and edit HTML slides.

SLIDE FORMAT:
- Each slide renders at exactly 1280×720px inside an iframe.
- Use inline CSS only — no <style> blocks, no <html>/<body> tags.
- Google Fonts are allowed via <link> tags at the top of the HTML.
- The slide HTML is the complete content of the <body>.

DESIGN PRINCIPLES:
- Design with real intent: strong typographic hierarchy, deliberate whitespace, considered color choices, creative layouts.
- Every slide should look like it was made by a senior designer. No generic output.
- Use modern, clean aesthetics with bold typography and strong visual structure.

CONSISTENCY IS YOUR PRIMARY RESPONSIBILITY:
- Before making any change, examine ALL existing slides provided in context.
- Any new or updated slide must match the established visual language — same typefaces, same color palette, same spacing system, same compositional style.
- When making changes that affect the visual language (theme change, font swap, color update), use bulkUpdateSlides to apply it everywhere, not just to the mentioned slide.
- If no slides exist yet, establish a deliberate and strong visual language with the first slide and commit to it.

TOOL SELECTION:
- Single slide edit → updateSlide
- Multiple slides changing → bulkUpdateSlides (NEVER call updateSlide in a loop)
- New slide → addSlide
- Remove a slide → deleteSlide
- Move slides around → reorderSlides

After all tool calls, write a brief conversational message (1-2 sentences) describing what was done.`;

function createSlideTools(presentationId: string) {
  return {
    updateSlide: tool({
      description:
        "Update a single existing slide. Use for targeted edits to one specific slide.",
      inputSchema: z.object({
        slideIndex: z.number().describe("0-based slide index"),
        html: z.string().describe("Complete new HTML for the slide"),
        reasoning: z.string().describe("One-sentence reasoning"),
      }),
      execute: async ({ slideIndex, html, reasoning }) => {
        const slide = await db.slide.findFirst({
          where: { presentationId, index: slideIndex },
        });
        if (!slide) {
          return { success: false, error: `Slide ${slideIndex} not found` };
        }
        await db.slide.update({
          where: { id: slide.id },
          data: { html },
        });
        return { success: true, slideIndex, reasoning };
      },
    }),

    bulkUpdateSlides: tool({
      description:
        "Update multiple slides in a single call. Use for consistency passes, theme changes, or any multi-slide edit.",
      inputSchema: z.object({
        updates: z.array(
          z.object({
            slideIndex: z.number(),
            html: z.string(),
            reasoning: z.string(),
          }),
        ),
      }),
      execute: async ({ updates }) => {
        const results: Array<{
          slideIndex: number;
          success: boolean;
          error?: string;
        }> = [];
        await db.$transaction(async (tx) => {
          for (const update of updates) {
            const slide = await tx.slide.findFirst({
              where: { presentationId, index: update.slideIndex },
            });
            if (!slide) {
              results.push({
                slideIndex: update.slideIndex,
                success: false,
                error: `Slide ${update.slideIndex} not found`,
              });
              continue;
            }
            await tx.slide.update({
              where: { id: slide.id },
              data: { html: update.html },
            });
            results.push({ slideIndex: update.slideIndex, success: true });
          }
        });
        return { success: true, updatedCount: results.length, results };
      },
    }),

    addSlide: tool({
      description:
        "Add a new slide at a specified position. If insertAfterIndex is omitted, appends at the end.",
      inputSchema: z.object({
        html: z.string().describe("Complete HTML for the new slide"),
        insertAfterIndex: z
          .number()
          .optional()
          .describe(
            "Insert after this slide index. -1 to prepend. Omit to append.",
          ),
        description: z.string().describe("One-sentence description"),
      }),
      execute: async ({ html, insertAfterIndex, description }) => {
        const allSlides = await db.slide.findMany({
          where: { presentationId },
          orderBy: { index: "asc" },
        });

        let newIndex: number;
        if (insertAfterIndex === undefined) {
          newIndex = allSlides.length;
        } else if (insertAfterIndex === -1) {
          newIndex = 0;
        } else {
          newIndex = insertAfterIndex + 1;
        }

        await db.$transaction([
          ...allSlides
            .filter((s) => s.index >= newIndex)
            .map((s) =>
              db.slide.update({
                where: { id: s.id },
                data: { index: s.index + 1 },
              }),
            ),
          db.slide.create({
            data: { presentationId, index: newIndex, html },
          }),
        ]);

        return { success: true, newIndex, description };
      },
    }),

    deleteSlide: tool({
      description: "Remove a slide by index.",
      inputSchema: z.object({
        slideIndex: z.number().describe("0-based slide index to delete"),
        reasoning: z.string().describe("One-sentence reasoning"),
      }),
      execute: async ({ slideIndex, reasoning }) => {
        const slide = await db.slide.findFirst({
          where: { presentationId, index: slideIndex },
        });
        if (!slide) {
          return {
            success: false,
            error: `Slide ${slideIndex} not found`,
          };
        }
        await db.slide.delete({ where: { id: slide.id } });
        const remaining = await db.slide.findMany({
          where: { presentationId },
          orderBy: { index: "asc" },
        });
        await db.$transaction(
          remaining.map((s, i) =>
            db.slide.update({ where: { id: s.id }, data: { index: i } }),
          ),
        );
        return { success: true, deletedIndex: slideIndex, reasoning };
      },
    }),

    reorderSlides: tool({
      description: "Reorder all slides given a new ordering.",
      inputSchema: z.object({
        slideIds: z
          .array(z.string())
          .describe("Array of slide IDs in the desired new order"),
      }),
      execute: async ({ slideIds }) => {
        await db.$transaction(
          slideIds.map((id, index) =>
            db.slide.update({ where: { id }, data: { index } }),
          ),
        );
        return { success: true, newOrder: slideIds };
      },
    }),
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  // The body comes from DefaultChatTransport's prepareSendMessagesRequest
  const body = req.body as Record<string, unknown>;

  const presentationId = body.presentationId as string | undefined;
  const message = body.message as string | undefined;
  const imageUrl = body.imageUrl as string | undefined;

  if (!presentationId || !message) {
    res.status(400).json({
      error: "Missing presentationId or message",
      receivedKeys: Object.keys(body),
    });
    return;
  }

  // Persist user message
  await db.chatMessage.create({
    data: {
      presentationId,
      role: "user",
      content: message,
    },
  });

  // Fetch all prior messages with tool calls
  const dbMessages = await db.chatMessage.findMany({
    where: { presentationId },
    orderBy: { createdAt: "asc" },
    include: { toolCalls: { orderBy: { createdAt: "asc" } } },
  });

  // Fetch all slides
  const slides = await db.slide.findMany({
    where: { presentationId },
    orderBy: { index: "asc" },
  });

  // Build conversation history for the AI
  const messages: ModelMessage[] = [];

  for (const msg of dbMessages) {
    if (msg.role === "user") {
      messages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      if (msg.toolCalls.length > 0) {
        messages.push({
          role: "assistant",
          content: [
            ...msg.toolCalls.map((tc) => ({
              type: "tool-call" as const,
              toolCallId: tc.id,
              toolName: tc.toolName,
              input: JSON.parse(tc.input) as unknown,
            })),
            ...(msg.content
              ? [{ type: "text" as const, text: msg.content }]
              : []),
          ],
        });
        const toolMsg: ToolModelMessage = {
          role: "tool",
          content: msg.toolCalls.map((tc) => ({
            type: "tool-result" as const,
            toolCallId: tc.id,
            toolName: tc.toolName,
            output: {
              type: "json" as const,
              value: JSON.parse(tc.output) as JSONValue,
            },
          })),
        };
        messages.push(toolMsg);
      } else {
        messages.push({ role: "assistant", content: msg.content });
      }
    }
  }

  // Build slide context
  const slideContext =
    slides.length > 0
      ? `\n\nCURRENT SLIDES (${slides.length} total):\n${slides
          .map(
            (s) =>
              `--- Slide ${s.index} (id: ${s.id}) ---\n${s.html || "(empty)"}\n`,
          )
          .join("\n")}`
      : "\n\nNo slides exist yet.";

  // If the last user message has an image, modify it
  if (imageUrl && messages.length > 0) {
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.role === "user") {
      messages[messages.length - 1] = {
        role: "user",
        content: [
          { type: "text", text: message },
          { type: "image", image: imageUrl },
        ],
      };
    }
  }

  const tools = createSlideTools(presentationId);

  const result = streamText({
    model,
    system: SYSTEM_PROMPT + slideContext,
    messages,
    tools,
    stopWhen: stepCountIs(10),
    onFinish: async ({ text, steps }) => {
      const allToolCalls: Array<{
        toolName: string;
        input: string;
        output: string;
      }> = [];

      for (const step of steps) {
        for (const tc of step.staticToolCalls) {
          const toolResult = step.staticToolResults.find(
            (tr) => tr.toolCallId === tc.toolCallId,
          );
          allToolCalls.push({
            toolName: tc.toolName,
            input: JSON.stringify(tc.input),
            output: JSON.stringify(toolResult?.output ?? {}),
          });
        }
      }

      await db.chatMessage.create({
        data: {
          presentationId,
          role: "assistant",
          content: text,
          toolCalls: {
            create: allToolCalls,
          },
        },
      });
    },
  });

  const stream = result.toUIMessageStream();

  const response = createUIMessageStreamResponse({ stream });

  // Forward the Response to Next.js res
  res.writeHead(
    response.status,
    Object.fromEntries(response.headers.entries()),
  );
  if (response.body) {
    const reader = response.body.getReader();
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
