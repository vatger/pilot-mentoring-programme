// EINFACHE TEST-VERSION für Netcup 403 Debugging
const express = require('express')
const path = require('path')

const app = express()
const port = process.env.PORT || 80

console.log('🚀 Server startet...')
console.log('Port:', port)
console.log('Verzeichnis:', __dirname)

// Einfache Test-Route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>VATSIM PMP - Test</title>
        <style>
            body { font-family: Arial; padding: 40px; text-align: center; }
            .success { color: green; font-size: 24px; }
            .info { color: #666; margin: 20px 0; }
        </style>
    </head>
    <body>
        <h1 class="success">✅ VATSIM PMP Server läuft!</h1>
        <p class="info">Node.js funktioniert auf Netcup</p>
        <p>Port: ${port}</p>
        <p>Zeit: ${new Date().toLocaleString('de-DE')}</p>
        <hr>
        <h2>Nächste Schritte:</h2>
        <p>1. Dieser Test funktioniert ✅</p>
        <p>2. Jetzt die vollständige Next.js App aktivieren</p>
        <p>3. app.js durch die ursprüngliche Version ersetzen</p>
    </body>
    </html>
  `)
})

// Status-Route für Debugging
app.get('/status', (req, res) => {
  res.json({
    status: 'OK',
    port: port,
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  })
})

app.listen(port, () => {
  console.log(`✅ Test-Server läuft auf Port ${port}`)
  console.log(`🌐 Aufrufbar unter: http://pmp.hosting201623.ae912.netcup.net`)
})

// Error handling
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason)
})
