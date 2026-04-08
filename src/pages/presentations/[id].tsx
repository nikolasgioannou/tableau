import { Ellipsis, Trash2 } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatPanel } from "~/components/editor/chat-panel";
import { SlideHtmlEditor } from "~/components/editor/slide-html-editor";
import { SlidePreview } from "~/components/editor/slide-preview";
import { SlideStrip } from "~/components/editor/slide-strip";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
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

  const deletePresentationMutation = api.presentation.delete.useMutation({
    onSuccess: async () => {
      void utils.presentation.list.invalidate();
      await router.push("/presentations");
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-select: pick first slide if none selected, or fix if active was deleted
  useEffect(() => {
    if (!presentation?.slides) return;
    if (presentation.slides.length === 0) {
      setActiveSlideId(null);
      return;
    }
    if (
      !activeSlideId ||
      !presentation.slides.some((s) => s.id === activeSlideId)
    ) {
      setActiveSlideId(presentation.slides[0]!.id);
    }
  }, [presentation?.slides, activeSlideId]);

  const activeSlide = useMemo(
    () => presentation?.slides.find((s) => s.id === activeSlideId) ?? null,
    [presentation?.slides, activeSlideId],
  );

  const handleSlidesChanged = useCallback(() => {
    void utils.presentation.getById.invalidate({ id: presentationId });
  }, [utils.presentation.getById, presentationId]);

  const handleUpdateSlide = useCallback(
    (fields: { head: string; body: string }) => {
      if (!activeSlide) return;
      updateSlideMutation.mutate({ id: activeSlide.id, ...fields });
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

  if (!presentationId) return null;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="border-border-default border-t-accent-default h-8 w-8 animate-spin rounded-full border-2" />
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
        <title>{presentation.name} | Tableau</title>
      </Head>
      <div className="flex h-screen flex-col">
        {/* Top bar */}
        <div className="border-border-default flex items-center justify-between border-b px-4 py-2">
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
                className="text-text-primary hover:bg-surface-raised rounded px-1 py-0.5 text-sm font-medium"
              >
                {presentation.name}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Ellipsis size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-destructive-default focus:text-destructive-default gap-2"
                >
                  <Trash2 size={14} />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={handleExport}>
              Export PDF
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: slides */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <Tabs
              defaultValue="preview"
              className="flex flex-1 flex-col overflow-hidden"
            >
              <div className="border-border-default flex items-center border-b px-4 py-1.5">
                <TabsList>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="code">Code</TabsTrigger>
                </TabsList>
                {activeSlide && (
                  <span className="text-text-tertiary ml-3 text-xs">
                    Slide {activeSlide.index + 1} of{" "}
                    {presentation.slides.length}
                  </span>
                )}
              </div>

              <TabsContent value="preview" className="flex overflow-auto">
                {activeSlide ? (
                  <SlidePreview
                    body={activeSlide.body}
                    head={activeSlide.head}
                  />
                ) : (
                  <div className="text-text-tertiary flex flex-1 items-center justify-center">
                    <p>No slides yet. Ask the AI to create one.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="code" className="overflow-hidden">
                {activeSlide ? (
                  <SlideHtmlEditor
                    key={activeSlide.id}
                    head={activeSlide.head}
                    body={activeSlide.body}
                    onUpdate={handleUpdateSlide}
                  />
                ) : (
                  <div className="bg-surface-subtle text-text-tertiary flex h-full items-center justify-center">
                    <p className="text-sm">No slide selected</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Slide strip */}
            <div className="border-border-default h-[140px] flex-shrink-0 border-t">
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

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete presentation</DialogTitle>
            <DialogDescription>
              This will permanently delete this presentation and all its slides.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deletePresentationMutation.mutate({ id: presentationId });
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
