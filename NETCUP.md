# 🚀 Netcup Hosting-Anleitung für VATSIM PMP Website

## Netcup spezifische Konfiguration

Netcup ist ein sehr guter Provider für Node.js! Hier die Schritt-für-Schritt Anleitung:

## 📋 Netcup Setup

### 1. **Webhosting-Panel öffnen**
- Gehe in dein Netcup Customer Control Panel (CCP)
- Wähle dein Webhosting-Paket

### 2. **Node.js aktivieren**
- **Software & Apps** → **Node.js**
- **Node.js Version**: 18.x oder 20.x (neueste LTS)
- **Aktivieren**

### 3. **Domain/Subdomain konfigurieren**
#### Option A: Hauptdomain verwenden
- Stelle deine Hauptdomain auf Node.js um

#### Option B: Subdomain erstellen (empfohlen)
- Erstelle eine Subdomain z.B. `pmp.deine-domain.de`
- Weise diese der Node.js-App zu

### 4. **Dateien hochladen**
- **Upload-Methode**: FTP, SFTP oder File Manager
- **Zielordner**: `/httpdocs/` (bei Hauptdomain) oder `/httpdocs/subdomain/`
- **Alle Projektdateien** hochladen

### 5. **Netcup Node.js Konfiguration**

#### **Anwendungsstartdatei**: 
```
app.js
```
*(Nutze `app.js` - das funktioniert bei Netcup am besten)*

#### **Environment Variablen**:
```bash
NODE_ENV=production
```

#### **Automatischer Neustart**: Aktivieren

## 🔧 Optimierte app.js für Netcup

Deine aktuelle `app.js` ist bereits perfekt für Netcup! 👍

## 📦 Dependencies Installation

Netcup installiert Dependencies automatisch aus der `package.json`:

1. **Build-Prozess läuft automatisch**
2. **npm install** wird ausgeführt  
3. **App startet automatisch**

## 🌐 Typischer Netcup Workflow

### Nach dem Upload:
1. **Netcup erkennt** package.json
2. **Installiert** alle Dependencies
3. **Führt Build aus** (falls nötig)
4. **Startet** app.js
5. **Website ist live!** 🎉

## ⚙️ Netcup Panel Einstellungen

### **Node.js App Konfiguration**:
- **App Name**: VATSIM-PMP
- **Startdatei**: `app.js`
- **Domain**: `pmp.deine-domain.de`
- **Node Version**: 18.x LTS
- **Auto-Restart**: Ja
- **Memory Limit**: Standard (meist 512MB)

## 🔍 Netcup Besonderheiten

### **Port**: 
- Netcup setzt automatisch den korrekten Port
- `process.env.PORT` wird automatisch gesetzt
- **Kein manueller Port** erforderlich

### **SSL/HTTPS**:
- Netcup bietet **kostenloses Let's Encrypt**
- Automatisch aktiviert für alle Domains

### **Performance**:
- Netcup hat sehr gute Node.js Performance
- SSD Storage für schnelle Ladezeiten

## 📞 Netcup Support

Falls Probleme auftreten:
- **Netcup Docs**: https://www.netcup-wiki.de/wiki/Node.js
- **Support-Ticket** im CCP öffnen
- **Community Forum**: Sehr hilfsbereit

## ✅ Checklist für Go-Live

- [ ] Node.js im Netcup Panel aktiviert
- [ ] Domain/Subdomain konfiguriert  
- [ ] Alle Dateien hochgeladen
- [ ] `app.js` als Startdatei gesetzt
- [ ] Environment auf `production` gesetzt
- [ ] Auto-Restart aktiviert

## 🚀 Nach dem Go-Live

Deine Website wird unter deiner Domain erreichbar sein:
- `https://deine-domain.de` (Hauptdomain)
- `https://pmp.deine-domain.de` (Subdomain)

## 💡 Pro-Tipps für Netcup

1. **Subdomain nutzen** für bessere Organisation
2. **Let's Encrypt SSL** aktivieren (kostenlos)
3. **Monitoring** im Panel überwachen
4. **Backups** regelmäßig erstellen

## 🚨 Troubleshooting: 403 Forbidden Fehler

### **Häufigste Ursachen und Lösungen:**

#### 1. **Dateirechte (Permissions) prüfen**
```bash
# Über SSH/Terminal (falls verfügbar):
chmod 755 app.js
chmod 755 server.js
chmod -R 644 *.json
chmod -R 755 app/
chmod -R 755 components/
chmod -R 755 public/
```

#### 2. **Netcup Panel Konfiguration überprüfen**
- **CCP → Webhosting → Node.js**
- **Status**: Muss auf "Aktiv" stehen
- **Startdatei**: Exakt `app.js` (ohne Pfad!)
- **Domain-Zuordnung**: Korrekt konfiguriert?

#### 3. **Ordnerstruktur kontrollieren**
```
/httpdocs/               (oder /httpdocs/subdomain/)
├── app.js              ← Muss im Root-Verzeichnis sein!
├── package.json        ← Muss im Root-Verzeichnis sein!
├── server.js
├── next.config.js
├── app/
├── components/
└── public/
```

#### 4. **Alternative Startdatei testen**
Falls `app.js` nicht funktioniert, versuche:
- **Im Netcup Panel**: Startdatei auf `server.js` ändern
- **Oder**: Startdatei auf `index.js` ändern

#### 5. **Node.js neu starten**
- **Netcup Panel → Node.js**
- **App stoppen** → **App starten**
- Oder **"Neustart"** Button

#### 6. **Logs überprüfen**
- **Netcup Panel → Node.js → Logs**
- Fehlermeldungen lesen
- Bei Fehlern: Support-Ticket erstellen

### **Schnelle Lösungsversuche:**

#### **Lösung A: Startdatei ändern**
```javascript
// Alternative app.js (einfacher)
const express = require('express')
const path = require('path')

const app = express()
const port = process.env.PORT || 3000

// Statische Dateien servieren (Fallback)
app.use(express.static('public'))
app.use(express.static('.next'))

// Einfache Route für Test
app.get('/', (req, res) => {
  res.send('<h1>VATSIM PMP - Website lädt...</h1><p>Falls du das siehst, funktioniert der Server!</p>')
})

app.listen(port, () => {
  console.log(`Server läuft auf Port ${port}`)
})
```

#### **Lösung B: .htaccess entfernen**
Falls eine `.htaccess` Datei existiert → **löschen**

#### **Lösung C: Index.html als Fallback**
```html
<!-- Erstelle: public/index.html -->
<!DOCTYPE html>
<html>
<head>
    <title>VATSIM PMP - Loading...</title>
</head>
<body>
    <h1>VATSIM PMP Website</h1>
    <p>Die Node.js App startet gerade...</p>
    <script>
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    </script>
</body>
</html>
```

### **Netcup spezifische 403 Lösungen:**

1. **Domain-Zuordnung überprüfen**
   - CCP → Domains → Subdomain korrekt zugeordnet?

2. **SSL-Probleme**
   - Versuche `http://` statt `https://`
   - Let's Encrypt neu aktivieren

3. **Node.js Version wechseln**
   - Auf Node.js 16.x oder 18.x wechseln

4. **Kompletter Neustart**
   - Node.js App komplett deaktivieren
   - 5 Minuten warten
   - Wieder aktivieren

---

**Was zeigen die Netcup Logs?** 
Schau in **CCP → Node.js → Logs** für genaue Fehlermeldungen!

## 🚨 Application Error: "Something went wrong"

**Das ist kein 403 mehr - die App startet, aber es gibt einen Fehler!**

### **Sofortige Lösung:**

#### 1. **Neue app.js hochladen**
Die verbesserte `app.js` hat jetzt:
- ✅ **Bessere Fehlerbehandlung**
- ✅ **Fallback-Modus** falls Next.js nicht funktioniert
- ✅ **Detailliertes Logging**
- ✅ **Schöne Landingpage** als Backup

#### 2. **Typische Ursachen:**
- **Dependencies fehlen** → `npm install` nicht gelaufen
- **Next.js Build fehlt** → `npm run build` erforderlich  
- **Memory-Limit** → Netcup App braucht mehr RAM
- **Node.js Version** → Inkompatibilität

#### 3. **Debugging-Schritte:**

##### **Schritt 1: Neue app.js testen**
1. Neue `app.js` hochladen
2. Node.js neu starten
3. Website aufrufen → Sollte jetzt eine schöne Landingpage zeigen

##### **Schritt 2: Logs checken**
**Netcup Panel → Node.js → Logs** anschauen:
```bash
# Typische Fehlermeldungen:
❌ "Cannot find module 'next'"     → Dependencies fehlen
❌ "Error: ENOENT"                 → Dateien fehlen  
❌ "Port 3000 already in use"      → Port-Konflikt
❌ "Cannot read property..."       → Code-Fehler
```

##### **Schritt 3: Dependencies sicherstellen**
```bash
# Falls SSH verfügbar:
cd /httpdocs/
npm install
npm run build
```

##### **Schritt 4: Memory erhöhen**
**Netcup Panel → Node.js**:
- **Memory Limit**: Von 512MB auf 1024MB erhöhen

#### 4. **Netcup-spezifische Fixes:**

##### **Node.js Version wechseln:**
- Von 20.x auf **18.x LTS** wechseln
- Oder von 18.x auf **16.x** testen

##### **Build-Prozess erzwingen:**
1. Node.js **deaktivieren**
2. Alle Dateien **neu hochladen**
3. Node.js **wieder aktivieren**
4. **5 Minuten warten** (Build-Zeit)

##### **Minimal-Test mit app-test.js:**
Falls die neue app.js immer noch Probleme macht:
1. **Startdatei** auf `app-test.js` setzen
2. Das ist die absolut einfachste Version

#### 5. **Erfolgs-Indikatoren:**

✅ **Funktioniert**: Landingpage mit "Server läuft erfolgreich!"  
✅ **Logs zeigen**: "VATSIM PMP Server läuft auf Port..."  
✅ **Status-Route**: `/status` zeigt JSON-Response

#### 6. **Nächste Schritte nach dem Fix:**

1. **Erst die einfache Version** zum Laufen bringen
2. **Dann Next.js Features** schrittweise aktivieren
3. **Build-Prozess** optimieren
4. **Vollständige Website** aktivieren

---

**Die neue app.js sollte jetzt funktionieren und eine schöne Landingpage zeigen!** 🎯
