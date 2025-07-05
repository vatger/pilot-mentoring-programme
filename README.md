# VATSIM Germany - Piloten-Mentoren-Programm (PMP)

Ein modernes, responsives Website-Projekt für das Piloten-Mentoren-Programm von VATSIM Germany.

## Features

- ✅ **Responsive Design** - Mobile-first Design mit Tailwind CSS
- ✅ **Dark/Light Mode** - Automatische Themen-Umschaltung
- ✅ **Next.js 14** - Moderne React-Framework mit TypeScript
- ✅ **Barrierefreiheit** - Optimiert für alle Nutzer
- ✅ **Performance** - Schnelle Ladezeiten und optimiert für SEO

## Seiten

1. **Landingpage** (`/`) - Erklärt das PMP, Ziele und Vorteile
2. **Teilnahme** (`/teilnahme`) - Schritt-für-Schritt Anleitung zur VATSIM-Registrierung
3. **Events** (`/events`) - Newbie-Days und Veranstaltungen
4. **Kontakt** (`/kontakt`) - Support-Möglichkeiten und FAQ

## Design-System

### Farben
- **Primär**: `#002F5D` (VATSIM Blau)
- **Sekundär**: `#FFFFFF` (Weiß)
- **Akzentfarben**: 
  - Rot: `#D32F2F`
  - Gelb: `#FFC107`
  - Schwarz: `#000000`

### Typografie
- **Schrift**: Arial, Helvetica, sans-serif
- **Ton**: Freundlich, sachlich, direkt
- **Ansprache**: Du-Form, persönlich und motivierend

## Installation & Start

1. **Dependencies installieren**:
   ```bash
   npm install
   ```

2. **Development Server starten**:
   ```bash
   npm run dev
   ```

3. **Build für Produktion**:
   ```bash
   npm run build
   ```

4. **Production Server starten**:
   ```bash
   npm start
   ```

## Technische Details

- **Framework**: Next.js 14 mit App Router
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **TypeScript**: Vollständig typisiert
- **Export**: Statische Website (kann auf jedem Webserver gehostet werden)

## Deployment

Das Projekt ist für statischen Export konfiguriert (`output: 'export'` in `next.config.js`). 
Nach `npm run build` kann der `out/` Ordner direkt auf einen Webserver hochgeladen werden.

## Struktur

```
PMP/
├── app/                    # Next.js App Router
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Landingpage
│   ├── teilnahme/        # Teilnahme-Seite
│   ├── events/           # Events-Seite
│   └── kontakt/          # Kontakt-Seite
├── components/            # React Components
│   ├── Navbar.tsx        # Navigation
│   ├── Footer.tsx        # Footer
│   └── ThemeProvider.tsx # Dark/Light Mode
├── public/               # Statische Assets
└── package.json          # Dependencies
```

## Browser-Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile Browser (iOS Safari, Android Chrome)

## Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch
3. Mache deine Änderungen
4. Teste die Änderungen
5. Erstelle einen Pull Request

## Lizenz

© 2025 VATSIM Germany. Alle Rechte vorbehalten.
