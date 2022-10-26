import { add_listeners } from "./dom.js";
const header = document.querySelector(".js-header");
const masked_inputs = document.querySelectorAll(".js-masked-input");

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

if (masked_inputs) {
  function masked_input_listener(maskit) {
    return function on_masked_input(e) {
      const mask = e.target.dataset.mask;
      const unmask = e.target.dataset.unmask;
      e.target.value = maskit(maskit(e.target.value, unmask), mask);
    };
  }

  import("/public/js/mask.js").then((mod) => {
    const { maskit } = mod;
    const on_masked_input = masked_input_listener(maskit);
    add_listeners(masked_inputs, { input: on_masked_input });
    masked_inputs.forEach((input) => (input.value = maskit(input.value, input.dataset.mask)));
  });
}

window.addEventListener("scroll", on_scroll_shadow, false);
