import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export function GoogleConnectedPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get("status") ?? "success";
  const ok = status === "success";

  useEffect(() => {
    window.opener?.postMessage(
      { type: "GOOGLE_CONNECTED", status },
      window.location.origin,
    );
    const timer = window.setTimeout(() => {
      if (window.opener) window.close();
      else navigate("/settings");
    }, 800);
    return () => window.clearTimeout(timer);
  }, [navigate, status]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-bg-primary)] p-5">
      <Card className="w-full max-w-sm p-6 text-center">
        {ok ? (
          <CheckCircle className="mx-auto h-10 w-10 text-[var(--color-text-success)]" />
        ) : (
          <XCircle className="mx-auto h-10 w-10 text-[var(--color-text-danger)]" />
        )}
        <h1 className="mt-4 text-xl font-extrabold text-[var(--color-text-primary)]">
          {ok ? "Google Drive Connected" : "Connection Failed"}
        </h1>
        <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
          {ok
            ? "This window will close automatically."
            : "Close this window and try again."}
        </p>
      </Card>
    </main>
  );
}
