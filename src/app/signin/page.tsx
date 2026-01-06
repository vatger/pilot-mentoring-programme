"use client";

import { useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import PageLayout from "@/components/PageLayout";

function SignInContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl") || "/trainings";
    // Immediately trigger VATGER provider login
    signIn("vatger", { callbackUrl });
  }, [searchParams]);

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
