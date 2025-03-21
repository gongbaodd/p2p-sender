const path = require("path")
const http = require("http")

const express = require("express")

const morgan = require("morgan")

const WebSocket = require("ws")

const app = express()
const server = http.createServer(app)

app.use(morgan("combined"))

app.get("/", (req, res, next) => {
    const wss = new WebSocket.Server({ server })

    wss.on("connection", ws => {
        ws.on("message", msg => {});
        ws.on("close", () => {})
    })

    next()
})

app.use(express.static(
    path.join(__dirname, '../public')
))

app.get("/healthz", (_, res) => {
    res.send("OK")
})

const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
    console.log(`Server is runing on port ${PORT}`)
})

