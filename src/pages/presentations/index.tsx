import Head from "next/head";
import { useRouter } from "next/router";
import { useState } from "react";
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
              <div
                key={p.id}
                className="cursor-pointer overflow-hidden rounded-lg border border-border-default bg-surface-base transition-colors hover:border-border-strong"
                onClick={() => router.push(`/presentations/${p.id}`)}
              >
                <div className="border-b border-border-default">
                  <ResponsiveSlideFrame
                    body={p.firstSlideBody}
                    head={p.firstSlideHead}
                    className="rounded-t-lg"
                  />
                </div>
                <div className="p-3">
                  <h3 className="truncate text-sm font-medium text-text-primary">
                    {p.name}
                  </h3>
                  <p className="text-xs text-text-tertiary">
                    {p.slideCount} {p.slideCount === 1 ? "slide" : "slides"}
                  </p>
                </div>
              </div>
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
