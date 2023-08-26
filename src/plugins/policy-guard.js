import * as UserService from "../services/user.service.js";
import { createMongoAbility } from "@casl/ability";
import { AuthorizationError } from "../utils/errors.js";

function interpolate_permissions(permissions, data) {
  for (let permission of permissions) {
    for (let key in permission.conditions) {
      let func = new Function(permission.conditions[key])();
      permission.conditions[key] = func(data);
    }
  }
  return permissions;
}

export function policy_guard(handler) {
  return async (req, reply) => {
    let user = req.user;
    let permissions = await UserService.get_permissions(user.id);
    user.permissions = interpolate_permissions(permissions, user);
    //TODO: cache this mofo
    req.ability = createMongoAbility(user.permissions);
    if (typeof handler === "function") {
      if (handler(req.ability)) return;
      else throw new AuthorizationError();
    }
  };
}
