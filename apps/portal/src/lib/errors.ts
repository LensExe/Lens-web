import { isAxiosError } from "axios";

/** The API's Vietnamese `message` for a failed request, else `fallback`. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError<{ message?: string }>(err)) return err.response?.data?.message ?? fallback;
  return fallback;
}

export const isConflict = (err: unknown) => isAxiosError(err) && err.response?.status === 409;
