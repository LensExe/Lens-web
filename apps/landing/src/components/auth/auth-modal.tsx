import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  Logo,
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

          <div className="flex items-center">
            <Logo className="h-7" />
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
