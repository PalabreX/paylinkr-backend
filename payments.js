const { v4: uuidv4 } = require("uuid")
const payments = {}

function createPayment({ amount, destination, desc }) {
  const id = uuidv4()
  payments[id] = {
    id, amount, destination, desc,
    status: "pending",
    createdAt: Date.now()
  }
  return payments[id]
}

function markAsPaid(id, hash) {
  if (payments[id]) {
    payments[id].status = "paid"
    payments[id].txHash = hash
    payments[id].paidAt = Date.now()
  }
}

function getPayment(id) {
  return payments[id] || null
}

module.exports = { payments, createPayment, markAsPaid, getPayment }