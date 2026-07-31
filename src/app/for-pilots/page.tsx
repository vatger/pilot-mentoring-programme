import PageLayout from "@/components/PageLayout";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function ForPilotsPage() {
  return (
    <PageLayout>
      <h1>For Pilots</h1>
      <p style={{ margin: "0 0 1.5rem 0", color: "var(--text-color)" }}>
        Informationen zum Training, zur Anmeldung und die Trainingsverfolgung für aktive Trainees.
      </p>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3>PMP – Dein Weg zum Online-Fliegen</h3>
        <p style={{ color: "var(--text-color)" }}>
          Wir machen dich in unserem PMP fit für das Online-Fliegen auf Vatsim. Die fliegerischen Grundlagen musst du mitbringen. Du musst also wissen, wie du dein Flugzeug bedienst, wie du es vom Start bis zur Landung fliegst und wie du grundsätzlich Flüge planst und navigierst.
        </p>
        <p style={{ color: "var(--text-color)" }}>
          Du hast die Wahl: Möchtest du ein Vatsim Germany IFR-Training absolvieren, hast du andere Wünsche bezüglich des Trainings oder suchst du eher einen Ansprechpartner für Fragen, die sich beim Online-Fliegen ergeben?
        </p>
        <p style={{ color: "var(--text-color)" }}>
          Das Airliner-Training machen wir hauptsächlich mit dem A320/A20N in den Flugsimulatoren von Microsoft. Natürlich kannst du auch mit X-Plane oder einem anderen Simulator fliegen, auch mit anderen Flugzeugen. Für das IFR-Training haben wir einen Trainingsplan, den wir mit dir durcharbeiten und den du auch selbstständig nutzen sollst.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <h3>Anmeldung</h3>
        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <div className="card card-link" style={{ margin: 0 }}>
            <h4>Ready for IFR: Dein Airliner-Training</h4>
            <p>Du durchläufst mit einem unserer Mentoren ein vollständiges IFR-Flugtraining mit einem Airliner. Das fängt an mit der Wiederholung von Inhalten aus dem New Member Orientation Course, geht weiter mit theoretischen Grundlagen und praktischen Übungen und endet mit einem Online-Checkflug.</p>
            <p>Über den Verlauf mehrerer Wochen lernst du alle relevanten Prozeduren und die Kommunikation mit ATC, so dass du sicher am virtuellen Himmel unterwegs bist.</p>
            <p>Wir erwarten von dir zeitliche Verfügbarkeit, Zuverlässigkeit bei der Termineinhaltung und Eigeninitiative beim selbstständigen Lernen und Üben zwischen den Trainingssessions.</p>
            <p>Wenn du das machen möchtest, fülle bitte unsere Anmeldung aus, und es kann sehr bald losgehen!</p>
            <a className="button" href="https://board.vatsim-germany.org/threads/pmp-training-dein-weg-zum-online-piloten.74740/" target="_blank" rel="noreferrer" style={{ marginTop: "8px", display: "inline-block" }}>
              Zur Anmeldung <ArrowUpRight className='linkArrow'></ArrowUpRight>
            </a>
          </div>
          <div className="card card-link" style={{ margin: 0 }}>
            <h4>Dein Mentor, dein Ansprechpartner</h4>
            <p>Du möchtest nicht das Airliner-Training, sondern hast einen anderen Trainingswunsch? IFR mit kleineren Flugzeugen, VFR, besondere Verfahren wie z.B. RNP-Anflüge, Helikopter?</p>
            <p>Du möchtest einfach nur einen Ansprechpartner für Fragen zum Online-Fliegen. Du kennst dich schon gut genug auf dem Netzwerk und mit der Fliegerei aus und kommst zurecht, hast aber immer mal wieder Fragen oder möchtest bestimmte Situationen trainieren?</p>
            <p>Dann kannst du hier einen Mentor anfragen, der dann dein Ansprechpartner auf dem Netzwerk ist - so lange ihr beide aktiv seid.</p>
            <p>Natürlich kannst du auch dann immer noch in ein reguläres Training einsteigen.</p>
            <a className="button" href="https://board.vatsim-germany.org/threads/pmp-training-dein-weg-zum-online-piloten.74740/" target="_blank" rel="noreferrer" style={{ marginTop: "8px", display: "inline-block" }}>
              Zur Anmeldung <ArrowUpRight className='linkArrow'></ArrowUpRight>
            </a>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Trainingsverfolgung für aktive Trainees</h3>
        <p style={{ color: "var(--text-color)", marginBottom: "0.75rem" }}>
          Melde dich mit deinem VATSIM-Account an, um deinen Fortschritt zu sehen.
        </p>
        <Link className="button" href="/trainee/progress">
          Zum Fortschritt <ArrowUpRight className='linkArrow'></ArrowUpRight>
        </Link>
      </div>
    </PageLayout>
  );
}
