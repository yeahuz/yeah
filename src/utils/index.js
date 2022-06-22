import config from "../config/index.js";
import crypto from "crypto";

export async function option(promise) {
  try {
    const result = await promise;
    return [result, null];
  } catch (err) {
    return [null, err];
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
  return (...args) => fns.reduce((previousOutput, currentFn) => currentFn(previousOutput), ...args);
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
