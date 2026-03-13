const xrpl = require("xrpl")
const client = new xrpl.Client(process.env.XRPL_WSS)

async function connectXRPL() {
  if (!client.isConnected()) {
    await client.connect()
    console.log("✅ XRPL connected")
  }
}

module.exports = { client, connectXRPL }