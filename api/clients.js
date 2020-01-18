const redis = require('redis')
const { promisify } = require('util')
const { queryTeamspeak } = require('../lib/ts')

const redisOptions = { db: 0, password: process.env.REDIS_PASSWORD }

export default async (req, res) => {
  const client = redis.createClient(process.env.REDIS_PORT, process.env.REDIS_HOST, redisOptions)
  const existsAsync = promisify(client.exists).bind(client)
  const lrangeAsync = promisify(client.lrange).bind(client)
  const rpushAsync = promisify(client.rpush).bind(client)
  const expireAsync = promisify(client.expire).bind(client)

  let clients = []

  const exists = await existsAsync('clients')

  if (exists) {
    clients = await lrangeAsync('clients', 0, -1)
  } else {
    clients = await queryTeamspeak()
    
    await rpushAsync('clients', clients)
    await expireAsync('clients', 60)
  }

  client.end(true)
  res.json(clients)
}
