const express = require("express")
const http = require("http")
const socketIo = require("socket.io")
const next = require("next")

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = express()
  const httpServer = http.createServer(server)
  const io = socketIo(httpServer, {
    cors: {
      origin: "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket) => {
    console.log("Ein Benutzer ist verbunden.")

    socket.on("chatMessage", (message) => {
      io.emit("chatMessage", message)
    })

    socket.on("disconnect", () => {
      console.log("Ein Benutzer hat die Verbindung getrennt.")
    })
  })

  server.all("*", (req, res) => {
    return handle(req, res)
  })

  httpServer.listen(3000, (err) => {
    if (err) throw err
    console.log("> Ready on http://localhost:3000")
  })
})

