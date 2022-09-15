import { request, option, message_sw } from "./utils.js";
import { add_listeners } from "./dom.js";
import { toast } from "./toast.js";

const theme_inputs = document.querySelectorAll(".js-theme-input");

async function on_theme_switch(e) {
  const form = e.target.form;
  const data = new FormData(form);
  const theme = data.get("theme");
  const [result, err] = await option(request(form.action, { body: { theme } }));

  if (err) {
    toast(err.message, "err");
    return;
  }

  await message_sw({ type: "expire_partials" });
  await message_sw({
    type: "delete_content",
    payload: {
      cache_name: "swr_content",
      url: "/settings/appearance",
    },
  });
  change_theme(theme);
}

function get_system_theme() {
  const is_dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  if (is_dark) return "dark";
  return "light";
}

function change_theme(new_theme) {
  const root = document.documentElement;
  const already_set = root.className.includes(new_theme);
  if (already_set) return;
  if (new_theme === "system") {
    new_theme = get_system_theme();
  }

  root.className = new_theme;
}

add_listeners(theme_inputs, {
  change: on_theme_switch,
});
