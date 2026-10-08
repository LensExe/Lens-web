import { useMutation } from "@tanstack/react-query";
import { getGoogleLoginUrl } from "@/services/backend/auth";
import { login, register } from "@/services/auth";

export function useLogin() {
  return useMutation({ mutationFn: login });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}

export function useGoogleLogin() {
  return useMutation({ mutationFn: getGoogleLoginUrl });
}
