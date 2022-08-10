import { option, request, message_sw } from './utils.js';
import { disable_form } from './dom.js'
import { toast } from './toast.js'

const login_form = document.querySelector(".js-login-form");
const logout_form = document.querySelector(".js-logout-form");

login_form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form))

  const enable_form = disable_form(form);
  const [result, err] = await option(request(form.action, { body: data, method: form.method, state: { replace: true } }));

  if (!err) {
    await message_sw({ type: "expire_partials" });
    window.location.reload();
  }

  toast(err.message, "err");
  enable_form();
});

logout_form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const [result, err] = await option(request(form.action, { method: form.method, state: { replace: true } }))

  const enable_form = disable_form(form);

  if (!err) {
    await message_sw({ type: "expire_partials" });
    window.location.reload();
  }

  toast(err.message, "err");
  enable_form();
})
