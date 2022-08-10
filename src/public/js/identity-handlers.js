import { request, option, message_sw } from "./utils.js";

const get_time = () => Math.floor(new Date().getTime() / 1000);

async function handle_google_one_tap({ credential }) {
  const [result, err] = await option(request("/auth/google", { body: { credential } }));
  if (!err) {
    const params = new window.URLSearchParams(window.location.search);
    const return_to = params.get("return_to") || "/";
    await message_sw({ type: "expire_partials" });
    window.location.href = `${return_to}?t=${get_time()}`;
  }
}

async function telegram_callback(user) {
  const [result, err] = await option(request("/auth/telegram", { body: { user } }));
  if (!err) {
    const params = new window.URLSearchParams(window.location.search);
    const return_to = params.get("return_to") || "/";
    await message_sw({ type: "expire_partials" });
    window.location.href = `${return_to}?t=${get_time()}`;
  }
}

window.telegram_callback = telegram_callback;
window.handle_google_one_tap = handle_google_one_tap;
