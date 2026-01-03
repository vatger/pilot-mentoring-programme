"use client";

import { useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl") || "/trainings";
    // Immediately trigger VATGER provider login
    signIn("vatger", { callbackUrl });
  }, [searchParams]);

  return (
    <div className="container">
      <div className="header-container">
        <div className="header">
          <h1>Weiterleitung zur Anmeldung…</h1>
        </div>
      </div>
      <div className="card">
        <p>Bitte warten, du wirst zur Anmeldeseite umgeleitet.</p>
      </div>
    </div>
  );
}

export default function SignInRedirectPage() {
  return (
    <Suspense fallback={<div className="container"><p>Laden...</p></div>}>
      <SignInContent />
    </Suspense>
  );
}
