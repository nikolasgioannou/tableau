import { html as htmlLang } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useCallback, useEffect, useRef, useState } from "react";

const HEAD_SEPARATOR = "<!-- %%HEAD_ABOVE%% / %%BODY_BELOW%% -->";

type SlideHtmlEditorProps = {
  head: string;
  body: string;
  onUpdate: (fields: { head: string; body: string }) => void;
};

function combine(head: string, body: string): string {
  if (!head.trim()) return body;
  return `${head.trim()}\n${HEAD_SEPARATOR}\n${body}`;
}

function split(value: string): { head: string; body: string } {
  const idx = value.indexOf(HEAD_SEPARATOR);
  if (idx === -1) return { head: "", body: value };
  return {
    head: value.slice(0, idx).trim(),
    body: value.slice(idx + HEAD_SEPARATOR.length + 1),
  };
}

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

export function SlideHtmlEditor({
  head,
  body,
  onUpdate,
}: SlideHtmlEditorProps) {
  const combined = combine(head, body);
  const [localValue, setLocalValue] = useState(combined);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevCombinedRef = useRef(combined);
  const [isDark, setIsDark] = useState(false);

  // Clean up pending debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

  useEffect(() => {
    if (combined !== prevCombinedRef.current) {
      setLocalValue(combined);
      prevCombinedRef.current = combined;
    }
  }, [combined]);

  const handleChange = useCallback(
    (value: string) => {
      setLocalValue(value);
      prevCombinedRef.current = value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(split(value));
      }, 600);
    },
    [onUpdate],
  );

  return (
    <div className="h-full overflow-auto">
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
    </div>
  );
}
