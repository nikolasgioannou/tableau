import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "~/lib/cn";

const SLIDE_WIDTH = 1280;
const SLIDE_HEIGHT = 720;

type SlideFrameProps = {
  html: string;
  containerWidth: number;
  className?: string;
  pointerEvents?: boolean;
};

export function SlideFrame({
  html,
  containerWidth,
  className,
  pointerEvents = false,
}: SlideFrameProps) {
  const scale = containerWidth / SLIDE_WIDTH;
  const containerHeight = containerWidth * (SLIDE_HEIGHT / SLIDE_WIDTH);

  const srcDoc = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;width:${SLIDE_WIDTH}px;height:${SLIDE_HEIGHT}px;overflow:hidden;">
${html}
</body>
</html>`;

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
  };

  return (
    <div className={cn("bg-white", className)} style={containerStyle}>
      <iframe srcDoc={srcDoc} style={iframeStyle} title="Slide preview" />
    </div>
  );
}

export function ResponsiveSlideFrame({
  html,
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
          html={html}
          containerWidth={width}
          pointerEvents={pointerEvents}
        />
      )}
    </div>
  );
}
