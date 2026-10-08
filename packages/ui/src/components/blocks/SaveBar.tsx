import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";

/**
 * Sticky "Thiết lập lại / Lưu" bar at the bottom of a settings form. Both
 * actions stay disabled until the form actually has unsaved changes.
 */
export function SaveBar({
  dirty,
  saving,
  onReset,
  resetLabel = "Thiết lập lại",
  saveLabel = "Lưu",
}: {
  dirty: boolean;
  saving: boolean;
  onReset: () => void;
  resetLabel?: string;
  saveLabel?: string;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-6 border-t border-border bg-background/85 px-5 py-3 backdrop-blur-md md:bottom-4 md:mx-0 md:rounded-2xl md:border md:px-4">
      <div className="flex items-center justify-end gap-2">
        {dirty && (
          <span className="mr-auto hidden text-sm text-muted-foreground sm:inline">
            Bạn có thay đổi chưa lưu
          </span>
        )}
        <Button
          type="button"
          variant="outline"
          className="rounded-full"
          disabled={!dirty || saving}
          onClick={onReset}
        >
          {resetLabel}
        </Button>
        <Button type="submit" className="rounded-full px-5" disabled={!dirty || saving}>
          {saving && <Spinner />}
          {saveLabel}
        </Button>
      </div>
    </div>
  );
}
