import { add_listeners } from "./dom.js";
import { on_logout } from "./auth.js";

const logout_form = document.querySelectorAll(".js-logout-form");

add_listeners(logout_form, {
  submit: on_logout,
});
