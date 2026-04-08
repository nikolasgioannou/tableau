import { ChevronLeft, ChevronRight } from "lucide-react";
import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useState } from "react";
import { ResponsiveSlideFrame } from "~/components/slide-frame";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useToast } from "~/components/ui/toast";
import { api } from "~/utils/api";

function PresentationCard({
  id,
  name,
  slideCount,
  slides,
}: {
  id: string;
  name: string;
  slideCount: number;
  slides: string[];
}) {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);

  const goLeft = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentSlide((prev) => Math.max(0, prev - 1));
    },
    [],
  );

  const goRight = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setCurrentSlide((prev) => Math.min(slides.length - 1, prev + 1));
    },
    [slides.length],
  );

  const canGoLeft = currentSlide > 0;
  const canGoRight = currentSlide < slides.length - 1;

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-lg border border-border-default bg-surface-base transition-colors hover:border-border-strong"
      onClick={() => router.push(`/presentations/${id}`)}
    >
      <div className="relative border-b border-border-default">
        <ResponsiveSlideFrame
          html={slides[currentSlide] ?? ""}
          className="rounded-t-lg"
        />
        {slides.length > 1 && (
          <>
            {canGoLeft && (
              <button
                onClick={goLeft}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 rounded-full border border-border-default bg-surface-overlay/80 p-1 text-text-secondary opacity-0 transition-opacity hover:bg-surface-raised hover:text-text-primary group-hover:opacity-100"
              >
                <ChevronLeft size={14} />
              </button>
            )}
            {canGoRight && (
              <button
                onClick={goRight}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full border border-border-default bg-surface-overlay/80 p-1 text-text-secondary opacity-0 transition-opacity hover:bg-surface-raised hover:text-text-primary group-hover:opacity-100"
              >
                <ChevronRight size={14} />
              </button>
            )}
          </>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate text-sm font-medium text-text-primary">
          {name}
        </h3>
        <p className="text-xs text-text-tertiary">
          {slideCount} {slideCount === 1 ? "slide" : "slides"}
        </p>
      </div>
    </div>
  );
}

export default function PresentationsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();

  const { data: presentations, isLoading } = api.presentation.list.useQuery();
  const createMutation = api.presentation.create.useMutation({
    onSuccess: async (p) => {
      await utils.presentation.list.invalidate();
      await router.push(`/presentations/${p.id}`);
    },
    onError: (err) => toast(err.message, "error"),
  });

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim() });
    setNewName("");
    setShowCreate(false);
  };

  return (
    <>
      <Head>
        <title>Presentations — Tableau</title>
      </Head>
      <div className="p-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-text-primary">
            Presentations
          </h1>
          <Button onClick={() => setShowCreate(true)}>
            New Presentation
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="aspect-video animate-pulse rounded-lg bg-surface-raised"
              />
            ))}
          </div>
        ) : presentations && presentations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {presentations.map((p) => (
              <PresentationCard
                key={p.id}
                id={p.id}
                name={p.name}
                slideCount={p.slideCount}
                slides={p.slides}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="mb-4 text-text-tertiary">
              No presentations yet. Create your first one to get started.
            </p>
            <Button onClick={() => setShowCreate(true)}>
              New Presentation
            </Button>
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Presentation</DialogTitle>
            <DialogDescription>
              Give your presentation a name to get started.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder="My Presentation"
              autoFocus
              className="mt-1.5"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!newName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
