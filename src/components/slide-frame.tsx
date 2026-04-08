import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { cn } from "~/lib/cn";

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

const INLINE_EDIT_SCRIPT = `
(function() {
  var EDITABLE = 'h1,h2,h3,h4,h5,h6,p,span,a,li,td,th,label,blockquote';
  var activeEl = null;

  function getBodyHtml() {
    // Remove contenteditable artifacts and the edit script itself
    document.querySelectorAll('[contenteditable]').forEach(function(el) {
      el.removeAttribute('contenteditable');
    });
    document.querySelectorAll('[data-edit-hover]').forEach(function(el) {
      el.removeAttribute('data-edit-hover');
    });
    // Clone body, remove all script tags, return innerHTML
    var clone = document.body.cloneNode(true);
    clone.querySelectorAll('script').forEach(function(s) { s.remove(); });
    clone.querySelectorAll('[style=""]').forEach(function(el) { el.removeAttribute('style'); });
    return clone.innerHTML.trim();
  }

  function commitEdit() {
    if (activeEl) {
      activeEl.removeAttribute('contenteditable');
      activeEl.style.removeProperty('outline');
      activeEl.style.removeProperty('outline-offset');
      activeEl.style.removeProperty('border-radius');
      activeEl = null;
      window.parent.postMessage({ type: 'slide-body-update', html: getBodyHtml() }, '*');
    }
  }

  document.addEventListener('click', function(e) {
    var target = e.target.closest(EDITABLE);
    if (!target) {
      commitEdit();
      return;
    }
    if (target === activeEl) return;
    commitEdit();
    activeEl = target;
    target.setAttribute('contenteditable', 'true');
    target.style.outline = '2px solid rgba(59,130,246,0.5)';
    target.style.outlineOffset = '2px';
    target.style.borderRadius = '2px';
    target.focus();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      commitEdit();
    }
  });

  // Hover effect
  document.addEventListener('mouseover', function(e) {
    var target = e.target.closest(EDITABLE);
    if (target && target !== activeEl) {
      target.setAttribute('data-edit-hover', '');
      target.style.outline = '1px dashed rgba(59,130,246,0.3)';
      target.style.outlineOffset = '2px';
      target.style.borderRadius = '2px';
    }
  });
  document.addEventListener('mouseout', function(e) {
    var target = e.target.closest(EDITABLE);
    if (target && target !== activeEl) {
      target.removeAttribute('data-edit-hover');
      target.style.removeProperty('outline');
      target.style.removeProperty('outline-offset');
      target.style.removeProperty('border-radius');
    }
  });
})();
`;

type SlideFrameProps = {
  body: string;
  head?: string;
  containerWidth: number;
  className?: string;
  pointerEvents?: boolean;
  editable?: boolean;
  onBodyChange?: (body: string) => void;
};

export function SlideFrame({
  body,
  head = "",
  containerWidth,
  className,
  pointerEvents = false,
  editable = false,
  onBodyChange,
}: SlideFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const scale = containerWidth / SLIDE_WIDTH;
  const containerHeight = containerWidth * (SLIDE_HEIGHT / SLIDE_WIDTH);
  // Skip srcDoc updates when the change came from inline editing
  const skipNextUpdateRef = useRef(false);
  const srcDocRef = useRef("");

  const editScript = editable ? `<script>${INLINE_EDIT_SCRIPT}</script>` : "";

  const newSrcDoc = `<!DOCTYPE html>
<html style="background:transparent">
<head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script>${head}</head>
<body style="margin:0;padding:0;width:${SLIDE_WIDTH}px;height:${SLIDE_HEIGHT}px;overflow:hidden;">
${body}
${editScript}
</body>
</html>`;

  // Only update srcDoc when the change is external (not from inline edit)
  if (skipNextUpdateRef.current) {
    skipNextUpdateRef.current = false;
  } else {
    srcDocRef.current = newSrcDoc;
  }

  const srcDoc = srcDocRef.current;

  useEffect(() => {
    setLoaded(false);
  }, [srcDoc]);

  const handleLoad = useCallback(() => setLoaded(true), []);

  // Listen for postMessage from iframe
  useEffect(() => {
    if (!editable || !onBodyChange) return;
    const handler = (e: MessageEvent) => {
      const data = e.data as { type?: string; html?: string };
      if (data.type === "slide-body-update" && typeof data.html === "string") {
        skipNextUpdateRef.current = true;
        onBodyChange(data.html);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [editable, onBodyChange]);

  const containerStyle: CSSProperties = {
    width: containerWidth,
    height: containerHeight,
    overflow: "hidden",
    position: "relative",
  };

  const iframeStyle: CSSProperties = {
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    transform: `scale(${scale})`,
    transformOrigin: "top left",
    border: "none",
    pointerEvents: pointerEvents || editable ? "auto" : "none",
    opacity: loaded ? 1 : 0,
    transition: "opacity 100ms ease-in",
  };

  return (
    <div className={cn("bg-surface-base", className)} style={containerStyle}>
      <iframe
        srcDoc={srcDoc}
        style={iframeStyle}
        title="Slide preview"
        onLoad={handleLoad}
      />
    </div>
  );
}

export function ResponsiveSlideFrame({
  body,
  head,
  className,
  pointerEvents = false,
  editable = false,
  onBodyChange,
}: Omit<SlideFrameProps, "containerWidth">) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setWidth(entry.contentRect.width);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden", className)}
      style={{ aspectRatio: `${SLIDE_WIDTH} / ${SLIDE_HEIGHT}` }}
    >
      {width > 0 && (
        <SlideFrame
          body={body}
          head={head}
          containerWidth={width}
          pointerEvents={pointerEvents}
          editable={editable}
          onBodyChange={onBodyChange}
        />
      )}
    </div>
  );
}
