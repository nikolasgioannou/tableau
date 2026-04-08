import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const chatRouter = createTRPCRouter({
  getMessages: publicProcedure
    .input(z.object({ presentationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.chatMessage.findMany({
        where: { presentationId: input.presentationId },
        orderBy: { createdAt: "asc" },
        include: {
          toolCalls: { orderBy: { createdAt: "asc" } },
        },
      });
    }),

  createUserMessage: publicProcedure
    .input(
      z.object({
        presentationId: z.string(),
        content: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatMessage.create({
        data: {
          presentationId: input.presentationId,
          role: "user",
          content: input.content,
        },
      });
    }),

  createAssistantMessage: publicProcedure
    .input(
      z.object({
        presentationId: z.string(),
        content: z.string(),
        toolCalls: z.array(
          z.object({
            toolCallId: z.string(),
            toolName: z.string(),
            input: z.string(),
            output: z.string(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatMessage.create({
        data: {
          presentationId: input.presentationId,
          role: "assistant",
          content: input.content,
          toolCalls: {
            create: input.toolCalls,
          },
        },
        include: { toolCalls: true },
      });
    }),
});
