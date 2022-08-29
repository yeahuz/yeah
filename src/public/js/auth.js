import { option, request, message_sw } from "./utils.js";
import { disable_form } from "./dom.js";
import { toast } from "./toast.js";

const BOT_ID = 5544485948;

export function on_telegram_login(e) {
  const form = e.target.closest("form");
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
        const enable_form = disable_form(form);
        const [_, err] = await option(request("/auth/telegram", { body: { user } }));
        if (err) {
          enable_form(err);
          toast(err.message, "err");
          return resolve();
        }
        const params = new window.URLSearchParams(window.location.search);
        const return_to = params.get("retutrn_to") || "/";
        await message_sw({ type: "expire_partials" });
        window.location.href = return_to;
        return resolve();
      }
    );
  });
}

export async function on_signup(e) {
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
  enable_form(err);
}

export async function on_login(e) {
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
  enable_form(err);
}

export async function on_logout(e) {
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
  enable_form(err);
}
