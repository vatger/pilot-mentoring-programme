import PageLayout from "@/components/PageLayout";
import Link from "next/link";

export default function ForPilotsPage() {
  return (
    <PageLayout>
      <h1>For Pilots</h1>
      <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-color)" }}>
        Alles an einem Ort: Informationen zum Training, Anmeldung und die Trainingsverfolgung für aktive Trainees.
      </p>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3>Informationen zum Training</h3>
        <p style={{ color: "var(--text-color)" }}>
          Hier entsteht ein kompakter Überblick zu Ablauf, Erwartungen und häufigen Fragen. (Platzhalter – Inhalte folgen.)
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3>Anmeldung</h3>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div className="card card-link" style={{ margin: 0 }}>
            <h4>Vollständiges Training</h4>
            <p>Komplette PMP-Begleitung durch unsere Mentoren. Das ist unser klassisches PMP-Training. Über den Verlauf mehrerer Wochen lernst du alle Netzwerkprozeduren und das funken, sodass du sicher im virtuellen Himmel unterwegs bist. Wenn das etwas für dich ist, so fülle doch bitte das 
              Anmeldeformular aus und es kann sehr bald losgehen!
            </p>
            <Link className="button" href="/anmeldung" style={{ marginTop: "8px" }}>
              Jetzt vollständig anmelden
            </Link>
          </div>
          <div className="card card-link" style={{ margin: 0 }}>
            <h4>Mentor als Ansprechpartner für Online-Fliegen</h4>
            <p>Du möchtest primär einen Mentor für Fragen zum Online-Fliegen. Du kennst dich schon gut mit dem Netzwerk und der Fliegerei aus, hast aber noch ein paar Fragen?
               Dann kannst du im Forum einen Mentor anschreiben, mit dem du dich dann vielleicht 1 oder 2 Mal austauschen kannst. Du kannst anschließend immer noch 
              das reguläre PMP-Training anfangen, wenn du möchtest.
            </p>
            <Link className="button" href="/anmeldung-forum" style={{ marginTop: "8px" }}>
              Mentor anfragen
            </Link>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Trainingsverfolgung für aktive Trainees</h3>
        <p style={{ color: "var(--text-color)", marginBottom: "0.75rem" }}>
          Melde dich mit deinem VATSIM-Account an, um deinen Fortschritt zu sehen.
        </p>
        <Link className="button" href="/trainee/progress">
          Zum Fortschritt
        </Link>
      </div>
    </PageLayout>
  );
}
