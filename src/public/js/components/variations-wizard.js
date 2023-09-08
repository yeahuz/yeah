import {
  div,
  select,
  fragment,
  option,
  listeners,
  input,
  label,
  tr,
  th,
  td,
  svg,
  html,
  span,
  button
} from "dom";
import { effect, signal } from "state";
import { chevron_down_path } from "../icons.js";
import { el, list, mount, setChildren, setAttr } from "redom";

class Li {
  constructor() {
    this.el = el("li");
  }

  update(data) {
    this.el.textContent = data.name;
  }
}

const ul = list("ul", Li, "_id");

export function SelectOptions(attributes) {
  let list = fragment();
  for (let attribute of attributes) list.append(option({ value: attribute.key }, attribute.name))
  return list;
}

class SelectOption {
  constructor() {
    this.el = el("option");
  }

  update(attribute) {
    this.el.value = attribute.key;
    this.el.textContent = attribute.name;
    this.el.toggleAttribute("disabled", !!attribute.disabled)
  }
}

class AttributeOption {
  constructor() {
    this.el = el("li",
      (this.option_label = el("input", { type: "hidden" })),
      (this.checkbox = el("input.absolute.-z-10.opacity-0.w-0.peer", { type: "checkbox" })),
      (this.label = el("label", {
        className: `border border-gray-300 dark:border-zinc-700 p-2 rounded-md cursor-pointer text-gray-500
      dark:text-gray-400 peer-checked:bg-gray-100 peer-checked:dark:bg-zinc-800 peer-checked:dark:border-zinc-600
      peer-checked:text-gray-900 dark:peer-checked:text-white hover:bg-gray-50 hover:text-gray-900
      hover:dark:bg-zinc-800 hover:dark:text-white duration-200 inline-block` }))
    )
  }

  update(option, index, items, attribute) {
    let name = option.unit ? `${option.name} ${option.unit}` : option.name;
    let value = option.unit ? `${option.value} ${option.unit}` : option.value;
    setAttr(this.label, { for: option.id });
    setAttr(this.option_label, { name: `option_${value}_label`, value: name });
    setAttr(this.checkbox, { name: `${attribute.key}_options`, id: option.id });

    this.label.textContent = name;
  }
}

export class AttributeSelector2 {
  constructor(attributes) {
    this.el = el(
      "div.flex.max-w-3xl.gap-4.items-start",
      (this.select = el("select.form-control !w-1/3 flex-shrink-0", { name: "attribute_keys" })),
      (this.attribute_options = list(el("ul.flex.gap-2.w-full.flex-wrap"), AttributeOption, "id"))
    );

    this.select_options = list(this.select, SelectOption, "id");
    this.select_options.update(attributes);

    this.select.prepend(el("option", { disabled: true, selected: true }));

    this.select.onchange = ({ target }) => {
      let found = attributes.find((a) => a.key === target.value);
      if (found) this.attribute_options.update(found.options, found);
    }
  }
  onmount() {
    console.log('on mount')
  }
}

export class Wizard {
  constructor(attributes) {
    this.attributes = attributes;
    this.add_btn = document.querySelector(".js-add-btn");
    this.attribute_form = document.querySelector(".js-attribute-form");

    this.add_btn.onclick = () => {
      mount(this.attribute_form, new AttributeSelector2(attributes), this.add_btn);
    }
  }

  static from(attributes) {
    return new Wizard(attributes)
  }
}

export function AttributeSelector(attributes, index = 0, on_update) {
  let attribute = signal();
  let component = div(
    { class: "flex max-w-3xl gap-4 items-start" },
    select(
      { class: "form-control !w-1/3 flex-shrink-0", name: `attribute_keys` },
      option({ disabled: true, selected: true }),
      SelectOptions(attributes, index),
      listeners({
        change: ({ target }) => {
          let found = attributes.find(a => a.key === target.value);
          if (found) attribute.set(found)
          if (on_update) on_update();
        }
      })
    ),
    AttributeOptions(attribute, index, on_update)
  )

  return component;
}

export async function TableHeaders({ headers, where } = {}) {
  let { t } = await import("/public/js/i18n.js");
  effect(() => {
    if (where) where.innerHTML = "";
    let row = tr({ class: "border-b border-b-gray-200 dark:border-b-zinc-800" },
      th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 min-w-[12rem]" }, "SKU")
    );
    for (let header of headers()) {
      let thead = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 whitespace-nowrap w-full" }, header);
      row.append(thead);
    }
    let quantity = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-10" }, t("form.pricing.quantity", { ns: "new-listing" }));
    let price = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 min-w-[20rem]" }, t("form.pricing.price", { ns: "new-listing" }));
    let actions = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 min-w-[2rem]" }, "Actions");
    row.append(quantity, price, actions);
    if (where) where.append(row);
  });
}

export function TableBody({ variations, where, remove_variation } = {}) {
  effect(() => {
    if (where) where.innerHTML = "";
    let vars = variations();
    for (let i = 0, len = vars.length; i < len; i++) {
      let variation = vars[i];
      let row = tr(
        td({ class: "font-medium pl-0 p-3 text-gray-900 dark:text-white" }, input({ type: "text", name: `variations[${i}].sku`, class: "form-control" })),
      )

      for (let item of variation) {
        row.append(
          td({ class: "font-medium p-3 text-gray-900 dark:text-white" },
            input({ type: "hidden", name: `variations[${i}].attributes.${item.key}`, value: item.value }),
            span(item.value_label),
          )
        )
      }

      let price_input = div(
        { class: "flex" },
        input({ class: "number", name: `variations[${i}].unit_price`, class: "form-control !rounded-r-none", inputmode: "numeric", min: "0", autocomplete: "off", required: true }),
        div(
          { class: "relative min-w-fit" },
          select(
            { name: `variations[${i}].currency`, class: "form-control !rounded-l-none mr-6" },
            option({ value: "USD" }, "USD"),
            option({ value: "UZS" }, "UZS"),
          ),
          svg(
            { class: "w-5 h-5 absolute top-1/2 -translate-y-1/2 right-[14px] text-gray-500 pointer-events-none", viewBox: "0 0 24 24", fill: "none" },
            html(chevron_down_path)
          )
        )
      )

      row.append(td({ class: "font-medium p-3 text-gray-900 dark:text-white" }, input({ type: "number", inputmode: "numeric", autocomplete: "off", name: `variations[${i}].quantity`, class: "form-control", value: 1 })))
      row.append(td({ class: "font-medium p-3 text-gray-900 dark:text-white" }, price_input));
      row.append(td(
        { class: "p-3 pr-0" },
        button({
          type: "button",
          class: `btn btn-text btn-enabled btn-0 flex-shrink-0 underline decoration-transparent duration-300
            hover:decoration-primary-500 group-peer-checked:hidden group-peer-focus-visible:shadow-[0px_0px_0px_2px_rgb(209,224,255)]
            dark:group-peer-focus-visible:shadow-[0px_0px_0px_2px_rgb(41,112,255)]` },
          listeners({ click: () => remove_variation(i) }),
          //listeners({ click: () => row.remove() }),
          "Delete"
        )
      ))

      if (where) where.append(row);
    }
  })
}

function AttributeOptions(attribute, index, on_update) {
  let list = div({ class: "flex gap-2 w-full flex-wrap" });
  effect(() => {
    list.innerHTML = "";
    let att = attribute();
    if (att) {
      let lab = input({ type: "hidden", name: `${att.key}_label`, value: att.name });
      list.append(lab)
    }
    for (let option of att?.options || []) {
      let id = option.unit ? `${att.key}-${option.value}-${option.unit}` : `${att.key}-${option.value}`;
      let name = option.unit ? `${option.name} ${option.unit}` : option.name;
      let value = option.unit ? `${option.value} ${option.unit}` : option.value;
      let container = div(
        input({ name: `option_${value}_label`, value: name, type: "hidden" }),
        input(
          { type: "checkbox", name: `${att.key}_options`, id: id + index, class: "absolute -z-10 opacity-0 w-0 peer", value },
          listeners({ change: on_update })
        ),
        label({
          for: id + index,
          class: `border border-gray-300 dark:border-zinc-700 p-2 rounded-md cursor-pointer text-gray-500
           dark:text-gray-400 peer-checked:bg-gray-100 peer-checked:dark:bg-zinc-800 peer-checked:dark:border-zinc-600
           peer-checked:text-gray-900 dark:peer-checked:text-white hover:bg-gray-50 hover:text-gray-900
           hover:dark:bg-zinc-800 hover:dark:text-white duration-200 inline-block`
        }, name)
      )
      list.append(container)
    }
  })

  return list;
}
