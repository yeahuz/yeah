import { Notification } from "../models/index.js";
import { pool } from "../services/db.service.js";
import { option } from "../utils/index.js";

function create_one_impl(trx) {
  return async (payload) => Notification.query(trx).insert(payload);
}

export const create_one = create_one_impl();

export const create_one_trx = (trx) => create_one_impl(trx);

export async function get_count({ user_id, read = false, limit = 10 } = {}) {
  if (!user_id) return 0;
  const [result, err] = await option(pool.query(`select count(1)::int from user_notifications where user_id = $1 and read = $2`, [user_id, read]));

  if (err) return 0;
  return result.rows[0].count;
}

export async function get_many({ user_id, lang = "en" } = {}) {
  if (!user_id) return [];
  const [result, err] = await option(pool.query(`select n.id, n.created_at, type, read, title, content, 
                      json_build_object(
                        'name', u.name, 
                        'profile_url', u.profile_url,
                        'profile_photo_url', u.profile_photo_url) as sender,
                      json_build_object('name', u2.name) as receiver
                      from user_notifications un 
                      join notifications n on un.notification_id = n.id
                      join users u on u.id = n.sender_id
                      join notification_type_translations ntt on ntt.notification_type_name = n.type
                      join users u2 on u2.id = un.user_id
                      where un.user_id = $1 and ntt.language_code = $2;`, [user_id, lang.substring(0, 2)]));

  if (err) return [];
  return result.rows;
}
