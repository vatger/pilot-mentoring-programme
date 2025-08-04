import PageLayout from '@/components/PageLayout';

export default function HomePage() {
  return (
    <PageLayout>
      <h2>Herzlich willkommen beim Piloten-Mentoren-Programm!</h2>
        <div className="card">
          <h3>Warum PMP?</h3>
          <p>Im Gegensatz zu Piloten müssen die Lotsen auf VATSIM eine aufwändige und langwierige Ausbildung durchlaufen. Immer wieder kommen jedoch Piloten auf die Frequenzen, die Unterstützung benötigen, weil sie mit den Verfahren oder der Phraseologie nicht vertraut sind.
            Diese Hilfe können Lotsen gerade in Verkehrsreichen Sektoren nicht leisten, da sie sich auf ihre primäre Aufgabe konzentrieren müssen: die sichere und effiziente Abwicklung des Luftverkehrs.
          </p>
          <p>
            Das PMP bietet hier eine wertvolle Unterstützung, indem es erfahrene Mentoren bereitstellt, die den Piloten helfen, sich in der komplexen Welt der virtuellen Flugsicherung zurechtzufinden, um den Stress der Lotsen gerade unter hohen Belastungen zu reduzieren. 
          </p>
      </div>
      <p>
        Das <strong>Piloten-Mentoren-Programm (PMP)</strong> von VATSIM Germany ist Deine Anlaufstelle, um als virtueller Pilot auf VATSIM durchzustarten. 
        Unser Ziel ist es, Dir mit erfahrenen Mentoren zur Seite zu stehen, damit Du Deine Fähigkeiten im Umgang mit virtueller Flugsicherung gezielt ausbauen kannst – egal, ob Du gerade erst beginnst oder schon erste Erfahrungen gesammelt hast.
      </p>
      <p>
        Wir bieten Dir eine persönliche und freundliche Lernumgebung, in der Du nicht nur die technischen Aspekte des Fliegens, sondern auch die Kommunikation mit ATC und das Verhalten im Netzwerk erlernen kannst. 
        Unser Mentorenteam begleitet Dich individuell, damit Du sicher und mit Freude am virtuellen Luftverkehr teilnehmen kannst.
      </p>
      {/* Force three columns for these cards */}
      <div className="three-col-grid">
        <div className="card">
          <h3>Für Newbies</h3>
          <p>
            Du möchtest Deine Fähigkeiten als Pilot verbessern? 
            Unsere Mentoren helfen Dir, Unsicherheiten abzubauen und Routine im Umgang mit Flugzeugen und ATC zu gewinnen.
          </p>
        </div>
        <div className="card">
          <h3>Für Mentoren</h3>
          <p>
            Du bist ein erfahrener Pilot und möchtest Dein Wissen weitergeben? Werde Teil unseres Mentorenteams und unterstütze neue Mitglieder beim Einstieg in die Welt von VATSIM. 
            Gemeinsam sorgen wir für eine starke Community und fördern die nächste Generation virtueller Piloten.
          </p>
        </div>
        <div className="card">
          <h3>Events & Trainings</h3>
          <p>
            Hier könnte ein spannender Text über den Newbieday stehen
          </p>
        </div>
      </div>
      <div className="card">
        <h3>Was wir bieten:</h3>
        <ul>
          <li>Individuelle Betreuung durch erfahrene Mentoren</li>
          <li>Strukturierte Lerninhalte und praxisnahe Übungen</li>
          <li>Regelmäßige Events und Gruppenflüge</li>
          <li>Starke Community und freundliche Atmosphäre</li>
        </ul>
      </div>
    </PageLayout>
  );
}
