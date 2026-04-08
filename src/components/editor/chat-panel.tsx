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
import { useToast } from "~/components/ui/toast";
import { api } from "~/utils/api";
import { type UIMessage, DefaultChatTransport } from "ai";

type ChatPanelProps = {
  presentationId: string;
  onSlidesChanged: () => void;
};

type DisplayPart =
  | { kind: "text"; text: string }
  | { kind: "tool"; id: string; label: string; done: boolean };

type DisplayMessage = {
  id: string;
  role: "user" | "assistant";
  parts: DisplayPart[];
};

function getToolLabel(
  toolName: string,
  input: Record<string, unknown> | undefined,
): string {
  if (toolName === "updateSlide" && input?.slideIndex != null) {
    return `Updated slide ${(input.slideIndex as number) + 1}`;
  } else if (toolName === "bulkUpdateSlides" && Array.isArray(input?.updates)) {
    return `Bulk updated ${input.updates.length} slides`;
  } else if (toolName === "addSlide") {
    return "Added new slide";
  } else if (toolName === "deleteSlide" && input?.slideIndex != null) {
    return `Deleted slide ${(input.slideIndex as number) + 1}`;
  } else if (toolName === "reorderSlides") {
    return "Reordered slides";
  }
  return toolName;
}

function extractDisplayMessages(messages: UIMessage[]): DisplayMessage[] {
  return messages.map((msg) => {
    const parts: DisplayPart[] = [];

    for (const part of msg.parts) {
      if (part.type === "text" && part.text) {
        parts.push({ kind: "text", text: part.text });
      } else if (part.type.startsWith("tool-")) {
        const p = part as {
          type: string;
          toolCallId: string;
          toolName?: string;
          state: string;
          input?: Record<string, unknown>;
        };
        const toolName = p.toolName ?? part.type.replace("tool-", "");
        parts.push({
          kind: "tool",
          id: p.toolCallId,
          label: getToolLabel(toolName, p.input ?? {}),
          done:
            p.state === "result" ||
            p.state === "output" ||
            p.state === "output-available",
        });
      }
    }

    return {
      id: msg.id,
      role: msg.role as "user" | "assistant",
      parts,
    };
  });
}

export function ChatPanel({ presentationId, onSlidesChanged }: ChatPanelProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const pendingImageRef = useRef<string | null>(null);
  const [inputValue, setInputValue] = useState("");

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
    error: chatError,
    clearError,
    sendMessage,
    setMessages,
  } = useChat({
    id: `chat-${presentationId}`,
    transport,
    onFinish: () => {
      onSlidesChanged();
    },
  });

  const isStreaming = status === "streaming" || status === "submitted";
  const displayMessages = extractDisplayMessages(messages);

  // Load chat history from DB — reset when presentationId changes
  const loadedForRef = useRef<string | null>(null);
  useEffect(() => {
    if (
      dbMessages &&
      dbMessages.length > 0 &&
      loadedForRef.current !== presentationId
    ) {
      const initial = dbMessages.map((msg) => ({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        parts: [
          ...msg.toolCalls.map((tc) => ({
            type: `tool-${tc.toolName}`,
            toolCallId: tc.toolCallId,
            state: "output-available" as const,
            input: JSON.parse(tc.input) as Record<string, unknown>,
            output: JSON.parse(tc.output) as Record<string, unknown>,
          })),
          ...(msg.content
            ? [{ type: "text" as const, text: msg.content }]
            : []),
        ],
        createdAt: new Date(msg.createdAt),
      }));
      setMessages(initial as unknown as UIMessage[]);
      loadedForRef.current = presentationId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbMessages, presentationId]);

  // Trigger slide refetch whenever any tool part appears or changes state
  const toolSignatureRef = useRef("");
  useEffect(() => {
    const signature = displayMessages
      .flatMap((msg) =>
        msg.parts
          .filter((p): p is DisplayPart & { kind: "tool" } => p.kind === "tool")
          .map((p) => `${p.id}:${String(p.done)}`),
      )
      .join(",");
    if (signature !== toolSignatureRef.current && signature !== "") {
      onSlidesChanged();
      toolSignatureRef.current = signature;
    }
  }, [displayMessages, onSlidesChanged]);

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
    <div className="border-border-default bg-surface-base flex h-full w-[360px] flex-shrink-0 flex-col border-l">
      {/* Messages */}
      <div className="flex flex-1 flex-col-reverse overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
          {displayMessages.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-20">
              <p className="text-text-tertiary text-center text-sm">
                Describe the slides you want to create...
              </p>
            </div>
          )}
          {displayMessages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="bg-accent-subtle text-text-primary max-w-[85%] rounded-lg px-3 py-2 text-sm">
                    {msg.parts
                      .filter(
                        (p): p is DisplayPart & { kind: "text" } =>
                          p.kind === "text",
                      )
                      .map((p) => p.text)
                      .join("\n")}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {msg.parts.map((part, i) =>
                    part.kind === "tool" ? (
                      <span
                        key={part.id}
                        className="bg-accent-subtle text-text-secondary inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
                      >
                        {part.done ? (
                          <span className="text-[10px]">&#10003;</span>
                        ) : (
                          <span className="bg-accent-default h-1.5 w-1.5 animate-pulse rounded-full" />
                        )}
                        {part.label}
                      </span>
                    ) : (
                      <div
                        key={i}
                        className="bg-surface-raised text-text-primary max-w-[85%] rounded-lg px-3 py-2 text-sm"
                      >
                        {part.text}
                      </div>
                    ),
                  )}
                </div>
              )}
            </div>
          ))}
          {chatError && (
            <div className="border-destructive-default/30 bg-destructive-subtle text-destructive-default flex items-start gap-2 rounded-lg border px-3 py-2 text-sm">
              <span className="flex-1">
                {chatError.message || "Something went wrong. Please try again."}
              </span>
              <button
                onClick={clearError}
                className="text-destructive-default/60 hover:text-destructive-default shrink-0 text-xs"
              >
                &#x2715;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-border-default border-t p-3">
        {pendingImage && (
          <div className="bg-accent-subtle text-text-secondary mb-2 flex items-center gap-2 rounded px-2 py-1 text-xs">
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
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your slides..."
            disabled={isStreaming}
            className="border-border-default bg-surface-base text-text-primary placeholder:text-text-tertiary focus:border-border-strong h-9 flex-1 rounded-md border px-3 text-sm disabled:opacity-50"
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
