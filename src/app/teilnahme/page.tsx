import PageLayout from '@/components/PageLayout';

export default function TeilnahmePage() {
  return (
    <PageLayout>
      <h2>So nehmen Sie am PMP teil</h2>
      
      <div className="card">
        <h3>Wer kann teilnehmen?</h3>
        <p>
          Unser Programm richtet sich an alle VATSIM-Germany Mitglieder, die ihre Fähigkeiten als virtuelle Piloten verbessern möchten – unabhängig vom Erfahrungsstand. 
          Besonders Einsteiger profitieren von unserem Mentoring, aber auch fortgeschrittene Piloten sind herzlich willkommen, um gezielt an bestimmten Themen zu arbeiten.
        </p>
      </div>
      
      <div className="card">
        <h3>Voraussetzungen für Mentees</h3>
        <ul>
          <li>Aktive Mitgliedschaft bei VATSIM</li>
          <li>Grundkenntnisse im Umgang mit Flugsimulatoren (Starten, Landen, Navigation)</li>
          <li>Bereitschaft, regelmäßig an Trainings teilzunehmen und Feedback anzunehmen</li>
          <li>Offenheit für neue Lerninhalte und Teamarbeit</li>
        </ul>
      </div>
      
      <div className="card">
        <h3>Anmeldung & Ablauf</h3>
        <p>
          Die Anmeldung erfolgt über das <a href="https://board.vatsim-germany.org/forums/piloten-mentoren-programm.739/" target="_blank">VATSIM Germany Forum</a> oder per E-Mail an das PMP-Team. 
          Nach Deiner Anmeldung nehmen wir Kontakt mit Dir auf, um Deine Ziele und Wünsche zu besprechen. Anschließend wirst Du einem passenden Mentor zugeteilt und erhältst einen individuellen Trainingsplan.
        </p>
        <ul>
          <li>1. Anmeldung im Forum</li>
          <li>2. Persönliches Kennenlernen und Zieldefinition</li>
          <li>3. Start des Mentorings mit regelmäßigen Sessions</li>
        </ul>
      </div>
      
      <div className="card">
        <h3>Das erwartet Dich im PMP</h3>
        <ul>
          <li>Individuelles Mentoring und gezielte Unterstützung</li>
          <li>Tipps zur Kommunikation mit ATC und zum Verhalten im Netzwerk</li>
          <li>Ein freundliches und hilfsbereites Team</li>
        </ul>
      </div>
    </PageLayout>
  );
}
