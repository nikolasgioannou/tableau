import { ResponsiveSlideFrame } from "~/components/slide-frame";

type SlidePreviewProps = {
  html: string;
  slideIndex: number;
  totalSlides: number;
};

export function SlidePreview({
  html,
  slideIndex,
  totalSlides,
}: SlidePreviewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <ResponsiveSlideFrame html={html} className="rounded-lg border border-border-default shadow-sm" />
        <p className="mt-2 text-center text-xs text-text-tertiary">
          Slide {slideIndex + 1} of {totalSlides}
        </p>
      </div>
    </div>
  );
}
