import { app } from './app.js'
import { env } from './config/env.js'

const server = app.listen(env.APP_PORT, () => {
  console.log(`Backend running on http://localhost:${env.APP_PORT}`)
})

// Mencegah koneksi menggantung dari download manager / XDM
server.setTimeout(0)             // Biarkan streaming S3 bebas tanpa timeout
server.keepAliveTimeout = 10_000 // Tutup koneksi idle setelah 10 detik
server.headersTimeout = 11_000   // Harus selalu lebih besar dari keepAliveTimeout