import PageLayout from '@/components/PageLayout';

export default function EventsPage() {
  return (
    <PageLayout>
      <h2>PMP Online Evening</h2>
      <p>
        Im Rahmen des PMP bieten wir zweiwöchentlich einen Online Evening an. Dieses Angebot richtet sich in erste Linie an Airliner-Piloten. Hier findest du Informationen dazu.
      </p>
      
      <div className="card">
        <h3>Was machen wir da?</h3>
        <p>Wir besetzen einen oder auch zwei Minor Airports mit GND und TWR. Das übernehmen Mentoren, die auch ein Lotsen-Rating haben.</p>
        <p>
          Zusätzlich steht ein weiterer Mentor auf Discord im Voice Chat bereit, um Fragen zu beantworten.
        </p>
        <p>  
          Du kannst als neuer Pilot bei diesem Event üben, Fehler machen, wiederholen, ohne befürchten zu müssen, andere damit zu stören oder anderen Flugverkehr zu beeinträchtigen.
        </p>
        <p>Aufgrund der Lotsen-Besetzung des Airports ist das allerdings hauptsächlich für Boden-Übungen gedacht:</p>

        <ul>
          <li>Clearance</li>
          <li>Startup / Pushback</li>
          <li>Taxi</li>
          <li>Verschiedene Arten der Take-off Clearance</li>
        </ul>
        <p>Du kannst dir also eine Clearance holen, zur Runway rollen, die TO Clearance üben und wieder zurück zum Gate rollen - und das Ganze auch wiederholen.</p>
      </div>
      
      <div className="card">
        <h3>Was ist wenn ich aber fliegen will?</h3>
        <p>
          Niemand wir dich daran hindern. Unsere Lotsen können aber nur GND und TWR bedienen. Wenn du fliegst - zu einem anderen Airport oder eine IFR-Platzrunde -, musst du mit Radar-Lotsen, sofern online, sowie anderem Traffic alleine klar kommen.
        </p>
      </div>
    
      <div className="card">
        <h3>Klingt gut. Wann und wo findet das statt?</h3>
        <p>
          <strong>Termin</strong>: Termin: Jeden 1. und 3. Freitag im Monat
        </p>
        <p>
          <strong>Zeit</strong>: 19:00 - 22:00 LCL
        </p>
        <p>
          <strong>Airport</strong>: Wird jeweils im Event-Kalender bekannt gegeben
        </p>
        <p>
          <strong>Discord</strong>: Vatsim Germany Discord, Voice Chat
        </p>
      </div>
    </PageLayout>
  );
}
