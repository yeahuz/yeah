import { PackBytes, string, array, bits, schemas } from "packBytes";

const schema = schemas({
  auth_scan: {
    topic: string,
    name: string,
    profile_photo_url: string,
  },
  subscribe: string,
  auth_init: string,
  auth_confirmed: { topic: string, token: string },
  auth_denied: string,
});

export const json_schema = JSON.stringify(schema);
export const encoder = new PackBytes(schema);

export const OPS = {
  AUTH_INIT: 1,
  AUTH_SCAN: 2,
  QR_RENEW: 3,
};

export const subscribe_encoder = new PackBytes({
  op: bits(8),
  payload: array(string),
});

export const operation_encoder = new PackBytes({
  op: bits(8),
});

export const simple_message_encoder = new PackBytes({
  op: bits(8),
  payload: string,
});

export const publish_encoder = new PackBytes({
  op: bits(8),
  payload: {
    topic: string,
    data: string,
  },
});

export const auth_scan_encoder = new PackBytes({
  op: bits(8),
  payload: {
    topic: string,
    data: {
      name: string,
      username: string,
      profile_photo_url: string,
    },
  },
});
