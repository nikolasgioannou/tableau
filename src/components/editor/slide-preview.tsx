import { ResponsiveSlideFrame } from "~/components/slide-frame";

type SlidePreviewProps = {
  body: string;
  head?: string;
};

export function SlidePreview({ body, head }: SlidePreviewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <ResponsiveSlideFrame body={body} head={head} className="rounded-lg border border-border-default" />
      </div>
    </div>
  );
}
