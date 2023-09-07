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
  td,
  attrs,
  svg,
  html
} from "dom";
import { signal, effect } from "state";
import { chevron_down_path } from "./icons.js";

function cartesian(args, formdata) {
  var r = [], max = args.length - 1;
  function helper(arr, i) {
    for (let j = 0, len = args[i].options.length; j < len; j++) {
      let a = arr.slice();
      let obj = { name: args[i].name, value: args[i].options[j], label: args[i].label, value_label: formdata.get(`option_${args[i].options[j]}_label`) }
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

async function TableHeaders({ headers, where } = {}) {
  let { t } = await import("./i18n.js");
  effect(() => {
    if (where) where.innerHTML = "";
    let row = tr({ class: "border-b border-b-gray-200 dark:border-b-zinc-800" },
      th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-20" }, "SKU")
    );
    for (let header of headers()) {
      let thead = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-20" }, header);
      row.append(thead);
    }
    let quantity = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-20" }, t("form.pricing.quantity", { ns: "new-listing" }));
    let price = th({ class: "font-medium p-3 bg-gray-100 dark:bg-zinc-800 w-20" }, t("form.pricing.price", { ns: "new-listing" }));
    row.append(quantity, price);
    if (where) where.append(row);
  });
}

function TableBody({ variations, where } = {}) {
  effect(() => {
    if (where) where.innerHTML = "";
    for (let variation of variations()) {
      let row = tr(
        td({ class: "font-medium pl-0 p-3 text-gray-900 dark:text-white" }, input({ type: "text", name: "sku", class: "form-control" })),
      )

      for (let item of variation) {
        row.append(td({ class: "font-medium p-3 text-gray-900 dark:text-white" }, item.value_label))
      }

      let price_input = div(
        { class: "flex" },
        input({ class: "number", name: "unit_price", class: "form-control !rounded-r-none", inputmode: "numeric", min: "0", autocomplete: "off", required: true }),
        div(
          { class: "relative min-w-fit" },
          select(
            { name: "currency", class: "form-control !rounded-l-none mr-6" },
            option({ value: "USD" }, "USD"),
            option({ value: "UZS" }, "UZS"),
          ),
          svg(
            { class: "w-5 h-5 absolute top-1/2 -translate-y-1/2 right-[14px] text-gray-500 pointer-events-none", viewBox: "0 0 24 24", fill: "none" },
            html(chevron_down_path)
          )
        )
      )
      row.append(td({ class: "font-medium p-3 pr-0 text-gray-900 dark:text-white" }, input({ type: "number", inputmode: "numeric", autocomplete: "off", name: "quantity", class: "form-control", value: 1 })))
      row.append(td({ class: "font-medium p-3 text-gray-900 dark:text-white" }, price_input));

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

function SelectOptions(attributes) {
  let list = fragment();
  for (let attribute of attributes) list.append(option({ value: attribute.key }, attrs({ disabled: attribute.disabled }), attribute.name))
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
    this.attributes = attributes.map((a) => ({ ...a, disabled: signal(false) }));
    this.added_count = signal(0);
    this.add_btn = document.querySelector(".js-add-btn");
    this.attribute_form = document.querySelector(".js-attribute-form");
    this.combinations_form = document.querySelector(".js-combinations-form");
    this.thead = this.combinations_form.querySelector(".js-thead")
    this.tbody = this.combinations_form.querySelector(".js-tbody")
    this.variations = signal([]);
    this.headers = signal([]);
    this.tpromise = import("./i18n.js").then((mod) => {
      this.t = mod.t;
    });
    this.init();
  }

  async init() {
    await this.tpromise;
    add_listeners(this.add_btn, {
      click: this.on_add.bind(this)
    });

    TableHeaders({ headers: this.headers, where: this.thead, t: this.t });
    TableBody({ variations: this.variations, where: this.tbody });

    effect(() => {
      let count = this.added_count();
      if (count >= this.attributes.length) {
        this.add_btn.classList.add("!hidden")
      } else {
        this.add_btn.classList.remove("!hidden")
      }
    });
  }



  on_form_update() {
    let formdata = new FormData(this.attribute_form);
    let attribute_keys = formdata.getAll("attribute_keys");
    let headers = [];
    let variations = [];
    for (let key of attribute_keys) {
      let options = formdata.getAll(`${key}_options`);
      let label = formdata.get(`${key}_label`);
      if (options.length) {
        headers.push(label);
        variations.push({ label, options, name: key });
      }
    }

    if (headers.length) this.headers.set(headers);
    if (variations.length) this.variations.set(cartesian(variations, formdata));
  }

  on_add() {
    this.add_btn.insertAdjacentElement("beforebegin", AttributeSelector(this.attributes, this.added_count(), this.on_form_update.bind(this)));
    this.added_count.update(c => c + 1);
  }

  static from(attributes) {
    return new Wizard(attributes);
  }
}
