import { useState, type ReactNode } from "react";
import { Aperture } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@lens/ui";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";
import { AuthModalContext } from "./auth-modal-context";

type AuthMode = "login" | "signup";

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<AuthMode>("login");

  const openWith = (m: AuthMode) => {
    setMode(m);
    setOpen(true);
  };

  return (
    <AuthModalContext.Provider
      value={{ openLogin: () => openWith("login"), openSignup: () => openWith("signup") }}
    >
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        {/* `auth-dialog` drives the center-sliver → horizontal burst animation
            (see globals.css). */}
        <DialogContent className="auth-dialog rounded-[24px] p-7 sm:max-w-md">
          <DialogTitle className="sr-only">Đăng nhập hoặc đăng ký</DialogTitle>
          <DialogDescription className="sr-only">
            Chọn vai trò và tiếp tục vào nền tảng Lens.
          </DialogDescription>

          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-foreground text-background">
              <Aperture className="size-5" />
            </span>
            <span className="text-xl font-semibold tracking-tight">Lens</span>
          </div>

          <Tabs
            value={mode}
            onValueChange={(v) => setMode(v as AuthMode)}
            className="mt-5"
          >
            <TabsList className="w-full">
              <TabsTrigger value="login">Đăng nhập</TabsTrigger>
              <TabsTrigger value="signup">Đăng ký</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <LoginForm
                showHeading={false}
                showSwitchLink={false}
                onNavigateAway={() => setOpen(false)}
              />
            </TabsContent>
            <TabsContent value="signup" className="mt-5">
              <SignupForm
                showHeading={false}
                showSwitchLink={false}
                onNavigateAway={() => setOpen(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AuthModalContext.Provider>
  );
}
