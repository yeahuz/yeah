import Redis from 'ioredis'

export const redis_client = new Redis()
export const sub = new Redis();

sub.on("message", (channel, message) => {
  console.log({ channel, message })
})

sub.subscribe("api")

