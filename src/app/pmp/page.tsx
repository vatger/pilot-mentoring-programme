import PageLayout from '@/components/PageLayout';
import Link from 'next/link';

export default function PMPPage() {
  return (
    <PageLayout>
    <h2>Das PMP stellt sich vor</h2>
      
      <div className="card">
        <h3>Was ist das PMP?</h3>
        <p>Das PMP ist eine Organisation innerhalb des Vatsim Germany Pilot Training Department (PTD).</p>
        <p>
        Es besteht aus einer Leitung und einem Team erfahrener Online-Piloten aus allen Altersgruppen, von denen viele auch Lotsen auf Vatsim sind.
        </p>
        <p>
        Wir bieten dir wertvolle Unterstützung in Form von individuellem Training, das dir hilft, dich in der komplexen Welt des virtuellen Flugverkehrs zurechtzufinden, damit du sicher und mit Freude bei uns online fliegen kannst.
        </p>
      </div>
      
      <div className="card">
        <h3>Wer kann teilnehmen?</h3>
        <p>Unser Programm richtet sich an alle VATSIM-Germany Mitglieder, die ihre Fähigkeiten als virtuelle Piloten verbessern möchten – unabhängig vom Erfahrungsstand. Besonders Einsteiger profitieren von unserem Mentoring, aber auch fortgeschrittene Piloten sind herzlich willkommen, um gezielt an bestimmten Themen zu arbeiten.</p>
        <p>PS: Auch Piloten aus anderen Ländern sind willkommen, allerdings werden die Trainings ausschließlich in deutscher Sprache durchgeführt.</p>
      </div>

      <div className="card">
        <h3>Voraussetzungen</h3>
        <ul>
          <li>Aktive Mitgliedschaft bei VATSIM</li>
          <li>Grundkenntnisse im Umgang mit Flugsimulatoren (Starten, Landen, Navigation)</li>
          <li>Bereitschaft, regelmäßig an Trainings teilzunehmen und Feedback anzunehmen</li>
        <li>Offenheit für neue Lerninhalte und Teamarbeit</li>
        </ul>
      </div>
      <Link href="/anmeldung-forum" className="card card-link">
        <h3>Ja, möchte ich machen.</h3>
        <p>Zur Anmeldung!</p>
      </Link>

      <Link href="/mentorenbewerbung" className="card card-link">
        <h3>Du möchtest selber Mentor werden?</h3>
        <p>Dann klick hier!</p>
      </Link>
    </PageLayout>
  );
}
