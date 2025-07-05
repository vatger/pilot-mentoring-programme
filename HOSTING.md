# 🚀 Hosting-Anleitung für VATSIM PMP Website

## Für Node.js Hosting-Provider

Ich habe **3 verschiedene Startdateien** erstellt, je nachdem was dein Hosting-Provider benötigt:

### 📁 Verfügbare Startdateien:

1. **`server.js`** - Vollständige Express.js Server (empfohlen)
2. **`app.js`** - Einfache Express.js Version  
3. **`index.js`** - Minimale Version (verweist auf server.js)

## 🔧 Hosting Setup

### Schritt 1: Dateien hochladen
Lade **alle Dateien** auf deinen Webserver hoch:
```
PMP/
├── app/              # Next.js Anwendung
├── components/       # React Components  
├── public/          # Statische Dateien
├── package.json     # Dependencies
├── server.js        # Haupt-Startdatei ⭐
├── app.js           # Alternative Startdatei
├── index.js         # Minimale Startdatei
└── ...weitere Dateien
```

### Schritt 2: Anwendungsstartdatei konfigurieren

**Je nach Hosting-Provider, wähle eine:**

#### Option A: `server.js` (empfohlen)
```bash
# In deinem Hosting-Panel als Startdatei angeben:
server.js
```

#### Option B: `app.js` 
```bash
# Falls server.js nicht funktioniert:
app.js
```

#### Option C: `index.js`
```bash
# Für Provider die index.js erwarten:
index.js
```

### Schritt 3: Node.js Version
**Empfohlen:** Node.js 18 oder höher

### Schritt 4: Environment Variablen (optional)
```bash
NODE_ENV=production
PORT=3000  # Wird meist automatisch gesetzt
```

## 🌐 Hosting-Provider spezifisch

### Für **Strato, 1&1, All-Inkl, etc.**:
1. **Node.js aktivieren** im Hosting-Panel
2. **Anwendungsstartdatei**: `server.js`
3. **Dependencies installieren** (automatisch oder manuell)
4. **Domain/Subdomain** auf Node.js-App zeigen lassen

### Für **Vercel, Netlify, Railway**:
- Einfach Git-Repository verbinden
- Automatisches Deployment

### Für **Shared Hosting ohne Node.js**:
- Nutze die **statische Version** (siehe unten)

## 📦 Commands für lokale Tests

```bash
# Dependencies installieren
npm install

# Lokal testen mit Express Server
npm run start        # Startet server.js
npm run start:app    # Startet app.js  
npm run start:index  # Startet index.js

# Development (wie gewohnt)
npm run dev
```

## 🔄 Alternative: Statische Website

Falls dein Hosting **kein Node.js** unterstützt, kann ich auch eine **statische Version** erstellen:

```bash
npm run build
# Upload nur den 'out/' Ordner
```

## ⚙️ Troubleshooting

### Fehler: "Cannot find module 'express'"
```bash
npm install express
```

### Fehler: "Port already in use"
- Hosting-Provider setzt PORT automatisch
- Keine Aktion erforderlich

### Fehler: "Next.js not found"
```bash
npm install
npm run build
```

## 📞 Hosting-Provider Setup-Hilfe

**Typische Konfiguration:**
- **Anwendungstyp**: Node.js
- **Startdatei**: `server.js`
- **Build Command**: `npm run build`
- **Start Command**: `npm start`

## ✅ Was passiert nach dem Upload?

1. **Hosting-Provider installiert** Dependencies automatisch
2. **Next.js App wird gebaut** (falls nicht schon geschehen)
3. **Express Server startet** und served die Website
4. **Website ist live** unter deiner Domain! 🎉

---

**Welche Startdatei soll ich in deinem Hosting-Panel konfigurieren?** 
Meist ist es `server.js` oder `app.js`.
