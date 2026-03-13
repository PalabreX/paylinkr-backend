require("dotenv").config()
const express = require("express")
const cors = require("cors")
const { client, connectXRPL } = require("./xrpl")
const { payments, createPayment, markAsPaid, getPayment } = require("./payments")

const app = express()
app.use(cors())
app.use(express.json())

app.post("/create-link", (req, res) => {
  const { amount, destination, desc } = req.body
  if (!amount || !destination) {
    return res.status(400).json({ error: "Missing fields" })
  }
  const payment = createPayment({ amount, destination, desc })
  res.json(payment)
})

app.get("/payment/:id", (req, res) => {
  const payment = getPayment(req.params.id)
  if (!payment) return res.status(404).json({ error: "Not found" })
  res.json(payment)
})

app.get("/payments", (req, res) => {
  res.json(Object.values(payments))
})

connectXRPL().then(() => {
  client.on("transaction", tx => {
    try {
      const memos = tx.transaction?.Memos
      if (!memos) return
      const raw = memos[0]?.Memo?.MemoData
      if (!raw) return
      const id = Buffer.from(raw, "hex").toString("utf8")
      if (payments[id]) {
        markAsPaid(id, tx.transaction.hash)
        console.log("💸 Payment received:", id)
      }
    } catch(e) {}
  })
})

app.listen(process.env.PORT, () => {
  console.log(`🚀 PayLinkr backend running on port ${process.env.PORT}`)
})