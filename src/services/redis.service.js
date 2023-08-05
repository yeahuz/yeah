import Redis from 'ioredis'
import * as ChatService from "./chat.service.js";
import { option } from "../utils/index.js";

export const redis_client = new Redis()
export const sub = new Redis();

const handlers = {
  api: {
    new_message: async (payload) => {
      let item = await redis_client.rpop(payload.queue)
      if (item) item = JSON.parse(item)
      while (item) {
        const [msg, err] = await option(ChatService.create_message({
          chat_id: item.chat_id,
          content: item.content,
          sender_id: item.sender_id,
          reply_to: item.reply_to,
          type: item.type,
          attachments: item.attachments,
          created_at: item.created_at
        }))

        if (err) {
          redis_client.rpush(payload.queue, JSON.stringify(item))
          return
        }

        redis_client.publish("messages/sent", JSON.stringify(Object.assign(msg, { temp_id: item.temp_id })))
        item = await redis_client.rpop(payload.queue)
      }
    },
    read_message: async (payload) => {
      let [result, err] = await option(ChatService.read_message(payload));
      console.log({ result, err })
    }
  }
}

sub.on("message", async (channel, message) => {
  let { op, payload } = JSON.parse(message);
  let handle = handlers[channel]?.[op];
  if (handle) handle(payload)
})


sub.subscribe("api")
sub.subscribe("api/messages")

