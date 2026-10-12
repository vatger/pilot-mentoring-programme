"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import CheckrideRubricEditor from "@/components/CheckrideRubricEditor";

export default function MentorCheckridePage() {
  const params = useParams<{ id: string }>();
  const checkrideId = params?.id;
  const { data: session, status } = useSession();
  const router = useRouter();

  const userRole = (session?.user as any)?.role;
  const canUsePage = ["MENTOR", "PMP_LEITUNG", "PMP_PRÜFER", "ADMIN"].includes(userRole);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !canUsePage) {
      router.push("/");
    }
  }, [status, canUsePage, router]);

  if (status === "loading") {
    return null;
  }

  if (!checkrideId || !canUsePage) {
    return null;
  }

  return (
    <CheckrideRubricEditor
      checkrideId={checkrideId}
      apiPath="/api/checkrides/mentor-assessment"
      title="Checkride Log"
      introText="Hier dokumentierst du den Checkride im gleichen Aufbau wie der Prüfer."
      noteField="notes"
      noteLabel="Anmerkungen"
      saveButtonLabel="Zwischenspeichern"
      finalizeButtonLabel="Log abschliessen"
    />
  );
}