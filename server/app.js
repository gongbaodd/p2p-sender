const path = require("path")

const express = require("express")
const PORT = process.env.PORT || 3000

const morgan = require("morgan")

const app = express()

app.use(morgan("combined"))

app.use(express.static(
    path.join(__dirname, '../public')
))

app.get("/healthz", (_, res) => {
    res.send("OK")
})

app.listen(PORT, () => {
    console.log(`Server is runing on port ${PORT}`)
})