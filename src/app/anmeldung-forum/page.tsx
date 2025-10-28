import PageLayout from '@/components/PageLayout';

export default function EventsPage() {
  return (
    <PageLayout>
      <h2>Anmeldung zum PMP</h2>
      <p>
        Die Anmeldung und Organisation des PMP findet im Vatsim Germany <a href="https://board.vatsim-germany.org/forums/piloten-mentoren-programm.739/">Forum Piloten-Mentoren-Programm</a> statt. Bevor du eine Anmeldung schreibst, lies dir bitte <a href="https://board.vatsim-germany.org/threads/pmp-anmeldung-und-ablauf-bitte-vor-der-anmeldung-lesen.70146/">diesen Beitrag</a> durch. Zusätzlich haben wir das Wesentliche für dich hier zusammengefasst.
      </p>
      
      <div className="card">
        <h3>Anmeldung</h3>
        <p>
          Damit sich unsere Mentoren ein erstes Bild von dir machen können, gib uns bitte mit deiner Anmeldung schon mal ein paar Informationen. Orientiere dich dabei an dieser Form:
        </p>

        <ol>
          <li>
            <strong>Flugsimulator</strong>
            <p>Welchen Simulator verwendest du?</p>
          </li>
          <li>
            <strong>Flugzeug</strong>
            <p>Mit welchem Flugzeug möchtest du das Training machen?</p>
          </li>
          <li>
            <strong>Pilotenclient</strong>
            <p>Hast du den Client schon installiert und eingerichtet?</p>
          </li>
          <li>
            <strong>Erfahrungen</strong>
            <p>Wie lange machst du schon Flugsimulation? Bist du schon mal online geflogen?</p>
          </li>
          <li>
            <strong>Kartenmaterial</strong>
            <p>Was für Kartenmaterial verwendest du und wie planst du deine Flüge?</p>
          </li>
          <li>
            <strong>Flugregeln und Ziele</strong>
            <p>
              Unser Schwerpunkt im PMP ist &quot;Fit for Online Flying&quot;, also das Fliegen auf Vatsim mit ATC. Was möchtest du lernen oder vertiefen?
            </p>
          </li>
          <li>
            <strong>Terminvorstellung</strong>
            <p>Wann passt es dir am besten? Wochentage, Zeiträume?</p>
          </li>
          <li>
            <strong>Kommunikation</strong>
            <p>Bist du auch auf dem offiziellenVatsim Germany Discord registriert?</p>
          </li>
          <li>
            <strong>Persönliches</strong>
            <p>Alter, Beruf/Beschäftigung, Wohnort (optional).</p>
          </li>
        </ol>
  <h3 style={{ textAlign: 'center' }}><a href="https://board.vatsim-germany.org/threads/pmp-anmeldung-und-ablauf-bitte-vor-der-anmeldung-lesen.70146/" target="_blank" className="card card-link">Zur Anmeldung</a></h3>
      </div>
    </PageLayout>
  );
}
