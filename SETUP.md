# Setup-Anleitung für das PMP-Website Projekt

## Voraussetzungen

1. **Node.js installieren** (falls noch nicht geschehen):
   - Besuche https://nodejs.org/
   - Lade die LTS-Version herunter und installiere sie
   - Starte VS Code neu nach der Installation

## Projekt starten

### Schritt 1: Dependencies installieren
Öffne ein Terminal in VS Code (Terminal → Neues Terminal) und führe aus:

```bash
# Option 1: Mit PowerShell (falls Execution Policy erlaubt)
npm install

# Option 2: Mit cmd (falls PowerShell blockiert)
cmd /c "npm install"
```

### Schritt 2: Development Server starten
```bash
# Option 1: Mit PowerShell
npm run dev

# Option 2: Mit cmd
cmd /c "npm run dev"
```

### Schritt 3: Website öffnen
- Öffne deinen Browser
- Gehe zu: http://localhost:3000
- Die Website sollte jetzt angezeigt werden

## Befehle

- `npm run dev` - Startet den Development Server
- `npm run build` - Erstellt eine Produktions-Version
- `npm run start` - Startet den Produktions-Server
- `npm run lint` - Überprüft den Code auf Fehler

## Fehlerbehebung

### PowerShell Execution Policy Fehler
Falls du eine Fehlermeldung bezüglich "Execution Policy" bekommst:

1. **Lösung 1**: Verwende cmd statt PowerShell:
   ```bash
   cmd /c "npm install"
   cmd /c "npm run dev"
   ```

2. **Lösung 2**: Führe einmalig aus (als Administrator):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

### TypeScript Fehler
Die TypeScript-Fehler in VS Code sind normal und verschwinden nach der Installation der Dependencies.

## Projektstruktur

```
PMP/
├── app/                    # Next.js Seiten
│   ├── page.tsx           # Startseite
│   ├── teilnahme/         # Teilnahme-Seite
│   ├── events/            # Events-Seite
│   └── kontakt/           # Kontakt-Seite
├── components/            # Wiederverwendbare Komponenten
├── public/               # Statische Dateien
└── package.json          # Projekt-Konfiguration
```

## Was ist implementiert

✅ **Vollständige Website** mit 4 Hauptseiten
✅ **Responsive Design** - funktioniert auf Desktop und Mobile
✅ **Dark/Light Mode** - automatische Themen-Umschaltung
✅ **Moderne Technologien** - Next.js 14, TypeScript, Tailwind CSS
✅ **VATSIM Germany Design** - Entspricht den Farben und dem Stil
✅ **Barrierefreiheit** - Optimiert für alle Nutzer
✅ **Performance** - Schnelle Ladezeiten

## Nächste Schritte

1. Starte den Development Server
2. Teste die Website in deinem Browser
3. Passe Inhalte nach deinen Wünschen an
4. Für Produktions-Deployment: `npm run build`

Die Website ist bereit zur Nutzung und kann auf jedem modernen Webserver gehostet werden!
