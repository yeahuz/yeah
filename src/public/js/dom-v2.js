import { is_apple_device } from "./utils.js";

export function hide_form_errors(elements) {
  elements.forEach((element) => {
    const message_field = element.nextElementSibling;
    if (message_field?.nodeName === "SMALL") {
      message_field.textContent = "";
    }
  });
}

export function disable_form(form) {
  const elements = Array.from(form.elements);
  const fns = elements.map(disable_element);
  hide_form_errors(elements);
  return function enable_form(errorObject) {
    fns.forEach((fn) => fn());
    if (errorObject?.errors?.length) {
      errorObject.errors.forEach((err, index) => {
        const field = form.querySelector(`[name=${err.field}]`);
        if (index === 0) field.focus();
        const label = field.closest("label");
        const message_field = label.querySelector("small");
        if (message_field) message_field.textContent = err.message;
      });
    }
  };
}

export function disable_element(element) {
  element.setAttribute("disabled", true);
  return function enable_element() {
    element.removeAttribute("disabled");
  };
}

export function create_node(tag, fns = []) {
  const node = document.createElement(tag);
  for (const fn of fns) fn(node);
  return node;
}

export function text(content) {
  return (node) => {
    node.textContent = content;
    return node;
  };
}

export function attrs(attrs) {
  return (node) => {
    for (const attr in attrs) {
      node.setAttribute(attr, attrs[attr]);
    }
    return node;
  };
}

export function create_svg_ns(fns = []) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  for (const fn of fns) fn(svg);

  return svg;
}

export function create_path_ns(fns = []) {
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  for (const fn of fns) fn(path);

  return path;
}

export function remove_node(node) {
  const parent = node.parentElement;
  const original = parent.removeChild(node);
  return function restore_node() {
    parent.appendChild(original);
  };
}

export function html_to_node(html) {
  const template = create_node("template");
  template.innerHTML = html.trim();
  return template.content.firstChild;
}

export function replace_text(node, text) {
  const original = node.textContent;
  node.textContent = text;
  return function restore_text() {
    node.textContent = original;
  };
}

export function get_siblings(node) {
  return [...node.parentElement.children].filter((c) => c !== node);
}

function add_listener(node, events) {
  const types = Object.keys(events);
  types.forEach((type) => node.addEventListener(type, events[type]));
}

export function add_listeners(nodeOrNodes, events) {
  if (nodeOrNodes instanceof NodeList) {
    nodeOrNodes.forEach((node) => add_listener(node, events));
  }

  if (nodeOrNodes instanceof Node) {
    add_listener(nodeOrNodes, events);
  }
}

export function adjust_geo_links() {
  if (is_apple_device()) {
    const links = document.querySelectorAll("a[href*='geo:']");
    for (const link of links) {
      const loc = link.href.split(":")[1];
      const [lat, lon] = loc.split(",");
      link.href = `maps:?q=${lat}, ${lon}`;
    }
  }
}

export function classes(constant, dynamic = {}) {
  let classnames = constant;
  return (node) => {
    for (let prop in dynamic) {
      if (dynamic[prop]) classnames += ` ${prop}`;
    }

    node.setAttribute("class", classnames);
    return node;
  };
}

export function children(...nodes) {
  return (node) => node.append(...nodes);
}

export function create_fragment(fns = []) {
  const fragment = new DocumentFragment();
  for (const fn of fns) fn(fragment);
  return fragment;
}

export function html(str) {
  return (node) => {
    node.innerHTML = str;
    return node;
  };
}

export const fragment = (...fns) => create_fragment(fns);
export const svg = (...fns) => create_svg_ns(fns);
export const path = (...fns) => create_path_ns(fns);
export const span = (...fns) => create_node("span", fns);
export const div = (...fns) => create_node("div", fns);
export const ul = (...fns) => create_node("ul", fns);
export const li = (...fns) => create_node("li", fns);
export const p = (...fns) => create_node("p", fns);
export const img = (...fns) => create_node("img", fns);
export const h2 = (...fns) => create_node("h2", fns);
export const a = (...fns) => create_node("a", fns);
