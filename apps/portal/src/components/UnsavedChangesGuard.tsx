import { useEffect } from "react";
import { useBlocker } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@lens/ui";

/**
 * Asks before leaving a page that has unsaved edits — in-app navigation gets a
 * dialog, closing/reloading the tab gets the browser's own prompt.
 */
export function UnsavedChangesGuard({ when, message }: { when: boolean; message: string }) {
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => when && currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (!when) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [when]);

  return (
    <Dialog open={blocker.state === "blocked"} onOpenChange={(open) => !open && blocker.reset?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rời trang khi chưa lưu?</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" className="rounded-full" onClick={() => blocker.reset?.()}>
            Ở lại
          </Button>
          <Button variant="destructive" className="rounded-full" onClick={() => blocker.proceed?.()}>
            Rời trang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
