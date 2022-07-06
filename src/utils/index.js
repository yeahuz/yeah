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
  return (...args) =>
    fns.reduce((promise, fn) => promise.then(fn), Promise.resolve(...args));
}

export function pipe(...fns) {
  return (...args) =>
    fns.reduce(
      (previousOutput, currentFn) => currentFn(previousOutput),
      ...args
    );
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
  return crypto.createHash("SHA256").update(data).digest()
}

export function verify_sha256(signature, data, public_key) {
  return crypto.createVerify("SHA256").update(data).verify(public_key, signature)
}

export function get_domain_without_subdomain(url) {
  const urlParts = new URL(url).hostname.split(".");

  return urlParts
    .slice(0)
    .slice(-(urlParts.length === 4 ? 3 : 2))
    .join(".");
}
