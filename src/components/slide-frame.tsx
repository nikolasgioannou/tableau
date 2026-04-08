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

type SlideFrameProps = {
  body: string;
  head?: string;
  containerWidth: number;
  className?: string;
  pointerEvents?: boolean;
};

export function SlideFrame({
  body,
  head = "",
  containerWidth,
  className,
  pointerEvents = false,
}: SlideFrameProps) {
  const [loaded, setLoaded] = useState(false);
  const scale = containerWidth / SLIDE_WIDTH;
  const containerHeight = containerWidth * (SLIDE_HEIGHT / SLIDE_WIDTH);

  const srcDoc = `<!DOCTYPE html>
<html style="background:transparent">
<head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script>${head}</head>
<body style="margin:0;padding:0;width:${SLIDE_WIDTH}px;height:${SLIDE_HEIGHT}px;overflow:hidden;">
${body}
</body>
</html>`;

  // Reset loaded state when content changes
  useEffect(() => {
    setLoaded(false);
  }, [body, head]);

  const handleLoad = useCallback(() => setLoaded(true), []);

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
    pointerEvents: pointerEvents ? "auto" : "none",
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
        />
      )}
    </div>
  );
}
