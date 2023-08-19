import { add_listeners, span } from "dom";

let ripple_elements = document.querySelectorAll(".btn");

function create_ripple(e) {
  let button = e.currentTarget;

  let circle = span({ class: "ripple" });
  let diameter = Math.max(button.clientWidth, button.clientHeight);
  let radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${e.clientY - button.offsetTop - radius}px`;

  let ripple = button.getElementsByClassName("ripple")[0];

  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
}

add_listeners(ripple_elements, {
  click: create_ripple,
});
