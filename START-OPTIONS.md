# VATSIM PMP - Start-Optionen Übersicht

## 🎯 Für Passenger/Netcup (EMPFOHLEN)
```bash
node passenger.js
```
- ✅ Minimalistisch, 100% Passenger-kompatibel
- ✅ Inline CSS, keine externen Dependencies
- ✅ Vollständige Website mit allen Seiten
- ✅ Automatisches Logging

## 🔧 Für Development/Testing
```bash
node app.js
```
- ⚠️ Komplexer, mehr Features
- ⚠️ Möglicherweise Passenger-Probleme
- ✅ Erweiterte Funktionen

## 🚨 Minimaler Test
```bash
node app-test.js
```
- ✅ Nur für Debug-Zwecke
- ✅ Minimal möglich

## 📄 Statischer Fallback
```
index.html
```
- ✅ Funktioniert immer
- ❌ Keine Dynamik

## 📊 Empfehlung

**FÜR PRODUKTION auf Netcup:** Verwende `passenger.js`
- Einfach, robust, Passenger-optimiert
- Alle Funktionen verfügbar
- Minimale Fehlerquellen

**FÜR DEVELOPMENT:** Verwende `app.js`
- Mehr Features für lokale Entwicklung
- Erweiterte Debugging-Möglichkeiten
