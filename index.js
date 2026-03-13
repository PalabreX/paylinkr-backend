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
app.get("/pay/:id", (req, res) => {
  const payment = getPayment(req.params.id)
  if (!payment) return res.status(404).send(`
    <html>
      <body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0f;color:white;">
        <h1>❌ Lien introuvable</h1>
        <p style="color:#888">Ce lien de paiement n'existe pas ou a expiré.</p>
      </body>
    </html>
  `)
  res.send(`
    <html>
      <body style="font-family:sans-serif;text-align:center;padding:60px;background:#0a0a0f;color:white;">
        <h1 style="color:#00e5a0">💸 Paiement XRPay</h1>
        <p style="font-size:24px;font-weight:bold;">${payment.amount} XRP</p>
        <p style="color:#888">${payment.desc || ''}</p>
        <p style="color:#888;font-size:12px;">Vers : ${payment.destination}</p>
        <p style="color:#888;font-size:12px;">Statut : ${payment.status === 'paid' ? '✅ Payé' : '⏳ En attente'}</p>
      </body>
    </html>
  `)
})
app.listen(process.env.PORT, () => {
  console.log(`🚀 PayLinkr backend running on port ${process.env.PORT}`)
})