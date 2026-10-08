import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { ErrorScreen } from "@lens/ui";

// Last-resort screen for anything that throws while rendering. Deliberately
// dependency-free (no queries, no session) so it can never crash itself.
const STALE_CHUNK = /dynamically imported module|Loading chunk|Importing a module script failed/i;

export function RouteError() {
  const error = useRouteError();
  console.error(error);

  if (isRouteErrorResponse(error) && error.status === 404) {
    return (
      <ErrorScreen
        title="Không tìm thấy trang"
        description="Đường dẫn không tồn tại hoặc đã được thay đổi."
      />
    );
  }
  if (error instanceof Error && STALE_CHUNK.test(error.message)) {
    return (
      <ErrorScreen
        title="Đã có phiên bản mới"
        description="Trang vừa được cập nhật. Tải lại để dùng phiên bản mới nhất."
      />
    );
  }
  return (
    <ErrorScreen
      details={
        import.meta.env.DEV && error instanceof Error
          ? `${error.message}

${error.stack ?? ""}`
          : undefined
      }
    />
  );
}
