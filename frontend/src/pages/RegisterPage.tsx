import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GoogleLogo } from "@/components/auth/GoogleLogo";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { setAuthSession, type AuthUser } from "@/lib/auth";

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};
const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim();

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback": () => void;
        },
      ) => number;
      reset: (widgetId?: number) => void;
      ready: (callback: () => void) => void;
    };
  }
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement | null>(null);
  const recaptchaWidgetId = useRef<number | null>(null);

  useEffect(() => {
    if (!recaptchaSiteKey) return;
    const scriptId = "google-recaptcha-script";
    const renderCaptcha = () => {
      if (
        !recaptchaRef.current ||
        !window.grecaptcha ||
        recaptchaWidgetId.current !== null
      )
        return;
      window.grecaptcha.ready(() => {
        if (
          !recaptchaRef.current ||
          !window.grecaptcha ||
          recaptchaWidgetId.current !== null
        )
          return;
        recaptchaWidgetId.current = window.grecaptcha.render(
          recaptchaRef.current,
          {
            sitekey: recaptchaSiteKey,
            callback: setCaptchaToken,
            "expired-callback": () => setCaptchaToken(""),
          },
        );
      });
    };

    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderCaptcha;
      document.body.appendChild(script);
    } else {
      renderCaptcha();
    }
  }, []);

  async function continueWithGoogle() {
    setGoogleLoading(true);
    setError("");
    try {
      const data = await apiFetch<{ url: string }>("/auth/google/url", {
        skipAuth: true,
      });
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google register failed");
      setGoogleLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    if (recaptchaSiteKey && !captchaToken) {
      setError("Please complete the captcha.");
      setLoading(false);
      return;
    }
    try {
      const data = await apiFetch<AuthResponse>("/auth/register", {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ name, email, password, captchaToken }),
      });
      setAuthSession(data.accessToken, data.refreshToken, data.user);
      navigate("/all-files");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Register failed");
      if (recaptchaWidgetId.current !== null)
        window.grecaptcha?.reset(recaptchaWidgetId.current);
      setCaptchaToken("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] p-5">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-bg-brand)] text-[var(--color-button-primary-text)]">
            <HardDrive className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-[var(--color-text-primary)]">
              Register
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Create your storage gateway account.
            </p>
          </div>
        </div>
        <form onSubmit={submit} className="mt-6 grid gap-4">
          <label className="grid gap-2 text-sm font-semibold">
            Name
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Email
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            Password
            <Input
              type="password"
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {recaptchaSiteKey ? (
            <div className="min-h-[78px] overflow-hidden rounded-xl bg-[var(--color-bg-tertiary)] p-2">
              <div ref={recaptchaRef} />
            </div>
          ) : null}
          {error ? (
            <p className="rounded-xl bg-[var(--color-bg-danger-subtle)] p-3 text-sm text-[var(--color-text-danger)]">
              {error}
            </p>
          ) : null}
          <Button disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </Button>
        </form>
        <div className="mt-4 grid gap-3">
          <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-quaternary)]">
            <span className="h-px flex-1 bg-[var(--color-card-border)]" />
            or
            <span className="h-px flex-1 bg-[var(--color-card-border)]" />
          </div>
          <Button
            variant="outline"
            disabled={googleLoading}
            onClick={continueWithGoogle}
          >
            <GoogleLogo />
            {googleLoading
              ? "Redirecting..."
              : "Continue with Google and connect Drive"}
          </Button>
        </div>
        <p className="mt-5 text-center text-sm text-[var(--color-text-tertiary)]">
          Already registered?{" "}
          <Link
            className="font-bold text-[var(--color-text-brand)]"
            to="/login"
          >
            Login
          </Link>
        </p>
      </Card>
    </main>
  );
}
