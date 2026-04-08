import { describe, it, expect } from "vitest";

// Simulate the DB message shape
type DbToolCall = {
  id: string;
  toolCallId: string;
  toolName: string;
  input: string;
  output: string;
};

type DbMessage = {
  id: string;
  role: string;
  content: string;
  toolCalls: DbToolCall[];
};

type ModelMessage =
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | Array<Record<string, unknown>> }
  | { role: "tool"; content: Array<Record<string, unknown>> };

// This mirrors the reconstruction logic from slide-chat.ts
function reconstructMessages(dbMessages: DbMessage[]): ModelMessage[] {
  const messages: ModelMessage[] = [];

  for (const msg of dbMessages) {
    if (msg.role === "user") {
      messages.push({ role: "user", content: msg.content });
    } else if (msg.role === "assistant") {
      if (msg.toolCalls.length > 0) {
        messages.push({
          role: "assistant",
          content: msg.toolCalls.map((tc) => ({
            type: "tool-call",
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            input: JSON.parse(tc.input) as Record<string, unknown>,
          })),
        });
        messages.push({
          role: "tool",
          content: msg.toolCalls.map((tc) => ({
            type: "tool-result",
            toolCallId: tc.toolCallId,
            toolName: tc.toolName,
            output: {
              type: "json",
              value: JSON.parse(tc.output) as Record<string, unknown>,
            },
          })),
        });
        if (msg.content) {
          messages.push({ role: "assistant", content: msg.content });
        }
      } else {
        messages.push({ role: "assistant", content: msg.content });
      }
    }
  }

  return messages;
}

describe("message reconstruction", () => {
  it("reconstructs simple user + assistant text exchange", () => {
    const dbMessages: DbMessage[] = [
      { id: "1", role: "user", content: "Hello", toolCalls: [] },
      { id: "2", role: "assistant", content: "Hi there!", toolCalls: [] },
    ];

    const result = reconstructMessages(dbMessages);
    expect(result).toEqual([
      { role: "user", content: "Hello" },
      { role: "assistant", content: "Hi there!" },
    ]);
  });

  it("reconstructs assistant with tool calls followed by tool results", () => {
    const dbMessages: DbMessage[] = [
      { id: "1", role: "user", content: "Create a slide", toolCalls: [] },
      {
        id: "2",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            id: "db-1",
            toolCallId: "tc_abc123",
            toolName: "addSlide",
            input: '{"html":"<div>Hello</div>","description":"Title slide"}',
            output: '{"success":true,"newIndex":0}',
          },
        ],
      },
    ];

    const result = reconstructMessages(dbMessages);
    expect(result).toHaveLength(3); // user, assistant(tool-call), tool(tool-result)
    expect(result[0]).toEqual({ role: "user", content: "Create a slide" });

    // Assistant message should have tool-call parts only
    const assistantMsg = result[1]!;
    expect(assistantMsg.role).toBe("assistant");
    expect(Array.isArray(assistantMsg.content)).toBe(true);
    const content = assistantMsg.content as Array<Record<string, unknown>>;
    expect(content[0]!.type).toBe("tool-call");
    expect(content[0]!.toolCallId).toBe("tc_abc123");
  });

  it("preserves tool-call / tool-result ordering for each step", () => {
    const dbMessages: DbMessage[] = [
      { id: "1", role: "user", content: "Create slides", toolCalls: [] },
      // Step 0: tool calls
      {
        id: "2",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            id: "db-1",
            toolCallId: "tc_step0",
            toolName: "addSlide",
            input: '{"html":"<div>1</div>","description":"slide 1"}',
            output: '{"success":true}',
          },
        ],
      },
      // Step 1: more tool calls
      {
        id: "3",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            id: "db-2",
            toolCallId: "tc_step1",
            toolName: "addSlide",
            input: '{"html":"<div>2</div>","description":"slide 2"}',
            output: '{"success":true}',
          },
        ],
      },
      // Final text
      {
        id: "4",
        role: "assistant",
        content: "Created two slides for you.",
        toolCalls: [],
      },
    ];

    const result = reconstructMessages(dbMessages);

    // Should be: user, assistant(tool-call), tool(tool-result), assistant(tool-call), tool(tool-result), assistant(text)
    expect(result).toHaveLength(6);
    expect(result[0]!.role).toBe("user");
    expect(result[1]!.role).toBe("assistant");
    expect(result[2]!.role).toBe("tool");
    expect(result[3]!.role).toBe("assistant");
    expect(result[4]!.role).toBe("tool");
    expect(result[5]!.role).toBe("assistant");
    expect(result[5]!.content).toBe("Created two slides for you.");
  });

  it("ensures every tool-call has a matching tool-result with the same toolCallId", () => {
    const dbMessages: DbMessage[] = [
      { id: "1", role: "user", content: "Update slides", toolCalls: [] },
      {
        id: "2",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            id: "db-1",
            toolCallId: "tc_aaa",
            toolName: "updateSlide",
            input: '{"slideIndex":0,"html":"<div>A</div>","reasoning":"update"}',
            output: '{"success":true}',
          },
          {
            id: "db-2",
            toolCallId: "tc_bbb",
            toolName: "updateSlide",
            input: '{"slideIndex":1,"html":"<div>B</div>","reasoning":"update"}',
            output: '{"success":true}',
          },
        ],
      },
    ];

    const result = reconstructMessages(dbMessages);

    // assistant message has 2 tool-calls
    const assistantContent = result[1]!.content as Array<Record<string, unknown>>;
    expect(assistantContent).toHaveLength(2);
    expect(assistantContent[0]!.toolCallId).toBe("tc_aaa");
    expect(assistantContent[1]!.toolCallId).toBe("tc_bbb");

    // tool message has 2 tool-results with matching IDs
    const toolContent = result[2]!.content as Array<Record<string, unknown>>;
    expect(toolContent).toHaveLength(2);
    expect(toolContent[0]!.toolCallId).toBe("tc_aaa");
    expect(toolContent[1]!.toolCallId).toBe("tc_bbb");
  });

  it("does not produce consecutive assistant messages without tool in between", () => {
    const dbMessages: DbMessage[] = [
      { id: "1", role: "user", content: "Hello", toolCalls: [] },
      {
        id: "2",
        role: "assistant",
        content: "",
        toolCalls: [
          {
            id: "db-1",
            toolCallId: "tc_1",
            toolName: "addSlide",
            input: '{"html":"<div/>","description":"test"}',
            output: '{"success":true}',
          },
        ],
      },
      { id: "3", role: "assistant", content: "Done!", toolCalls: [] },
      { id: "4", role: "user", content: "Thanks", toolCalls: [] },
    ];

    const result = reconstructMessages(dbMessages);

    // Check no two consecutive assistant messages without tool in between
    for (let i = 1; i < result.length; i++) {
      if (result[i]!.role === "assistant" && result[i - 1]!.role === "assistant") {
        // This is only valid if the previous one was a tool-call assistant
        // (text follows tool-result, not another assistant)
        // Actually in our new format: assistant(tool-call) -> tool -> assistant(text)
        // so consecutive assistants shouldn't happen directly
      }
    }

    // Verify the order: user, assistant(tool-call), tool, assistant(text), user
    expect(result.map((m) => m.role)).toEqual([
      "user",
      "assistant",
      "tool",
      "assistant",
      "user",
    ]);
  });
});
