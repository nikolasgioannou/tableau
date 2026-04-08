import { cn } from "~/lib/cn";
import { SlideFrame } from "~/components/slide-frame";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";

type Slide = {
  id: string;
  index: number;
  head: string;
  body: string;
};

type SlideStripProps = {
  slides: Slide[];
  activeSlideId: string | null;
  onSelectSlide: (id: string) => void;
  onDeleteSlide: (id: string) => void;
};

const THUMB_WIDTH = 192;

export function SlideStrip({
  slides,
  activeSlideId,
  onSelectSlide,
  onDeleteSlide,
}: SlideStripProps) {
  return (
    <div className="flex h-full items-center gap-3 overflow-x-auto px-4 py-3">
      {slides.map((slide) => (
        <ContextMenu key={slide.id}>
          <ContextMenuTrigger>
            <button
              onClick={() => onSelectSlide(slide.id)}
              className={cn(
                "relative flex-shrink-0 cursor-pointer rounded-md border-2 transition-all",
                activeSlideId === slide.id
                  ? "border-accent-default"
                  : "border-border-default hover:border-border-strong",
              )}
            >
              <SlideFrame
                body={slide.body}
                head={slide.head}
                containerWidth={THUMB_WIDTH}
                className="rounded"
              />
              <span className="bg-surface-overlay/80 text-text-secondary absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium">
                {slide.index + 1}
              </span>
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem
              onClick={() => onDeleteSlide(slide.id)}
              className="text-destructive-default focus:text-destructive-default"
            >
              Delete slide
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      ))}
    </div>
  );
}
