# VATSIM PMP - Passenger Troubleshooting Guide

## Schnelle Lösung für 403/500 Fehler

### 1. Minimale Passenger-Anwendung verwenden
```bash
# Die neue passenger.js ist speziell für Passenger optimiert
node passenger.js  # Lokal testen
```

### 2. Netcup Upload Checklist
- [ ] Alle Dateien in `/pmp/` hochgeladen
- [ ] `passenger.js` als Hauptdatei
- [ ] `.htaccess` mit Passenger-Konfiguration
- [ ] `package.json` mit korrekten dependencies
- [ ] `tmp/restart.txt` für Passenger-Neustarts

### 3. Passenger-spezifische Dateien
- **Hauptdatei:** `passenger.js` (minimalistisch, 100% kompatibel)
- **Restart:** `tmp/restart.txt` (touch zum Neustart)
- **Logs:** `passenger.log` (automatisches Logging)

### 4. Häufige Probleme beheben

#### 403 Forbidden
```bash
# Auf dem Server:
chmod 755 /var/www/html/pmp
chmod 644 /var/www/html/pmp/passenger.js
chmod 644 /var/www/html/pmp/.htaccess
```

#### Passenger Error Page
```bash
# Passenger neu starten:
touch /var/www/html/pmp/tmp/restart.txt
```

#### Dependencies fehlen
```bash
# Auf dem Server:
cd /var/www/html/pmp
npm install --production
```

### 5. Debug-URLs
- `https://your-domain.de/` - Hauptseite
- `https://your-domain.de/status` - System-Status
- `https://your-domain.de/teilnahme` - Test-Seite

### 6. Log-Dateien prüfen
```bash
# Auf dem Server:
tail -f /var/www/html/pmp/passenger.log
tail -f /var/log/apache2/error.log
```

### 7. Minimaler Test
Wenn alles fehlschlägt, nur diese Dateien hochladen:
1. `passenger.js`
2. `package.json` 
3. `.htaccess`
4. `tmp/restart.txt`

### 8. Netcup-spezifische Pfade
In `.htaccess` eventuell anpassen:
```apache
PassengerAppRoot /var/www/html/pmp
PassengerNodejs /usr/bin/node
```

Bei Plesk eventuell:
```apache
PassengerAppRoot /var/www/vhosts/your-domain.de/httpdocs/pmp
PassengerNodejs /opt/plesk/node/16/bin/node
```

## Was ist anders an passenger.js?
- Kein Next.js - nur Express
- Inline CSS - keine externen Abhängigkeiten
- Minimales Logging
- 100% Passenger-kompatibel
- Einfache HTML-Ausgabe
- Alle Routen funktional

## Deployment-Reihenfolge
1. Dateien hochladen
2. `npm install --production`
3. `touch tmp/restart.txt`
4. Website testen
5. Bei Problemen: Apache/Passenger Error Logs prüfen
