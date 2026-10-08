import { useMutation } from "@tanstack/react-query";
import { login } from "@/services/auth";

export function useAdminLogin() {
  return useMutation({ mutationFn: login });
}
