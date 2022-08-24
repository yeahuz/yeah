import { option, request, message_sw } from "./utils.js";
import { add_listeners, disable_form } from "./dom.js";
import { toast } from "./toast.js";

const login_form = document.querySelector(".js-login-form");
const logout_form = document.querySelectorAll(".js-logout-form");

async function on_login(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));

  const enable_form = disable_form(form);
  const [_, err] = await option(
    request(form.action, { body: data, method: form.method, state: { replace: true } })
  );

  if (!err) {
    await message_sw({ type: "expire_partials" });
    window.location.reload();
  }

  toast(err.message, "err");
  enable_form();
}

async function on_logout(e) {
  e.preventDefault();
  const form = e.target;
  const [_, err] = await option(
    request(form.action, { method: form.method, state: { replace: true } })
  );

  const enable_form = disable_form(form);

  if (!err) {
    await message_sw({ type: "expire_partials" });
    window.location.reload();
  }

  toast(err.message, "err");
  enable_form();
}

add_listeners(login_form, {
  submit: on_login,
});

add_listeners(logout_form, {
  submit: on_logout,
});
