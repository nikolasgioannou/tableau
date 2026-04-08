import { useChat } from "ai/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "~/lib/cn";
import { Button } from "~/components/ui/button";
import { ScrollArea } from "~/components/ui/scroll-area";
import { useToast } from "~/components/ui/toast";
import { api } from "~/utils/api";
import type { Message } from "ai";

type ToolInvocation = {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  state: "call" | "result" | "partial-call";
  result?: Record<string, unknown>;
};

type ChatPanelProps = {
  presentationId: string;
  onSlidesChanged: () => void;
};

function ToolCallChip({ invocation }: { invocation: ToolInvocation }) {
  const { toolName, args } = invocation;
  let label = toolName;

  if (toolName === "updateSlide") {
    const idx = args.slideIndex as number;
    label = `Updated slide ${idx + 1}`;
  } else if (toolName === "bulkUpdateSlides") {
    const updates = args.updates as Array<unknown>;
    label = `Bulk updated ${updates.length} slides`;
  } else if (toolName === "addSlide") {
    label = "Added new slide";
  } else if (toolName === "deleteSlide") {
    const idx = args.slideIndex as number;
    label = `Deleted slide ${idx + 1}`;
  } else if (toolName === "reorderSlides") {
    label = "Reordered slides";
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-subtle px-2 py-0.5 text-[11px] text-text-secondary">
      {invocation.state === "call" ? (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-default" />
      ) : (
        <span className="text-[10px]">&#10003;</span>
      )}
      {label}
    </span>
  );
}

function PaperclipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13.5 7.5l-5.793 5.793a2.828 2.828 0 01-4-4L9.5 3.5a2 2 0 012.828 2.828L6.536 12.12a1.172 1.172 0 01-1.657-1.657L10.5 4.843" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M2.5 2.5L13.5 8L2.5 13.5V9L9.5 8L2.5 7V2.5Z" />
    </svg>
  );
}

export function ChatPanel({ presentationId, onSlidesChanged }: ChatPanelProps) {
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load existing messages from DB
  const { data: dbMessages } = api.chat.getMessages.useQuery({
    presentationId,
  });

  // Convert DB messages to AI SDK format for initial display
  const initialMessages: Message[] = (dbMessages ?? []).map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content: msg.content,
    toolInvocations: msg.toolCalls.map((tc) => ({
      toolCallId: tc.id,
      toolName: tc.toolName,
      args: JSON.parse(tc.input) as Record<string, unknown>,
      state: "result" as const,
      result: JSON.parse(tc.output) as Record<string, unknown>,
    })),
  }));

  const {
    messages,
    input,
    handleInputChange,
    isLoading,
    append,
    setMessages,
  } = useChat({
    api: "/api/ai/slide-chat",
    body: { presentationId },
    initialMessages: [],
    onFinish: () => {
      onSlidesChanged();
    },
    onError: (err) => {
      toast(err.message || "AI request failed", "error");
    },
  });

  // Set initial messages from DB when they load
  const hasSetInitialRef = useRef(false);
  useEffect(() => {
    if (dbMessages && !hasSetInitialRef.current && initialMessages.length > 0) {
      setMessages(initialMessages);
      hasSetInitialRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbMessages]);

  // Trigger slide refetch whenever tool invocations appear
  const lastToolCountRef = useRef(0);
  useEffect(() => {
    let toolCount = 0;
    for (const msg of messages) {
      if (msg.toolInvocations) {
        toolCount += msg.toolInvocations.length;
      }
    }
    if (toolCount > lastToolCountRef.current) {
      onSlidesChanged();
      lastToolCountRef.current = toolCount;
    }
  }, [messages, onSlidesChanged]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text && !pendingImage) return;

    const messageContent = text || "Here's an image to use";

    await append({
      role: "user",
      content: messageContent,
    }, {
      body: {
        presentationId,
        message: messageContent,
        imageUrl: pendingImage ?? undefined,
      },
    });

    setPendingImage(null);
  }, [input, pendingImage, append, presentationId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        void handleSend();
      }
    },
    [handleSend],
  );

  const handleImageUpload = useCallback(async () => {
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

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [toast],
  );

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  }, [input]);

  return (
    <div className="flex h-full w-[360px] flex-shrink-0 flex-col border-l border-border-default bg-surface-base">
      {/* Messages */}
      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="flex flex-col gap-3 p-4">
          {messages.length === 0 && (
            <div className="flex flex-1 items-center justify-center py-20">
              <p className="text-center text-sm text-text-tertiary">
                Describe the slides you want to create...
              </p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === "user" ? (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg bg-accent-subtle px-3 py-2 text-sm text-text-primary">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {/* Tool call chips */}
                  {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {msg.toolInvocations.map((inv) => (
                        <ToolCallChip
                          key={inv.toolCallId}
                          invocation={inv as ToolInvocation}
                        />
                      ))}
                    </div>
                  )}
                  {/* Text content */}
                  {msg.content && (
                    <div className="max-w-[85%] rounded-lg bg-surface-raised px-3 py-2 text-sm text-text-primary">
                      {msg.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-1 px-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-tertiary" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-tertiary [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-text-tertiary [animation-delay:300ms]" />
            </div>
          )}
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
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleImageUpload}
            disabled={isLoading}
            className="mb-0.5 text-text-tertiary transition-colors hover:text-text-primary disabled:opacity-50"
          >
            <PaperclipIcon />
          </button>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe your slides..."
            disabled={isLoading}
            rows={1}
            className="max-h-[120px] min-h-[36px] flex-1 resize-none rounded-md border border-border-default bg-surface-base px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent-default disabled:opacity-50"
          />
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isLoading || (!input.trim() && !pendingImage)}
            className="mb-0.5"
          >
            <SendIcon />
          </Button>
        </div>
      </div>
    </div>
  );
}
