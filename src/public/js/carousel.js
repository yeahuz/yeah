import { create_node } from "./dom.js";

export class Carousel {
  constructor(element) {
    this.elements = {
      root: element,
      scroller: element.querySelector(".js-carousel-scroller"),
      snaps: element.querySelectorAll(".js-carousel-snap"),
      previous: element.querySelector(".js-carousel-prev"),
      next: element.querySelector(".js-carousel-next"),
      pagination: element.querySelector(".js-carousel-pagination"),
    };

    this.current = undefined;
    this.has_intersected = new Set();

    this.create_observers();
    this.init_state();
    this.listen();
  }

  go_next() {
    const next = this.current.nextElementSibling;
    if (this.current === next) return;
    if (next) this.go_to_element(next);
  }

  go_previous() {
    const prev = this.current.previousElementSibling;
    if (this.current === prev) return;
    if (prev) this.go_to_element(prev);
  }

  go_to_element(element) {
    const scroller = this.elements.scroller;
    const delta = Math.abs(scroller.offsetLeft - element.offsetLeft);
    const scroller_padding = parseInt(window.getComputedStyle(scroller)["padding-left"]);
    const pos =
      scroller.clientWidth / 2 > delta ? delta - scroller_padding : delta + scroller_padding;

    scroller.scrollTo({
      left: pos,
      top: 0,
      behavior: "smooth",
    });

    this.current = element;
    this.update_controls();
  }

  listen() {
    for (const snap of this.elements.snaps) {
      this.carousel_observer.observe(snap);
    }
    this.elements.next.addEventListener("click", this.go_next.bind(this));
    this.elements.previous.addEventListener("click", this.go_previous.bind(this));
    this.elements.pagination.addEventListener("click", this.handle_paginate.bind(this));
    this.elements.root.addEventListener("keydown", this.handle_key_down.bind(this));
  }

  init_state() {
    const start_index = 0;
    this.current = this.elements.snaps[start_index];

    this.elements.snaps.forEach((snap, index) => {
      this.has_intersected.add({
        is_intersecting: index === 0,
        target: snap,
      });
    });
  }

  handle_paginate(e) {
    if (e.target.classList.contains("js-carousel-pagination")) {
      return;
    }
    const snap = this.elements.snaps[this.get_element_index(e.target)];
    this.go_to_element(snap);
  }

  get_element_index(element) {
    let index = 0;
    while ((element = element.previousElementSibling)) index++;
    return index;
  }

  update_controls() {
    const { lastElementChild: last, firstElementChild: first } = this.elements.scroller;
    const is_at_end = last === this.current;
    const is_at_start = first === this.current;

    if (document.activeElement === this.elements.next && is_at_end) {
      this.elements.previous.focus();
    } else if (document.activeElement === this.elements.previous && is_at_start) {
      this.elements.next.focus();
    }

    this.elements.next.toggleAttribute("disabled", is_at_end);
    this.elements.previous.toggleAttribute("disabled", is_at_start);
  }

  create_observers() {
    this.carousel_observer = new IntersectionObserver(
      (observations) => {
        for (const observation of observations) {
          this.has_intersected.add(observation);
          observation.target.classList.toggle("in-view", observation.isIntersecting);
        }
      },
      { root: this.elements.scroller, threshold: 0.6 }
    );
  }

  handle_key_down(e) {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        this.go_next();
      case "ArrowLeft":
        e.preventDefault();
        this.go_previous();
    }
  }
}

document.querySelectorAll(".js-carousel").forEach((element) => {
  new Carousel(element);
});
