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
        const label = field.closest("label")
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

export function create_node(tag, attributes = {}) {
  const node = document.createElement(tag);
  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });

  return node;
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
  return [...node.parentElement.children].filter(c => c !== node);
}

function add_listener(node, events) {
  const types = Object.keys(events);
  types.forEach(type => node.addEventListener(type, events[type]))
}

export function add_listeners(nodeOrNodes, events) {
  if (nodeOrNodes instanceof NodeList) {
    nodeOrNodes.forEach((node) => add_listener(node, events));
  }

  if (nodeOrNodes instanceof Node) {
    add_listener(nodeOrNodes, events);
  }
}
