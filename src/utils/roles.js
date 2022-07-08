export function authenticated_user(user) {
  return user != null;
}

export const guest_user = (user) => !authenticated_user(user);
