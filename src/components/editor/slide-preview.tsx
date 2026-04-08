import { ResponsiveSlideFrame } from "~/components/slide-frame";

type SlidePreviewProps = {
  html: string;
};

export function SlidePreview({ html }: SlidePreviewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <ResponsiveSlideFrame html={html} className="rounded-lg border border-border-default" />
      </div>
    </div>
  );
}
