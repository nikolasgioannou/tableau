import { useChat } from "@ai-sdk/react";
import { Paperclip, SendHorizontal } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from "~/components/ui/toast";
import { api } from "~/utils/api";
import { type UIMessage, DefaultChatTransport } from "ai";

type ChatPanelProps = {
  presentationId: string;
  onSlidesChanged: () => void;
};

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  toolCalls: Array<{
    id: string;
    toolName: string;
    label: string;
    done: boolean;
  }>;
};

function getToolLabel(toolName: string, input: Record<string, unknown>): string {
  if (toolName === "updateSlide") {
    return `Updated slide ${(input.slideIndex as number) + 1}`;
  } else if (toolName === "bulkUpdateSlides") {
    return `Bulk updated ${(input.updates as Array<unknown>).length} slides`;
  } else if (toolName === "addSlide") {
    return "Added new slide";
  } else if (toolName === "deleteSlide") {
    return `Deleted slide ${(input.slideIndex as number) + 1}`;
  } else if (toolName === "reorderSlides") {
    return "Reordered slides";
  }
  return toolName;
}

function extractDisplayMessages(messages: UIMessage[]): DisplayMessage[] {
  return messages.map((msg) => {
    const textParts: string[] = [];
    const toolCalls: DisplayMessage["toolCalls"] = [];

    for (const part of msg.parts) {
      if (part.type === "text") {
        textParts.push(part.text);
      } else if (part.type.startsWith("tool-")) {
        const p = part as {
          type: string;
          toolCallId: string;
          toolName?: string;
          state: string;
          input?: Record<string, unknown>;
        };
        const toolName = p.toolName ?? part.type.replace("tool-", "");
        toolCalls.push({
          id: p.toolCallId,
          toolName,
          label: getToolLabel(toolName, (p.input ?? {}) as Record<string, unknown>),
          done: p.state === "result" || p.state === "output" || p.state === "output-available",
        });
      }
    }

    return {
      id: msg.id,
      role: msg.role as "user" | "assistant",
      text: textParts.join("\n"),
      toolCalls,
    };
  });
}


export function ChatPanel({ presentationId, onSlidesChanged }: ChatPanelProps) {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const pendingImageRef = useRef<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep ref in sync for closure in transport
  useEffect(() => {
    pendingImageRef.current = pendingImage;
  }, [pendingImage]);

  const presentationIdRef = useRef(presentationId);
  useEffect(() => {
    presentationIdRef.current = presentationId;
  }, [presentationId]);

  // Load existing messages from DB
  const { data: dbMessages } = api.chat.getMessages.useQuery({
    presentationId,
  });

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/ai/slide-chat",
        prepareSendMessagesRequest: async ({ messages: uiMessages }) => {
          const lastMessage = uiMessages[uiMessages.length - 1];
          const messageText =
            lastMessage?.parts
              .filter(
                (p): p is { type: "text"; text: string } => p.type === "text",
              )
              .map((p) => p.text)
              .join("\n") ?? "";

          return {
            body: {
              presentationId: presentationIdRef.current,
              message: messageText,
              imageUrl: pendingImageRef.current ?? undefined,
            },
          };
        },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [presentationId],
  );

  const {
    messages,
    status,
    sendMessage,
    setMessages,
  } = useChat({
    id: `chat-${presentationId}`,
    transport,
    onError: (err) => {
      toast(err.message || "AI request failed", "error");
    },
    onFinish: () => {
      onSlidesChanged();
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const displayMessages = extractDisplayMessages(messages);

  // Set initial messages from DB when they load
  const hasSetInitialRef = useRef(false);
  useEffect(() => {
    if (dbMessages && dbMessages.length > 0 && !hasSetInitialRef.current) {
      const initial = dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: [
          ...msg.toolCalls.map((tc) => ({
            type: `tool-${tc.toolName}` as `tool-${string}`,
            toolCallId: tc.toolCallId,
            state: "output-available" as const,
            input: JSON.parse(tc.input) as Record<string, unknown>,
            output: JSON.parse(tc.output) as Record<string, unknown>,
          })),
          ...(msg.content ? [{ type: "text" as const, text: msg.content }] : []),
        ],
        createdAt: new Date(msg.createdAt),
      }));
      setMessages(initial as unknown as UIMessage[]);
      hasSetInitialRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbMessages]);

  // Trigger slide refetch whenever tool calls appear
  const lastToolCountRef = useRef(0);
  useEffect(() => {
    let toolCount = 0;
    for (const msg of displayMessages) {
      toolCount += msg.toolCalls.length;
    }
    if (toolCount > lastToolCountRef.current) {
      onSlidesChanged();
      lastToolCountRef.current = toolCount;
    }
  }, [displayMessages, onSlidesChanged]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text && !pendingImage) return;

    const messageContent = text || "Here's an image to use";
    setInputValue("");

    await sendMessage({ text: messageContent });
    setPendingImage(null);
  }, [inputValue, pendingImage, sendMessage]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleImageUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        toast("Please upload an image file", "error");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = (await response.json()) as { dataUrl: string };
        setPendingImage(data.dataUrl);
      } catch {
        toast("Image upload failed", "error");
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [toast],
  );

  return (
    <div className="flex h-full w-[360px] flex-shrink-0 flex-col border-l border-border-default bg-surface-base">
      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-3 p-4">
          {displayMessages.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-20">
              <p className="text-center text-sm text-text-tertiary">
                Describe the slides you want to create...
              </p>
            </div>
          )}
          {displayMessages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg bg-accent-subtle px-3 py-2 text-sm text-text-primary">
                    {msg.text}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {msg.toolCalls.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.toolCalls.map((tc) => (
                        <span
                          key={tc.id}
                          className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] text-text-secondary"
                        >
                          {tc.done ? (
                            <span className="text-[10px]">&#10003;</span>
                          ) : (
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-default" />
                          )}
                          {tc.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {msg.text && (
                    <div className="max-w-[85%] rounded-lg bg-surface-raised px-3 py-2 text-sm text-text-primary">
                      {msg.text}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border-default p-3">
        {pendingImage && (
          <div className="mb-2 flex items-center gap-2 rounded bg-accent-subtle px-2 py-1 text-xs text-text-secondary">
            <span>Image attached</span>
            <button
              onClick={() => setPendingImage(null)}
              className="text-text-tertiary hover:text-text-primary"
            >
              &#x2715;
            </button>
          </div>
        )}
        <div className="flex items-end gap-1.5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your slides..."
            disabled={isStreaming}
            className="h-9 flex-1 rounded-md border border-border-default bg-surface-base px-3 text-sm text-text-primary placeholder:text-text-tertiary focus:border-border-strong disabled:opacity-50"
          />
          <Button
            variant="outline"
            size="md"
            onClick={handleImageUpload}
            disabled={isStreaming}
          >
            <Paperclip size={14} />
          </Button>
          <Button
            size="md"
            onClick={handleSend}
            disabled={isStreaming || (!inputValue.trim() && !pendingImage)}
          >
            <SendHorizontal size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
