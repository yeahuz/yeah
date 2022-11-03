import * as CredentialService from "../services/credential.service.js";
import * as SessionService from "../services/session.service.js";
import * as ChatService from "../services/chat.service.js";

export function authenticated_user(user) {
  return user != null;
}

export const guest_user = (user) => !authenticated_user(user);
export const current_user = (user, params) => {
  if (!user) return;
  return String(user.id) === params.id;
};

export const admin_user = (user) => {
  if (!user) return;
  return user.roles.some((role) => role.code === "admin");
};

export const external_client = (user) => {
  if (!user) return;
  return user.roles.some((role) => role.code === "external_client");
};

export async function own_credential(user, params) {
  if (!user) return;
  return !!(await CredentialService.belongs_to(user.id, params.id));
}

export async function own_session(user, params) {
  if (!user) return;
  return !!(await SessionService.belongs_to(user.id, params.id));
}

export async function chat_member(user, params) {
  if (!user) return;
  return !!(await ChatService.is_chat_member(user.id, params.id));
}
