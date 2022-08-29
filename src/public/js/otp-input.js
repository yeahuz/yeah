import { add_listeners } from "./dom.js";

export function on_input(e) {
  const value = e.target.value;
  const prev_sibling = e.target.previousElementSibling;
  const next_sibling = e.target.nextElementSibling;
  if (!value) {
    if (prev_sibling) prev_sibling.focus();
  } else {
    if (next_sibling) next_sibling.focus();
  }
}

export function on_paste(e, inputs) {
  e.preventDefault();
  const paste = (e.clipboardData || window.clipboardData).getData("text");
  inputs.forEach((input, i) => (input.value = paste[i]));
}

export function enable_otp_inputs(selector) {
  const inputs = document.querySelectorAll(selector);
  add_listeners(inputs, {
    input: on_input,
    paste: (e) => on_paste(e, inputs),
  });
}
