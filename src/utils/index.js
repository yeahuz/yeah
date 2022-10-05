import config from "../config/index.js";
import crypto from "crypto";
import { DomainError, InternalError } from "./errors.js";

export async function option(promise) {
  try {
    const result = await promise;
    return [result, null];
  } catch (err) {
    if (err instanceof DomainError) {
      return [null, err];
    }
    return [null, new InternalError()];
  }
}

export function format_relations(relations = []) {
  const str = relations.toString();
  const newRelations = str ? `[${str}]` : str;
  return newRelations;
}

export function async_pipe(...fns) {
  return (...args) => fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(...args));
}

export function pipe(...fns) {
  return (...args) => fns.reduce((output, current_fn) => current_fn(output), ...args);
}

export function prop(key) {
  return (obj) => obj[key];
}

const IV_LENGTH = 16;

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(config.encryption_key, "hex"),
    iv
  );

  const encrypted = Buffer.concat([iv, cipher.update(text), cipher.final()]);

  return encrypted.toString("hex");
}

export function decrypt(hash) {
  const iv = Buffer.from(hash, "hex").slice(0, IV_LENGTH);
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(config.encryption_key, "hex"),
    iv
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(hash, "hex").slice(IV_LENGTH)),
    decipher.final(),
  ]);

  return decrypted.toString();
}

export function get_time() {
  return Math.floor(new Date().getTime() / 1000);
}

export function parse_unique_error(detail) {
  return detail.match(/\((?<key>[^)]+)\)=\((?<value>[^)]+)\)/g)?.groups;
}

export function create_date_formatter(locale) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "numeric",
    hourCycle: "h24",
    minute: "numeric",
  });
}

export function hash_sha256(data) {
  return crypto.createHash("SHA256").update(data).digest();
}

export function verify_sha256(signature, data, public_key) {
  return crypto.createVerify("SHA256").update(data).verify(public_key, signature);
}

export function get_domain_without_subdomain(url) {
  const url_parts = new URL(url).hostname.split(".");

  return url_parts
    .slice(0)
    .slice(-(url_parts.length === 4 ? 3 : 2))
    .join(".");
}

function has_query_params(path) {
  return path.includes("?");
}

export function add_t(path) {
  if (!path) return;
  if (has_query_params(path)) {
    return `${path}&t=${get_time()}`;
  }

  return `${path}?t=${get_time()}`;
}

export function add_minutes_to_now(mins = 0) {
  const now = new Date();
  return new Date(now.getTime() + mins * 60000);
}

export function group_by(key, root_id = "0") {
  const result = {};
  return (arr) => {
    for (const item of arr) {
      let parent_id = item[key];
      if (!parent_id) {
        parent_id = root_id;
      }
      if (!result[parent_id]) result[parent_id] = [];
      result[parent_id].push(item);
    }
    return result;
  };
}

export function create_tree(children_prop, root_id = "0", custom_id = "id") {
  return function t(grouped) {
    let tree = [];
    const root_nodes = grouped[root_id];

    for (const root_node in root_nodes) {
      const node = root_nodes[root_node];
      const child_node = grouped[node[custom_id]];

      if (!node && !root_nodes.hasOwnProperty(root_node)) {
        continue;
      }

      if (child_node) {
        node[children_prop] = create_tree(children_prop, root_id, custom_id)(child_node);
      }

      tree.push(node);
    }
    return tree;
  };
}

export function array_to_tree(arr, parent_id = null) {
  return arr
    .filter((item) => item.parent_id === parent_id)
    .map((child) => ({ ...child, children: array_to_tree(arr, child.id) }));
}

export function create_tree2(array, rootNodes, customID, childrenProperty) {
  var tree = [];

  for (var rootNode in rootNodes) {
    var node = rootNodes[rootNode];
    var childNode = array[node[customID]];

    if (!node && !rootNodes.hasOwnProperty(rootNode)) {
      continue;
    }

    if (childNode) {
      node[childrenProperty] = create_tree2(array, childNode, customID, childrenProperty);
    }

    tree.push(node);
  }

  return tree;
}

export function parse_url(url) {
  return new URL(url, config.origin);
}

export function cleanup_object(obj) {
  for (const prop in obj) {
    if (!obj[prop]) delete obj[prop];
  }
  return obj;
}

export function transform_object(obj, transformations) {
  for (const prop in transformations) {
    if (obj[prop]) obj[prop] = transformations[prop](obj[prop]);
  }
  return obj;
}

export function generate_srcset(url, options, count = 20) {
  let srcset = "";
  for (let i = 1; i <= count; i++) {
    let w = i * 100;
    srcset += `${url}/width=${w},${options} ${w}w, `;
  }
  return srcset;
}

export function remove_query_value(current, key, value_to_remove) {
  const query_params = new URLSearchParams(current);
  const values = query_params.getAll(key);

  if (values.length) {
    query_params.delete(key);
    for (const value of values) {
      if (value !== value_to_remove) {
        query_params.append(key, value);
      }
    }
  }

  return decodeURIComponent(query_params.toString());
}

export function append_query_value(current, key, value) {
  const params = new URLSearchParams(current);
  params.append(key, value);
  return decodeURIComponent(params.toString());
}
