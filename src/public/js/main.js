import { add_listeners } from "./dom.js";
import { on_logout } from "./auth.js";

const header = document.querySelector(".js-header");
const logout_form = document.querySelectorAll(".js-logout-form");

function on_scroll() {
  let last_scroll = 0;
  let timeout_id = null;
  return function scroll() {
    if (timeout_id) clearTimeout(timeout_id);
    const current_scroll = window.pageYOffset || document.documentElement.scrollTop;
    const show = () => {
      header.classList.add("translate-y-0");
      header.classList.remove("-translate-y-full");
    };

    const hide = () => {
      header.classList.add("-translate-y-full");
      header.classList.remove("translate-y-0");
    };

    if (current_scroll <= 0) show();

    if (current_scroll < last_scroll) {
      timeout_id = setTimeout(show, 300);
    } else hide();

    last_scroll = current_scroll;
  };
}

function on_scroll_shadow() {
  const current_scroll = window.pageYOffset || document.documentElement.scrollTop;
  if (current_scroll > 80) {
    header?.classList.add("shadow-lg");
  } else {
    header?.classList.remove("shadow-lg");
  }
}

window.addEventListener("scroll", on_scroll_shadow, false);

add_listeners(logout_form, {
  submit: on_logout,
});
