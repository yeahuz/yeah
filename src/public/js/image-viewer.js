import { div, img, button, svg, path } from "dom";
import { generate_srcset } from "./utils.js";

export class ImageViewer {
  constructor(selector) {
    this.selector = selector;
    this.items = document.querySelectorAll(selector);
    this.current_index = 0;

    this.container = undefined;
    this.viewer = undefined;
    this.next_control = undefined;
    this.prev_control = undefined;
    this.scrollbar_width = window.innerWidth - document.documentElement.clientWidth;

    this.init();
  }

  static from(items) {
    return new ImageViewer(items);
  }

  reselect() {
    let previous_len = this.items.length;
    this.items = document.querySelectorAll(this.selector);
    for (let i = previous_len, len = previous_len + (this.items.length - previous_len); i < len; i++) {
      this.items[i].addEventListener("click", () => {
        this.current_index = i;
        this.toggle_viewer();
        this.display_current();
      })
    }
  }

  listen() {
    let self = this;
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].addEventListener("click", () => {
        self.current_index = i;
        self.toggle_viewer();
        self.display_current();
      });
    }

    this.container.addEventListener("keydown", this.keydown.bind(this));
    this.container.addEventListener("click", this.close.bind(this));
  }

  close(e) {
    if (e.target === e.currentTarget) {
      this.toggle_viewer();
    }
  }

  keydown(e) {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        this.next();
        break;
      case "Escape":
        e.preventDefault();
        this.close(e);
        break;
      case "ArrowLeft":
        e.preventDefault();
        this.prev();
        break;
      default:
        break;
    }
  }

  init() {
    this.create_container();
    this.create_controls();
    this.create_viewer();
    this.listen();
  }

  next() {
    let current = this.items[this.current_index];
    let is_at_end = this.items[this.items.length - 1] === current;
    if (is_at_end) return;
    this.current_index += 1;
    this.display_current();
  }

  prev() {
    let current = this.items[this.current_index];
    let is_at_start = this.items[0] === current;
    if (is_at_start) return;
    this.current_index -= 1;
    this.display_current();
  }

  display_current() {
    let current = this.items[this.current_index];
    let { photo_url, object_url } = current.dataset;
    if (object_url) {
      this.viewer.removeAttribute("srcset");
      this.viewer.removeAttribute("crossorigin");
      this.viewer.removeAttribute("referrerpolicy");
      this.viewer.setAttribute("src", object_url);
    } else {
      let srcset = generate_srcset(photo_url, "fit=scale-down", 12);
      this.viewer.setAttribute("src", `${photo_url}/public`);
      this.viewer.setAttribute("srcset", srcset);
      this.viewer.setAttribute("crossorigin", "anonymous");
      this.viewer.setAttribute("referrerpolicy", "no-referrer");
    }
    this.update_controls();
  }

  toggle_viewer() {
    this.container.classList.toggle("-z-10");
    this.container.classList.toggle("z-50");
    this.container.classList.toggle("opacity-0");
    this.container.classList.toggle("scale-90");

    let is_open = this.container.classList.contains("z-50");
    document.body.style.overflow = is_open ? "hidden" : "auto";
    document.body.style.paddingRight = is_open ? this.scrollbar_width + "px" : 0;
    if (is_open) this.container.focus();
  }

  create_container() {
    let container = div({
      class: "flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black/60 duration-300 will-change-transform -z-10 opacity-0 scale-90 text-white outline-none",
      tabindex: "-1"
    });
    this.container = container;
    document.body.append(container);
  }

  create_viewer() {
    let viewer = img({ class: "max-w-full max-h-full object-cover" })
    let viewer_container = div({ class: "max-w-2xl w-full" }, viewer);
    this.viewer = viewer;
    this.container.append(viewer_container);
  }

  update_controls() {
    let current = this.items[this.current_index];
    let is_at_end = this.items[this.items.length - 1] === current;
    let is_at_start = this.items[0] === current;

    this.next_control.toggleAttribute("disabled", is_at_end);
    this.prev_control.toggleAttribute("disabled", is_at_start);
  }

  create_controls() {
    let controls = div({ class: "absolute flex justify-between left-0 top-1/2 -translate-y-1/2 w-full px-8" });

    let next_control = this.create_control("next");
    let prev_control = this.create_control("prev");

    next_control.addEventListener("click", this.next.bind(this));
    prev_control.addEventListener("click", this.prev.bind(this));
    controls.append(prev_control, next_control);

    this.next_control = next_control;
    this.prev_control = prev_control;
    this.container.append(controls);
  }

  create_control(type) {
    let prev_path = "M20 12H4M4 12L10 18M4 12L10 6";
    let next_path = "M4 12H20M20 12L14 6M20 12L14 18";
    let p = path({
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke": "currentColor",
      "d": type === "next" ? next_path : prev_path
    });

    let icon = svg({
      viewBox: "0 0 24 24",
      fill: "none",
      class: "w-5 h-5 pointer-events-none"
    }, p);

    return button({ class: "p-3 rounded-full duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed" }, icon);
  }
}

//ImageViewer.from(".js-zoomable");
