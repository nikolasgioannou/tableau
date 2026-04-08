import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/cn";

type SlideHtmlEditorProps = {
  html: string;
  onUpdate: (html: string) => void;
};

export function SlideHtmlEditor({ html, onUpdate }: SlideHtmlEditorProps) {
  const [localValue, setLocalValue] = useState(html);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const prevHtmlRef = useRef(html);

  // Reset local state when the active slide changes (external html prop changes)
  useEffect(() => {
    if (html !== prevHtmlRef.current) {
      setLocalValue(html);
      prevHtmlRef.current = html;
    }
  }, [html]);

  const handleChange = useCallback(
    (value: string) => {
      setLocalValue(value);
      prevHtmlRef.current = value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(value);
      }, 600);
    },
    [onUpdate],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const target = e.currentTarget;
        const start = target.selectionStart;
        const end = target.selectionEnd;
        const newValue =
          localValue.substring(0, start) + "  " + localValue.substring(end);
        setLocalValue(newValue);
        prevHtmlRef.current = newValue;

        // Set cursor position after React re-renders
        requestAnimationFrame(() => {
          target.selectionStart = target.selectionEnd = start + 2;
        });

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
          onUpdate(newValue);
        }, 600);
      }
    },
    [localValue, onUpdate],
  );

  return (
    <textarea
      value={localValue}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      className={cn(
        "h-full w-full resize-none border-t border-border-default bg-surface-subtle p-3 font-mono text-xs text-text-primary",
        "placeholder:text-text-disabled focus:outline-none",
      )}
      placeholder="Slide HTML..."
      spellCheck={false}
    />
  );
}
