import { create_node, add_listeners } from "./dom.js";

const ripple_elements = document.querySelectorAll(".btn");

function create_ripple(e) {
  const button = e.currentTarget;

  const circle = create_node("span", { class: "ripple" });
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${e.clientY - button.offsetTop - radius}px`;

  const ripple = button.getElementsByClassName("ripple")[0];

  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
}

add_listeners(ripple_elements, {
  click: create_ripple,
});
