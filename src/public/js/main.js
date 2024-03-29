import { add_listeners } from "dom";
let masked_inputs = document.querySelectorAll(".js-masked-input");

if (masked_inputs.length) {
  function masked_input_listener(maskit) {
    return function on_masked_input(e) {
      let mask = e.target.dataset.mask;
      let unmask = e.target.dataset.unmask;
      e.target.value = maskit(maskit(e.target.value, unmask), mask);
    };
  }

  import("/public/js/mask.js").then((mod) => {
    let { maskit } = mod;
    let on_masked_input = masked_input_listener(maskit);
    add_listeners(masked_inputs, { input: on_masked_input });
    masked_inputs.forEach((input) => (input.value = maskit(input.value, input.dataset.mask)));
  });
}
