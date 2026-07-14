import { config } from 'dotenv'
import { Redis } from '@upstash/redis'

config({ path: '.env.local' })

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

const id = '7e664719-5cb6-438f-8698-e28e06cef2c5'
await redis.del(`drivefinder:req:${id}`)
await redis.lrem('drivefinder:requests', 0, id)
console.log('Deleted test entry', id)
