import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel } from "~/components/editor/chat-panel";
import { SlideHtmlEditor } from "~/components/editor/slide-html-editor";
import { SlidePreview } from "~/components/editor/slide-preview";
import { SlideStrip } from "~/components/editor/slide-strip";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useToast } from "~/components/ui/toast";
import { api } from "~/utils/api";

export default function PresentationEditorPage() {
  const router = useRouter();
  const { toast } = useToast();
  const presentationId = router.query.id as string;
  const utils = api.useUtils();

  const { data: presentation, isLoading } = api.presentation.getById.useQuery(
    { id: presentationId },
    { enabled: !!presentationId },
  );

  const updateNameMutation = api.presentation.update.useMutation({
    onSuccess: () => {
      void utils.presentation.getById.invalidate({ id: presentationId });
      void utils.presentation.list.invalidate();
    },
    onError: (err) => toast(err.message, "error"),
  });

  const updateSlideMutation = api.slide.update.useMutation({
    onSuccess: () => {
      void utils.presentation.getById.invalidate({ id: presentationId });
    },
    onError: (err) => toast(err.message, "error"),
  });

  const deleteSlideMutation = api.slide.delete.useMutation({
    onSuccess: () => {
      void utils.presentation.getById.invalidate({ id: presentationId });
    },
    onError: (err) => toast(err.message, "error"),
  });

  const [activeSlideId, setActiveSlideId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [dividerRatio, setDividerRatio] = useState(0.65);

  // Set active slide to first slide when data loads
  useEffect(() => {
    if (presentation?.slides && presentation.slides.length > 0 && !activeSlideId) {
      setActiveSlideId(presentation.slides[0]!.id);
    }
  }, [presentation?.slides, activeSlideId]);

  // Handle deleted active slide
  useEffect(() => {
    if (presentation?.slides && activeSlideId) {
      const exists = presentation.slides.some((s) => s.id === activeSlideId);
      if (!exists) {
        setActiveSlideId(presentation.slides[0]?.id ?? null);
      }
    }
  }, [presentation?.slides, activeSlideId]);

  const activeSlide = useMemo(
    () => presentation?.slides.find((s) => s.id === activeSlideId) ?? null,
    [presentation?.slides, activeSlideId],
  );

  const handleSlidesChanged = useCallback(() => {
    void utils.presentation.getById.invalidate({ id: presentationId });
  }, [utils.presentation.getById, presentationId]);

  const handleUpdateSlideHtml = useCallback(
    (html: string) => {
      if (!activeSlide) return;
      updateSlideMutation.mutate({ id: activeSlide.id, html });
    },
    [activeSlide, updateSlideMutation],
  );

  const handleDeleteSlide = useCallback(
    (id: string) => {
      if (!presentationId) return;
      deleteSlideMutation.mutate({ id, presentationId });
    },
    [presentationId, deleteSlideMutation],
  );

  const handleExport = useCallback(() => {
    window.open(`/api/export/${presentationId}`, "_blank");
  }, [presentationId]);

  const handleNameEdit = useCallback(() => {
    if (presentation) {
      setNameValue(presentation.name);
      setEditingName(true);
      setTimeout(() => nameInputRef.current?.focus(), 0);
    }
  }, [presentation]);

  const handleNameSave = useCallback(() => {
    if (nameValue.trim() && presentationId) {
      updateNameMutation.mutate({ id: presentationId, name: nameValue.trim() });
    }
    setEditingName(false);
  }, [nameValue, presentationId, updateNameMutation]);

  const handleDividerDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      const startY = e.clientY;
      const mainEl = (e.target as HTMLElement).closest("[data-main-area]");
      if (!mainEl) return;
      const rect = mainEl.getBoundingClientRect();
      const totalHeight = rect.height;
      const startRatio = dividerRatio;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaY = moveEvent.clientY - startY;
        const newRatio = Math.max(
          0.2,
          Math.min(0.85, startRatio + deltaY / totalHeight),
        );
        setDividerRatio(newRatio);
      };

      const handleMouseUp = () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [dividerRatio],
  );

  if (!presentationId) return null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border-default border-t-accent-default" />
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-tertiary">Presentation not found.</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{presentation.name} — Tableau</title>
      </Head>
      <div className="flex h-screen flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-border-default px-4 py-2">
          <div className="flex items-center gap-2">
            {editingName ? (
              <Input
                ref={nameInputRef}
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSave();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="h-7 w-64 text-sm"
              />
            ) : (
              <button
                onClick={handleNameEdit}
                className="rounded px-1 py-0.5 text-sm font-medium text-text-primary hover:bg-accent-subtle"
              >
                {presentation.name}
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleExport}>
            Export PDF
          </Button>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: slides */}
          <div className="flex flex-1 flex-col overflow-hidden" data-main-area>
            {/* Preview + HTML editor */}
            <div className="flex flex-1 flex-col overflow-hidden">
              {/* Preview area */}
              <div
                className="overflow-auto"
                style={{ height: `${dividerRatio * 100}%` }}
              >
                {activeSlide ? (
                  <SlidePreview
                    html={activeSlide.html}
                    slideIndex={activeSlide.index}
                    totalSlides={presentation.slides.length}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-text-tertiary">
                    <p>No slide selected. Add a slide or ask the AI to create one.</p>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div
                className="flex h-2 cursor-row-resize items-center justify-center hover:bg-accent-subtle"
                onMouseDown={handleDividerDrag}
              >
                <div className="h-0.5 w-8 rounded-full bg-border-strong" />
              </div>

              {/* HTML editor */}
              <div
                className="overflow-hidden"
                style={{ height: `${(1 - dividerRatio) * 100}%` }}
              >
                {activeSlide ? (
                  <SlideHtmlEditor
                    key={activeSlide.id}
                    html={activeSlide.html}
                    onUpdate={handleUpdateSlideHtml}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-surface-subtle text-text-tertiary">
                    <p className="text-sm">No slide selected</p>
                  </div>
                )}
              </div>
            </div>

            {/* Slide strip */}
            <div className="h-[140px] flex-shrink-0 border-t border-border-default">
              <SlideStrip
                slides={presentation.slides}
                activeSlideId={activeSlideId}
                onSelectSlide={setActiveSlideId}
                onDeleteSlide={handleDeleteSlide}
              />
            </div>
          </div>

          {/* Right: chat */}
          <ChatPanel
            presentationId={presentationId}
            onSlidesChanged={handleSlidesChanged}
          />
        </div>
      </div>
    </>
  );
}
