import { createMongoAbility, AbilityBuilder } from "@casl/ability";
import { AuthorizationError } from "../utils/errors.js";

function define_ability(user) {
  let { can: allow, build } = new AbilityBuilder(createMongoAbility);

  if (user.roles.some(role => role.code === "admin")) {
    allow("manage", "all", ["status"])
  } else if (user.roles.some(role => role.code === "external_client")) {
    allow("read", "Session");
  } else {
    allow("update", "Listing", ["title", "description", "attribute_set", "cover_id", "category_id"], { created_by: user.id });
    allow("delete", "Chat", { created_by: user.id });
    allow("delete", "Session", { user_id: user.id });
    allow("delete", "Account", { user_id: user.id });
    allow("read", "BillingAccount", { user_id: user.id });
    allow("update", "Credential", ["title"], { user_id: user.id });
    allow("read", "Credential", { user_id: user.id });
    allow("update", "Message", ["content", "reply_to"], { sender_id: user.id });
    allow("update", "User", ["phone", "email", "name", "username", "bio", "website_url", "profile_photo_url", "email", "password"], { id: user.id });
    allow("update", "UserPreference", { user_id: user.id });
  }

  return build();
}

export function policy_guard(handler) {
  return (req, reply, next) => {
    let user = req.user;
    let ability = define_ability(user);
    req.ability = ability;
    if (typeof handler === "function") {
      if (handler(ability)) next();
      else throw new AuthorizationError();
    }
  }
}
