"use client";

import { Button } from "@/components/button";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Field, FieldGroup } from "@/components/field";
import { Input } from "@/components/input";
import { signIn } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { routes } from "@/config/routes";

const Page = () => {
  const t = useTranslations();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show_password_input, set_show_password_input] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Root scroll container ref (optional but useful for future scroll-to-bottom logic)
  const pageRef = useRef<HTMLDivElement | null>(null);

  const [pageHeight, setPageHeight] = useState<number | null>(null);

  const updatePageHeight = () => {
    setPageHeight(window.innerHeight);
  };

  useEffect(() => {
    updatePageHeight(); // initial
    window.addEventListener("resize", updatePageHeight);
    return () => window.removeEventListener("resize", updatePageHeight);
  }, []);

  // Handle "Continue" click – validate email and reveal password
  const handleContinue = () => {
    if (!email.trim()) {
      setError(t("general.email_required") || "Email is required");
      return;
    }
    setError(null);
    set_show_password_input(true);
  };

  // Handle final sign-in
    const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("general.all_fields_required") || "All fields are required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: signInError } = await signIn.email({
        email: email.trim(),
        password: password.trim(),
        // Optional: rememberMe: true,
        // Optionally provide a callback URL; Better Auth will redirect there on success
        callbackURL: routes.default, // change to your dashboard or home page
        rememberMe: true,
      });

      if (signInError) {
        // Better Auth returns an error object with a message
        throw new Error(signInError.message || t("general.login_error") || "Invalid credentials");
      }

      // If no error and no redirect happened (e.g., callbackURL not used),
      // manually redirect to the desired page.
      // Usually Better Auth handles the redirect when callbackURL is provided,
      // but we add a safety net.
      // if (data && !signInError) {
      //   // In case the callback didn't trigger a redirect, we do it ourselves.
      //   window.location.href = "/os"; // or use Next.js router
      // }
    } catch (err: any) {
      setError(err.message || t("general.login_error") || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key on inputs
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (show_password_input) {
        handleSignIn();
      } else {
        handleContinue();
      }
    }
  };

  return (
    <div
      ref={pageRef}
      style={{ height: `${pageHeight}px` }}
      className="flex items-center justify-center"
    >
      <div className="flex flex-col gap-y-6 px-6 w-sm tracking-[-1.5px]">
        <div className="flex flex-col gap-y-2">
          <div className="text-[25px] leading-8">
            {t("general.login_panel_title")} &nbsp;
            <span className="text-primary">
              — {t("general.login_panel_title_span")}
            </span>
          </div>
          <div className="text-[20px] opacity-80">
            — {t("general.login_panel_subtitle")}
          </div>
        </div>

          <FieldGroup className={cn(
            "w-full gap-y-1.5",
            show_password_input && "gap-y-3.5"
            )}>
            {/* —— EMAIL ADDRESS INPUT —— */}
            <Field className="flex flex-col gap-y-0.5">
              <div className="pl-5 text-sm tracking-[-0.8px] text-secondary/60">
                email address —
              </div>
              <Input
                id="fieldgroup-email"
                type="email"
                placeholder="hey@omidshabab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading}
                autoFocus
              />
            </Field>

            {/* —— PASSWORD INPUT with FADE-IN —— */}
            <div
              className={`
                transition-all duration-300 ease-in-out
                overflow-hidden
                ${show_password_input ? "opacity-100 translate-y-0" : "max-h-0 opacity-0 translate-y-2"}
              `}
            >
              <Field className="flex flex-col gap-y-0.5">
                <div className="pl-5 text-sm tracking-[-0.8px] text-secondary/60">
                  password —
                </div>
                <Input
                  id="fieldgroup-password"
                  type="password"
                  placeholder="YOUR-PASSWORD*"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
              </Field>
            </div>

            {error && (
              <div className="text-sm tracking-[-0.8px] text-primary pl-5 -mt-2">{error}</div>
            )}

            <Field orientation="horizontal">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                onClick={() => {
                  if (show_password_input) {
                    handleSignIn();
                  } else {
                    handleContinue();
                  }
                }}
                className={cn(
                  "w-full mt-2.5",
                  show_password_input && "mt-5"
                )}
              >
                {show_password_input
                  ? t("general.login_to_panel")
                  : "continue —"}
              </Button>
            </Field>
          </FieldGroup>
      </div>
    </div>
  );
};

export default Page;