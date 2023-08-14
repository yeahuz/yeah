import { div, classes, attrs, img, children, button, svg, path } from "./dom.js";
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
    this.observer = new MutationObserver(this.on_change.bind(this))

    this.init();
  }

  static from(items) {
    return new ImageViewer(items);
  }

  on_change(mutations) {
    for (let mutation of mutations) {
      if (mutation.addedNodes.length) {
        let zoomables = node.querySelectorAll(".js-zoomable");
        if (zoomables.length) {
          let previous_len = this.items.length;
          this.items = document.querySelectorAll(".js-zoomable");
          for (let i = previous_len; i < zoomables.length + previous_len; i++) {
            this.items[i].addEventListener("click", () => {
              this.current_index = i;
              this.toggle_viewer();
              this.display_current();
            })
          }
        }
      }
    }
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
    this.observer.observe(document.querySelector(".js-messages"), { childList: true });
  }

  next() {
    const current = this.items[this.current_index];
    const is_at_end = this.items[this.items.length - 1] === current;
    console.log("NEXT", { is_at_end });
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
    const { photo_url, object_url } = current.dataset;
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
    this.container.classList.toggle("scale-90");
    this.container.classList.toggle("opacity-0");

    const is_open = this.container.classList.contains("z-50");
    if (is_open) {
      document.body.style.overflow = is_open ? "hidden" : "auto";
      this.container.focus();
    }
  }

  create_container() {
    const container = div(
      classes("flex items-center justify-center fixed top-0 left-0 w-screen h-screen bg-black/60 duration-300 will-change-transform -z-10 opacity-0 scale-90 text-white outline-none"),
      attrs({ tabindex: "-1" })
    );
    this.container = container;
    document.body.append(container);
  }

  create_viewer() {
    const viewer = img(classes("max-w-full max-h-full object-cover"));
    const viewer_container = div(classes("max-w-2xl w-full"), children(viewer));
    this.viewer = viewer;
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
    const controls = div(classes("absolute flex justify-between left-0 top-1/2 -translate-y-1/2 w-full px-8"));

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
    const control = button(classes("p-3 rounded-full duration-200 hover:bg-zinc-800 disabled:cursor-not-allowed"));
    const icon = svg(attrs({
      viewBox: "0 0 24 24",
      fill: "none",
      class: "w-5 h-5 pointer-events-none"
    }));

    const p = path(attrs({
      "stroke-width": "1.5",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "stroke": "currentColor"
    }));

    const prev_path = "M20 12H4M4 12L10 18M4 12L10 6";
    const next_path = "M4 12H20M20 12L14 6M20 12L14 18";

    p.setAttribute("d", type === "next" ? next_path : prev_path);

    icon.append(p);
    control.append(icon);
    return control;
  }
}

ImageViewer.from(zoomables);
