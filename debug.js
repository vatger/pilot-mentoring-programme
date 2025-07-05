// VATSIM PMP - Debug Version für Fehlerdiagnose
const express = require('express')
const fs = require('fs')
const path = require('path')

console.log('=== VATSIM PMP DEBUG START ===')
console.log('Node.js Version:', process.version)
console.log('Working Directory:', __dirname)
console.log('Environment:', process.env.NODE_ENV)

const app = express()

// Erweiterte Fehlerbehandlung
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err)
  fs.appendFileSync(path.join(__dirname, 'error.log'), `UNCAUGHT: ${err.stack}\n`)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason)
  fs.appendFileSync(path.join(__dirname, 'error.log'), `UNHANDLED: ${reason}\n`)
})

// Sicheres Logging
function safeLog(message) {
  const timestamp = new Date().toISOString()
  const logEntry = `[${timestamp}] ${message}\n`
  console.log(message)
  try {
    fs.appendFileSync(path.join(__dirname, 'debug.log'), logEntry)
  } catch (e) {
    console.error('Logging failed:', e.message)
  }
}

safeLog('🚀 DEBUG: App initializing...')

// Prüfe Express
try {
  safeLog('DEBUG: Express version: ' + require('express/package.json').version)
} catch (e) {
  safeLog('DEBUG: Express version check failed: ' + e.message)
}

// Minimales Error Handling Middleware
app.use((err, req, res, next) => {
  safeLog(`ERROR in middleware: ${err.message}`)
  safeLog(`ERROR stack: ${err.stack}`)
  res.status(500).send(`
    <h1>Debug Error Page</h1>
    <p><strong>Error:</strong> ${err.message}</p>
    <p><strong>Time:</strong> ${new Date().toISOString()}</p>
    <p><strong>URL:</strong> ${req.url}</p>
    <pre>${err.stack}</pre>
  `)
})

// Logging Middleware
app.use((req, res, next) => {
  safeLog(`${req.method} ${req.url} - IP: ${req.ip}`)
  next()
})

// Test Route
app.get('/', (req, res) => {
  try {
    safeLog('DEBUG: Home route accessed')
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>VATSIM PMP - Debug</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          .debug { background: #f0f8ff; padding: 20px; border: 1px solid #0066cc; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>🚀 VATSIM PMP - Debug Mode</h1>
        <div class="debug">
          <h3>System Info</h3>
          <p><strong>Status:</strong> ✅ Running</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Node.js:</strong> ${process.version}</p>
          <p><strong>Working Dir:</strong> ${__dirname}</p>
          <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'not set'}</p>
        </div>
        
        <h2>Test Links</h2>
        <ul>
          <li><a href="/test">Test Route</a></li>
          <li><a href="/error">Error Test</a></li>
          <li><a href="/status">Status</a></li>
        </ul>
        
        <h2>Logs</h2>
        <p>Check debug.log and error.log files on server</p>
      </body>
      </html>
    `)
  } catch (error) {
    safeLog(`ERROR in home route: ${error.message}`)
    res.status(500).send('Error in home route: ' + error.message)
  }
})

app.get('/test', (req, res) => {
  safeLog('DEBUG: Test route accessed')
  res.json({
    message: 'Test successful',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    workingDir: __dirname
  })
})

app.get('/error', (req, res) => {
  safeLog('DEBUG: Triggering test error')
  throw new Error('Test error for debugging')
})

app.get('/status', (req, res) => {
  const uptime = process.uptime()
  res.json({
    status: 'OK',
    uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  })
})

// 404 Handler
app.use((req, res) => {
  safeLog(`404 Not Found: ${req.url}`)
  res.status(404).send(`
    <h1>404 - Seite nicht gefunden</h1>
    <p>URL: ${req.url}</p>
    <p><a href="/">Zurück zur Startseite</a></p>
  `)
})

safeLog('DEBUG: Routes configured')

// Export für Passenger
module.exports = app

// Direkter Start
if (require.main === module) {
  const port = process.env.PORT || 3000
  safeLog(`DEBUG: Starting server on port ${port}`)
  
  app.listen(port, (err) => {
    if (err) {
      safeLog(`ERROR starting server: ${err.message}`)
      process.exit(1)
    }
    safeLog(`✅ DEBUG: Server running on port ${port}`)
  })
}

safeLog('DEBUG: Module loaded successfully')
