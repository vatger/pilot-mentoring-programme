# 🚨 500 Internal Server Error - Lösungsschritte

## 1. Schnelle Diagnose
**Uploade diese Debug-Dateien:**
- `debug.js` - Erweiterte Fehlerdiagnose
- `minimal.js` - Ultra-minimale Version
- `.htaccess-debug` - Debug-Konfiguration

## 2. Teste Schrittweise

### Schritt 1: Minimal-Test
```bash
# .htaccess temporär umbenennen/löschen und nur minimal.js testen
PassengerStartupFile minimal.js
```

### Schritt 2: Debug-Version
```bash
# Verwende .htaccess-debug und debug.js
cp .htaccess-debug .htaccess
touch tmp/restart.txt
```

### Schritt 3: Log-Dateien prüfen
```bash
# Auf dem Server:
tail -f debug.log
tail -f error.log
tail -f /var/log/apache2/error.log
```

## 3. Häufige 500-Ursachen

### Express nicht installiert
```bash
cd /var/www/html/pmp
npm install express --save
```

### Node.js Pfad falsch
In `.htaccess`:
```apache
# Versuche verschiedene Pfade:
PassengerNodejs /usr/bin/node
PassengerNodejs /usr/local/bin/node
PassengerNodejs /opt/plesk/node/16/bin/node
```

### Dateiberechtigungen
```bash
chmod 755 /var/www/html/pmp
chmod 644 /var/www/html/pmp/*.js
chmod 644 /var/www/html/pmp/.htaccess
```

### Passenger-Neustart
```bash
touch /var/www/html/pmp/tmp/restart.txt
```

## 4. Debug-URLs
- `/` - Hauptseite mit System-Info
- `/test` - JSON-Test
- `/error` - Fehler-Test
- `/status` - System-Status

## 5. Netcup-spezifische Probleme

### Plesk Environment
```apache
PassengerAppRoot /var/www/vhosts/your-domain.de/httpdocs/pmp
PassengerNodejs /opt/plesk/node/16/bin/node
```

### Subdirectory-Setup
```apache
PassengerAppRoot /var/www/html/pmp
PassengerBaseURI /pmp
```

## 6. Notfall-Lösung
Falls nichts funktioniert, nutze die statische `index.html`:
```bash
# Alle .htaccess-Passenger-Direktiven auskommentieren
# Nur statisches HTML servieren
```

## 7. Debugging-Reihenfolge
1. `minimal.js` - Funktioniert das?
2. `debug.js` - Was zeigen die Logs?
3. `passenger.js` - Original mit Fixes
4. Apache Error Logs prüfen
5. Netcup Support kontaktieren

**Die debug.js Version wird dir genau zeigen, wo das Problem liegt!**
