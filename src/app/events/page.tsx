import PageLayout from '@/components/PageLayout';

export default function EventsPage() {
  return (
    <PageLayout>
      <h2>Aktuelle und kommende Events</h2>
      <p>
        Im Rahmen des PMP bieten wir demnächst regelmäßig den Newbie-Day an. 
        Hier findest du die nächsten Termine und eine Übersicht unserer wiederkehrenden Veranstaltungen. 
        Die Teilnahme steht allen offen – unabhängig vom Erfahrungsstand!
      </p>
      
      <div className="event-card">
        <h3>Der Newbie-Day</h3>
        <p><strong>Erfahrene Mentoren als Lotsen:</strong> Fit fürs Vorfeld</p>
        <p>
          Ziel unserer Newbie-Days ist es, denen, die nicht unbedingt Lust und Zeit auf ein komplettes Mentoring haben,
          die Möglichkeit zu geben, sich in einer entspannten Atmosphäre mit den Grundlagen des Fliegens auf VATSIM vertraut zu machen.
          Dabei stehen unsere Mentoren als Lotsen zur Verfügung, um dir die Grundlagen des Fliegens auf VATSIM im Discord zu erklären und dich bei deinen ersten Schritten zu unterstützen.
          Gleichzeitig kannst du dich mit anderen neuen Piloten austauschen und erste Erfahrungen im Fliegen sammeln.

          Die Newbie-Days finden regelmäßig statt und sind eine ideale Gelegenheit, um in die Welt des Online-Fliegens einzutauchen.
          Egal, ob du noch nie im Netzwerk geflogen bist oder bereits erste Erfahrungen gesammelt hast – unsere Mentoren stehen bereit, um dir zu helfen.
        </p>
        <p>Wem die Bodenabfertigung nicht zu viel wird, der kann dann natürlich auch abheben - nur können unsere Mentoren dann nicht mehr direkt als Lotsen eingreifen.</p>
        <p>Und wem die Teilnahme an einem Newbie-Day nicht ausreicht, der kann sich natürlich jederzeit für ein individuelles Mentoring anmelden.</p>
      </div>
      
      <div className="event-card">
        <h3>Newbie-Day</h3>
        <p><strong>Datum:</strong> Samstag, 15. Dezember 2024</p>
        <p><strong>Zeit:</strong> 19:00 – 21:00 UTC</p>
        <p><strong>Ort:</strong> Dresden (EDDC) und Erfurt (EDDE)</p>
        <p>
          <strong>Details:</strong> 
          Zu unserem ersten Newbie-Day im Dezember laden wir alle neuen Piloten ein, die Grundlagen des Fliegens auf VATSIM kennenzulernen.
          Wir besetzen die Positionen in Dresden (EDDC) und Erfurt (EDDE) mit erfahrenen Mentoren, die dir bei deinen ersten Schritten im Netzwerk helfen.
          Die relativ kurze Entfernung zwischen den beiden Flughäfen ermöglicht sogar einen kompletten Flug, ohne dabei in einen zu überfüllten Luftraum zu geraten.
        </p>
      </div>
    
      <div className="card">
        <h3>Wie kann ich teilnehmen?</h3>
        <p>
          Die Teilnahme an unseren Events ist für alle VATSIM-Germany Piloten gedacht. 
          Selbstverständlich können auch alle anderen Piloten teilnehmen, das Mentoring dabei wird aber ausschließlich auf deutsch stattfinden. 
          Du musst dich nicht vorher anmelden, sondern kannst einfach am Event-Tag zu den angegebenen Zeiten auf den offiziellen VATSIM-Germany Discord-Server kommen.
          Oder direkt auf dem Apron der jeweiligen Flughäfen spawnen.
        </p>
      </div>
    </PageLayout>
  );
}
