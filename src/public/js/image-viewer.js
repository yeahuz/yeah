import { create_node } from "./dom.js";
import { generate_srcset } from "./utils.js";

const zoomables = document.querySelectorAll(".js-zoomable");

class ImageViewer {
  constructor(items) {
    this.items = items;
    this.current_index = 0;

    this.container = undefined;
    this.viewer = undefined;
    this.next_control = undefined;
    this.prev_control = undefined;

    this.init();
  }

  static from(items) {
    return new ImageViewer(items);
  }

  listen() {
    const self = this;
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
    const current = this.items[this.current_index];
    const is_at_end = this.items[this.items.length - 1] === current;
    if (is_at_end) return;
    this.current_index += 1;
    this.display_current();
  }

  prev() {
    const current = this.items[this.current_index];
    const is_at_start = this.items[0] === current;
    if (is_at_start) return;
    this.current_index -= 1;
    this.display_current();
  }

  display_current() {
    const current = this.items[this.current_index];
    const { photo_url } = current.dataset;
    const srcset = generate_srcset(photo_url, "fit=scale-down", 12);
    this.viewer.setAttribute("src", `${photo_url}/public`);
    this.viewer.setAttribute("srcset", srcset);
    this.update_controls();
  }

  toggle_viewer() {
    this.container.classList.toggle("-z-10");
    this.container.classList.toggle("z-50");
    this.container.classList.toggle("scale-90");
    this.container.classList.toggle("opacity-0");
  }

  create_container() {
    const container = create_node("div", {
      class:
        "flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black/60 duration-300 will-change-transform -z-10 opacity-0 scale-90 text-white",
      tabindex: "-1",
    });
    this.container = container;
    document.body.append(container);
  }

  create_viewer() {
    const viewer_container = create_node("div", { class: "max-w-2xl w-full" });
    const viewer = create_node("img", { class: "max-w-full max-h-full object-cover" });
    this.viewer = viewer;
    viewer_container.append(viewer);
    this.container.append(viewer_container);
  }

  update_controls() {
    const current = this.items[this.current_index];
    const is_at_end = this.items[this.items.length - 1] === current;
    const is_at_start = this.items[0] === current;

    this.next_control.toggleAttribute("disabled", is_at_end);
    this.prev_control.toggleAttribute("disabled", is_at_start);
  }

  create_controls() {
    const controls = create_node("div", {
      class: "absolute flex justify-between left-0 top-1/2 -translate-y-1/2 w-full px-8",
    });

    const next_control = this.create_control("next");
    const prev_control = this.create_control("prev");

    next_control.addEventListener("click", this.next.bind(this));
    prev_control.addEventListener("click", this.prev.bind(this));
    controls.append(prev_control, next_control);

    this.next_control = next_control;
    this.prev_control = prev_control;
    this.container.append(controls);
  }

  create_control(type) {
    const control = create_node("button", {
      class: "p-3 rounded-full duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed",
    });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("class", "w-5 h-5 pointer-events-none");

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("stroke-width", "1.5");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    path.setAttribute("stroke", "currentColor");

    const prev_path = "M20 12H4M4 12L10 18M4 12L10 6";
    const next_path = "M4 12H20M20 12L14 6M20 12L14 18";

    path.setAttribute("d", type === "next" ? next_path : prev_path);

    svg.append(path);
    control.append(svg);
    return control;
  }
}

ImageViewer.from(zoomables);
