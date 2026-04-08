import { html as htmlLang } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "~/lib/cn";

type SlideHtmlEditorProps = {
  head: string;
  body: string;
  onUpdate: (fields: { head: string; body: string }) => void;
};

const baseTheme = EditorView.theme({
  "&": {
    height: "100%",
    fontSize: "12px",
  },
  ".cm-scroller": {
    fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
  },
});

const extensions = [htmlLang(), baseTheme];
const darkExtensions = [htmlLang(), oneDark, baseTheme];

function useDarkMode() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);
  return isDark;
}

function DebouncedEditor({
  value,
  onChange,
  isDark,
}: {
  value: string;
  onChange: (value: string) => void;
  isDark: boolean;
}) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevValueRef = useRef(value);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    if (value !== prevValueRef.current) {
      setLocalValue(value);
      prevValueRef.current = value;
    }
  }, [value]);

  const handleChange = useCallback(
    (v: string) => {
      setLocalValue(v);
      prevValueRef.current = v;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(v);
      }, 600);
    },
    [onChange],
  );

  return (
    <CodeMirror
      value={localValue}
      onChange={handleChange}
      extensions={isDark ? darkExtensions : extensions}
      theme={isDark ? "dark" : "light"}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        indentOnInput: true,
        tabSize: 2,
      }}
      className="h-full text-xs"
    />
  );
}

export function SlideHtmlEditor({
  head,
  body,
  onUpdate,
}: SlideHtmlEditorProps) {
  const isDark = useDarkMode();
  const hasHead = head.trim().length > 0;
  const [activeTab, setActiveTab] = useState<"body" | "head">("body");

  const handleBodyChange = useCallback(
    (value: string) => onUpdate({ head, body: value }),
    [head, onUpdate],
  );

  const handleHeadChange = useCallback(
    (value: string) => onUpdate({ head: value, body }),
    [body, onUpdate],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="bg-surface-subtle border-border-default flex items-stretch border-b">
        <button
          onClick={() => setActiveTab("body")}
          className={cn(
            "border-border-default border-r px-4 py-1.5 font-mono text-xs transition-colors",
            activeTab === "body"
              ? "bg-surface-base text-text-primary"
              : "text-text-tertiary hover:text-text-secondary",
          )}
        >
          body
        </button>
        {hasHead && (
          <button
            onClick={() => setActiveTab("head")}
            className={cn(
              "border-border-default border-r px-4 py-1.5 font-mono text-xs transition-colors",
              activeTab === "head"
                ? "bg-surface-base text-text-primary"
                : "text-text-tertiary hover:text-text-secondary",
            )}
          >
            head
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto">
        {activeTab === "body" ? (
          <DebouncedEditor
            value={body}
            onChange={handleBodyChange}
            isDark={isDark}
          />
        ) : (
          <DebouncedEditor
            value={head}
            onChange={handleHeadChange}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
}
