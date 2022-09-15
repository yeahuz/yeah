import * as CredentialService from "../services/credential.service.js";
import * as SessionService from "../services/session.service.js";

export function authenticated_user(user) {
  return user != null;
}

export const guest_user = (user) => !authenticated_user(user);

export async function own_credential(user, params) {
  return !!(await CredentialService.belongs_to(user.id, params.id));
}

export async function own_session(user, params) {
  return !!(await SessionService.belongs_to(user.id, params.id));
}
