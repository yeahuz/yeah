import Redis from 'ioredis'
import * as ChatService from "./chat.service.js";
import { option } from "../utils/index.js";

export const redis_client = new Redis()
export const sub = new Redis();

sub.on("message", async (channel, message) => {
  switch (channel) {
    case "api/messages": {
      const result = JSON.parse(message);
      let item = await redis_client.rpop(result.queue)
      if (item) item = JSON.parse(item)
      while (item) {
        let msg = item;
        let err = undefined
        switch (item.type) {
          case "text": {
            [msg, err] = await option(ChatService.create_message({
              chat_id: item.chat_id,
              content: item.content,
              sender_id: item.sender_id,
              reply_to: item.reply_to,
              created_at: item.created_at
            }));
          } break;
          case "file": {
            [msg, err] = await option(ChatService.link_file({
              chat_id: item.chat_id,
              content: item.content,
              file: item.file,
              sender_id: item.sender_id,
              reply_to: item.reply_to,
              created_at: item.created_at
            }));
          } break;
          default:
            break;
        }

        if (err) {
          redis_client.rpush(result.queue, message)
          return
        }

        redis_client.publish("messages/sent", JSON.stringify(Object.assign(msg, { temp_id: item.temp_id })))
        item = await redis_client.rpop(result.queue)
      }
    } break;
    default:
      break
  }
})

sub.subscribe("api")
sub.subscribe("api/messages")

