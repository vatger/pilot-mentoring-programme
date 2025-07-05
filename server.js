const express = require('express')
const next = require('next')
const path = require('path')

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOST || 'localhost'
const port = process.env.PORT || 3000

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()

  // Serve static files from public directory
  server.use('/public', express.static(path.join(__dirname, 'public')))

  // Handle all other routes with Next.js
  server.all('*', (req, res) => {
    return handle(req, res)
  })

  server.listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on http://${hostname}:${port}`)
  })
}).catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
})
