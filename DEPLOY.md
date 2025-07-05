# VATSIM PMP - Finales Deployment für Netcup

## ✅ LÖSUNG: Minimale Passenger-kompatible App

Die neue `passenger.js` ist speziell für Passenger/Apache entwickelt und sollte die 403/500-Fehler beheben.

## 🚀 Deployment-Schritte

### 1. Dateien hochladen (via FTP/Git)
Lade diese **MINIMALEN** Dateien hoch:
```
pmp/
├── passenger.js          ← HAUPTDATEI (Passenger Entry Point)
├── package.json          ← Dependencies
├── .htaccess            ← Apache/Passenger Config
├── tmp/restart.txt      ← Passenger Restart
└── index.html           ← Notfall-Fallback
```

### 2. Auf dem Server ausführen
```bash
cd /var/www/html/pmp
npm install express --production
touch tmp/restart.txt
```

### 3. Testen
- `https://your-domain.de/` - Hauptseite
- `https://your-domain.de/status` - System-Info
- `https://your-domain.de/teilnahme` - Test-Route

## 🔧 Was ist anders?

### passenger.js Vorteile:
- ✅ Keine Next.js-Abhängigkeiten
- ✅ Inline CSS - keine externen Dateien
- ✅ 100% Express - Passenger-kompatibel
- ✅ Automatisches Logging nach `passenger.log`
- ✅ Vollständige Website mit allen Seiten
- ✅ Responsive Design
- ✅ Module.exports für Passenger

### .htaccess optimiert:
- ✅ Explizite Passenger-Konfiguration
- ✅ Node.js-Pfad gesetzt
- ✅ Statische Dateien-Handling
- ✅ Restart-Mechanismus

## 🚨 Troubleshooting

### Immer noch 403?
```bash
# Dateiberechtigungen prüfen:
chmod 755 /var/www/html/pmp
chmod 644 /var/www/html/pmp/passenger.js
chmod 644 /var/www/html/pmp/.htaccess
```

### Passenger Error Page?
```bash
# App neu starten:
touch /var/www/html/pmp/tmp/restart.txt
# Logs prüfen:
tail -f /var/www/html/pmp/passenger.log
```

### Dependencies fehlen?
```bash
cd /var/www/html/pmp
npm install --production
```

### Netcup-spezifische Pfade
Falls die Standard-Pfade nicht funktionieren, in `.htaccess` anpassen:
```apache
# Für Plesk:
PassengerNodejs /opt/plesk/node/16/bin/node
# Für cPanel:  
PassengerNodejs /usr/local/bin/node
```

## 📁 Backup-Plan

Falls `passenger.js` nicht funktioniert, die `index.html` funktioniert **IMMER** als statische Fallback-Seite.

## 🎯 Erfolgskontrolle

Die Website ist erfolgreich deployed wenn:
- [ ] Hauptseite lädt ohne Fehler
- [ ] Navigation funktioniert
- [ ] `/status` zeigt System-Info
- [ ] `passenger.log` wird erstellt
- [ ] Kein 403 oder Passenger Error Page

## 📞 Support

Bei anhaltenden Problemen:
1. Apache Error Logs prüfen: `/var/log/apache2/error.log`
2. Passenger Logs prüfen: `/var/www/html/pmp/passenger.log`
3. Netcup Support kontaktieren bezüglich Node.js/Passenger Setup

**Die neue `passenger.js` ist die einfachste, robusteste Lösung für Passenger-Deployment!**
