import { PackBytes, string, array, bits } from "packBytes";

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

// function merge_schemas(...schemas) {
//   const map = new Map();
//   for (const schema of schemas) {
//     const op = new Uint8Array(schema, 0, 1)[0];
//     map.set(op, schema);
//   }

//   return function create_encoder(buf) {
//     const op = new Uint8Array(buf, 0, 1)[0];

//   };
// }

const sub_schema = {
  op: string("subscribe"),
  payload: array(string),
};

const pub_schema = {
  op: string("publish"),
  payload: {
    topic: string,
    data: string,
  },
};
