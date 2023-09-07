import {
  add_listeners,
  div,
  select,
  fragment,
  option,
  listeners,
  input,
  label,
  tr,
  th,
  td
} from "dom";
import { signal, effect } from "state";

let add_btn = document.querySelector(".js-add-btn");

function cartesian2(args) {
  var r = [], max = args.length - 1;
  function helper(arr, i) {
    for (let j = 0, len = args[i].options.length; j < len; j++) {
      let a = arr.slice();
      let obj = { name: args[i].name, value: args[i].options[j], label: args[i].label }
      a.push(obj);
      if (i == max) {
        r.push(a)
      } else {
        helper(a, i + 1)
      }
    }
  }
  helper([], 0);
  return r;
}

function TableHeaders(headers, where) {
  effect(() => {
    if (where) where.innerHTML = "";
    let row = tr({ class: "border-b border-b-gray-200 dark:border-b-zinc-800" },
      th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-1/2" }, "SKU")
    );
    for (let header of headers()) {
      let thead = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-1/2" }, header);
      row.append(thead);
    }
    let quantity = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-1/2" }, "Quantity");
    let price = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-1/2" }, "Price");
    row.append(quantity, price);
    if (where) where.append(row);
  });
}

function TableBody(combinations, where) {
  effect(() => {
    if (where) where.innerHTML = "";
    for (let combination of combinations()) {
      let row = tr(
        td({ class: "font-medium pl-0 p-3 text-gray-900 dark:text-white" }, input({ type: "text", name: "sku", class: "form-control" })),
      )

      for (let item of combination) {
        row.append(td({ class: "font-medium p-3 text-gray-900 dark:text-white" }, item.value))
      }

      row.append(td({ class: "font-medium p-3 text-gray-900 dark:text-white" }, input({ type: "text", name: "quantity", class: "form-control" })))
      row.append(td({ class: "font-medium p-3 pr-0 text-gray-900 dark:text-white" }, input({ type: "text", name: "price", class: "form-control" })))

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
    let count = 0;
    for (let option of att?.options || []) {
      let id = option.unit ? `${att.key}-${option.value}-${option.unit}` : `${att.key}-${option.value}`;
      let name = option.unit ? `${option.name} ${option.unit}` : option.name;
      let value = option.unit ? `${option.value} ${option.unit}` : option.value;
      let container = div(
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
      count++
    }
  })

  return list;
}

function SelectOptions(attributes) {
  let list = fragment();
  for (let attribute of attributes) list.append(option({ value: attribute.key }, attribute.name))
  return list;
}

function AttributeSelector(attributes, index = 0, on_update) {
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

export class Wizard {
  constructor(attributes) {
    this.attributes = attributes;

    this.added_count = signal(0);
    this.selected_attributes = new Map();
    this.add_btn = document.querySelector(".js-add-btn");
    this.attribute_form = document.querySelector(".js-attribute-form");
    this.combinations_form = document.querySelector(".js-combinations-form");
    this.thead = this.combinations_form.querySelector(".js-thead")
    this.tbody = this.combinations_form.querySelector(".js-tbody")
    this.stuff = signal([]);
    this.headers = signal([]);
    this.init();
  }

  init() {
    add_listeners(this.add_btn, {
      click: this.on_add.bind(this)
    });

    TableHeaders(this.headers, this.thead);
    TableBody(this.stuff, this.tbody);
    effect(() => {
      let count = this.added_count();
      if (count >= this.attributes.length) {
        this.add_btn.classList.add("!hidden")
      } else {
        this.add_btn.classList.remove("!hidden")
      }
    });

    effect(() => {
      let changed = this.headers();
      console.log("HEADERS CHANGED", changed);
    })
  }



  on_form_update() {
    let formdata = new FormData(this.attribute_form);
    let attribute_keys = formdata.getAll("attribute_keys");
    let headers = [];
    let stuff = [];
    for (let key of attribute_keys) {
      let options = formdata.getAll(`${key}_options`);
      let label = formdata.get(`${key}_label`);
      headers.push(label);
      stuff.push({ label, options, name: key });
    }
    this.headers.set(headers);
    if (stuff.length) this.stuff.set(cartesian2(stuff));
  }

  on_add() {
    this.add_btn.insertAdjacentElement("beforebegin", AttributeSelector(this.attributes, this.added_count(), this.on_form_update.bind(this)));
    this.added_count.update(c => c + 1);
  }

  static from(attributes) {
    return new Wizard(attributes);
  }
}
