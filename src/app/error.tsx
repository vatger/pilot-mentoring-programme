'use client';

import AnimatedError from '@/components/AnimatedError';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  // keep minimal diagnostic info to avoid leaking sensitive data
  return (
    <AnimatedError
      title="Etwas ist schiefgelaufen"
      message="Es gab einen Fehler beim Laden der Seite. Versuche es erneut oder kehre zur Startseite zurück."
      reset={reset}
      showHome={true}
    />
  );
}
