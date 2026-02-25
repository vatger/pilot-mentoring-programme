"use client";

import { useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import PageLayout from "@/components/PageLayout";

function SignInContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  const getSafeCallbackUrl = () => {
    const rawCallbackUrl = searchParams.get("callbackUrl")?.trim();
    if (!rawCallbackUrl || typeof window === "undefined") return "";

    try {
      const resolved = new URL(rawCallbackUrl, window.location.origin);
      if (resolved.origin !== window.location.origin) return "";
      return `${resolved.pathname}${resolved.search}${resolved.hash}`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    // If user is already authenticated, redirect based on role
    if (status === "authenticated" && session?.user) {
      const callbackUrl = getSafeCallbackUrl();
      if (callbackUrl && callbackUrl !== "/signin") {
        router.push(callbackUrl);
        return;
      }

      const role = (session.user as any).role;
      let redirectUrl = "/trainings"; // default

      // Determine redirect based on role
      switch (role) {
        case "VISITOR":
          redirectUrl = "/anmeldung";
          break;
        case "TRAINEE":
        case "PENDING_TRAINEE":
        case "COMPLETED_TRAINEE":
          redirectUrl = "/trainee/progress";
          break;
        case "MENTOR":
        case "PMP_PRÜFER":
        case "PMP_LEITUNG":
        case "ADMIN":
          redirectUrl = "/mentor/dashboard";
          break;
        default:
          redirectUrl = "/trainings";
      }

      router.push(redirectUrl);
      return;
    }

    // If not authenticated and not loading, trigger sign in
    if (status === "unauthenticated") {
      const callbackUrl = getSafeCallbackUrl() || "/signin?postauth=true";
      // Trigger VATGER provider login
      signIn("vatger", { callbackUrl: `${window.location.origin}${callbackUrl}` });
    }
  }, [status, session, searchParams, router]);

  return (
    <PageLayout>
      <div className="header-container">
        <div className="header">
          <h1>Weiterleitung zur Anmeldung…</h1>
        </div>
      </div>
      <div className="card">
        <p>Bitte warten, du wirst zur Anmeldeseite umgeleitet.</p>
      </div>
    </PageLayout>
  );
}

export default function SignInRedirectPage() {
  return (
    <Suspense fallback={<PageLayout><div className="card"><p>Laden...</p></div></PageLayout>}>
      <SignInContent />
    </Suspense>
  );
}
