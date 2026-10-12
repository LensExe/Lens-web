import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { currentUser, setCurrentUserEmailVerified } from "@/lib/session";
import { authApi } from "@/services/backend";
import { getGoogleLoginUrl } from "@/services/backend/auth";
import { login, register } from "@/services/auth";
import type { AuthOtpDto } from "@/types/auth";

export const emailVerificationKeys = {
  status: ["auth", "email-verification"] as const,
};

export function useLogin() {
  return useMutation({ mutationFn: login });
}

export function useRegister() {
  return useMutation({ mutationFn: register });
}

export function useGoogleLogin() {
  return useMutation({ mutationFn: getGoogleLoginUrl });
}

export function useEmailVerificationStatus() {
  return useQuery({
    queryKey: emailVerificationKeys.status,
    queryFn: () => currentUser.emailVerified,
    initialData: currentUser.emailVerified,
    staleTime: Infinity,
  });
}

export function useSendEmailVerificationOtp() {
  return useMutation({ mutationFn: authApi.sendEmailVerificationOtp });
}

export function useVerifyEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: AuthOtpDto) => authApi.verifyEmail(body),
    onSuccess: () => {
      setCurrentUserEmailVerified(true);
      queryClient.setQueryData(emailVerificationKeys.status, true);
    },
  });
}
