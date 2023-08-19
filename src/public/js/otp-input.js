import { add_listeners } from "dom";

export function on_input(e) {
  let value = e.target.value;
  let prev_sibling = e.target.previousElementSibling;
  let next_sibling = e.target.nextElementSibling;
  if (!value) {
    if (prev_sibling) prev_sibling.focus();
  } else {
    if (next_sibling) next_sibling.focus();
  }
}

export function on_paste(e, inputs) {
  e.preventDefault();
  let paste = (e.clipboardData || window.clipboardData).getData("text");
  inputs.forEach((input, i) => (input.value = paste[i]));
}

export function enable_otp_inputs(selector) {
  let inputs = document.querySelectorAll(selector);
  add_listeners(inputs, {
    input: on_input,
    paste: (e) => on_paste(e, inputs),
  });
}
