const { queryTeamspeak } = require('../lib/ts')

let clients = []
let updatedAt = 0

export default async (req, res) => {
  if (Date.now() - updatedAt > 60 * 1000) {
    clients = clients = await queryTeamspeak()
    updatedAt = Date.now()
  }

  res.json({ clients, updatedAt })
}
