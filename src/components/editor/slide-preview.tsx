import { ResponsiveSlideFrame } from "~/components/slide-frame";

type SlidePreviewProps = {
  body: string;
  head?: string;
  onBodyChange?: (body: string) => void;
};

export function SlidePreview({ body, head, onBodyChange }: SlidePreviewProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <ResponsiveSlideFrame
          body={body}
          head={head}
          editable={!!onBodyChange}
          onBodyChange={onBodyChange}
          className="border-border-default rounded-lg border"
        />
      </div>
    </div>
  );
}
