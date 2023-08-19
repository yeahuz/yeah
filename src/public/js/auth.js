import { option, request, message_sw } from "./utils.js";
import { disable_form } from "./dom.js";
import { toast } from "./toast.js";

let BOT_ID = 5544485948;

export function on_telegram_login(e) {
  let form = e.target.closest("form");
  return new Promise((resolve) => {
    window.Telegram.Login.auth(
      {
        bot_id: BOT_ID,
        request_access: true,
      },
      async (user) => {
        if (!user) {
          toast("Telegram login failed", "err");
          return resolve();
        }
        let enable_form = disable_form(form);
        let [_, err] = await option(
          request(`/auth/telegram${window.location.search}`, {
            body: { user },
            state: { reload: true, replace: true },
          })
        );

        if (err) {
          enable_form(err);
          toast(err.message, "err");
          resolve();
        }
      }
    );
  });
}

export async function on_signup(e) {
  e.preventDefault();
  let form = e.target;
  let data = Object.fromEntries(new FormData(form));
  let enable_form = disable_form(form);

  let [_, err] = await option(
    request(form.action, { body: data, method: form.method, state: { replace: true } })
  );

  if (!err) {
    await message_sw({ type: "expire_partials" });
    window.location.reload();
  }

  toast(err.message, "err");
  enable_form(err);
}

export async function on_login(e) {
  e.preventDefault();
  let form = e.target;
  let data = Object.fromEntries(new FormData(form));

  let enable_form = disable_form(form);
  let [_, err] = await option(
    request(form.action, { body: data, method: form.method, state: { replace: true } })
  );

  if (!err) {
    await message_sw({ type: "expire_partials" });
    window.location.reload();
  }

  toast(err.message, "err");
  enable_form(err);
}

export async function on_logout(e) {
  e.preventDefault();
  let form = e.target;
  let [_, err] = await option(
    request(form.action, { method: form.method, state: { replace: true } })
  );

  let enable_form = disable_form(form);

  if (!err) {
    await message_sw({ type: "expire_partials" });
    window.location.reload();
  }

  toast(err.message, "err");
  enable_form(err);
}
