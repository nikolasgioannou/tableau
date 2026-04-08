import { html as htmlLang } from "@codemirror/lang-html";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import CodeMirror from "@uiw/react-codemirror";
import { useCallback, useEffect, useRef, useState } from "react";

type SlideHtmlEditorProps = {
  body: string;
  onUpdate: (body: string) => void;
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

export function SlideHtmlEditor({ body, onUpdate }: SlideHtmlEditorProps) {
  const [localValue, setLocalValue] = useState(body);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const prevBodyRef = useRef(body);
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
    if (body !== prevBodyRef.current) {
      setLocalValue(body);
      prevBodyRef.current = body;
    }
  }, [body]);

  const handleChange = useCallback(
    (value: string) => {
      setLocalValue(value);
      prevBodyRef.current = value;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(value);
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
