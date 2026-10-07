import { useMutation } from "@tanstack/react-query";
import { login, register } from "@/services/auth";

export function useLogin() {
  return useMutation({ mutationFn: login });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}
