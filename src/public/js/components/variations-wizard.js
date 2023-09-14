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
import { chevron_down_path } from "../icons.js";
import { el, list, mount, setAttr } from "redom";

function cartesian(args, formdata) {
  var r = [], max = args.length - 1;
  function helper(arr, i) {
    for (let j = 0, len = args[i].options?.length; j < len; j++) {
      let a = arr.slice();
      let obj = { key: args[i].key, value: args[i].options[j], label: args[i].label, value_label: formdata.get(`option_${args[i].options[j]}_label`) }
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

class SelectOption {
  constructor() {
    this.el = el("option");
  }

  update(attribute) {
    if (attribute.key) {
      this.el.value = attribute.key;
    }
    this.el.textContent = attribute.name;
    setAttr(this.el, { disabled: !!attribute.disabled, selected: !!attribute.selected });
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

  update(option, index, items, context) {
    let name = option.unit ? `${option.name} ${option.unit}` : option.name;
    let value = option.unit ? `${option.value} ${option.unit}` : option.value;
    setAttr(this.label, { for: option.id });
    setAttr(this.option_label, { name: `option_${value}_label`, value: name });
    setAttr(this.checkbox, { name: `${context.attribute.key}_options`, id: option.id, value });
    this.label.textContent = name;
    this.checkbox.onchange = context.on_change
  }
}

function AttributeOptionFactory(init, data, index, list) {
  if (index === 0) {
    return { el: el("input", { type: "hidden", name: `${data.key}_label`, value: data.name }) }
  }

  return new AttributeOption();
}

export class AttributeSelector {
  constructor(attributes, on_change) {
    this.el = el(
      "div.flex.max-w-3xl.gap-4.items-start",
      (this.select = el("select.form-control !w-1/3 flex-shrink-0", { name: "attribute_keys" })),
      (this.attribute_options = list("ul.flex.gap-2.w-full.flex-wrap", AttributeOptionFactory, "id"))
    );

    attributes.unshift({ disabled: true, selected: true });
    this.select_options = list(this.select, SelectOption, "id");
    this.select_options.update(attributes);

    this.select.onchange = ({ target }) => {
      let found = attributes.find((a) => a.key === target.value);
      found.options.unshift(found);
      if (found) this.attribute_options.update(found.options, { attribute: found, on_change });
    }
  }
}

export class StaticHeader {
  constructor(classname) {
    this.el = el(`th.font-medium.p-3.bg-gray-100.dark:bg-zinc-800.${classname}`)
  }

  update(data) {
    this.el.textContent = data.label;
  }
}

export class DynamicHeader {
  constructor() {
    this.el = el("th.font-medium.p-3.bg-gray-100.dark:bg-zinc-800.whitespace-nowrap.w-full")
  }

  update(data) {
    this.el.textContent = data.label;
  }
}

function HeaderFactory(init, data, index, list) {
  if (data.key === "sku") {
    return new StaticHeader("min-w-[12rem]");
  }
  if (data.key === "actions") {
    return new StaticHeader("min-w-[2rem]");
  }
  if (data.key === "price") {
    return new StaticHeader("min-w-[20rem]");
  }

  if (data.key === "quantity") {
    return new StaticHeader("w-10");
  }

  return new DynamicHeader();
}

class SkuTd {
  constructor() {
    this.el = el("td.font-medium.pl-0.p-3.text-gray-900.dark:text-white",
      (this.input = el("input.form-control", { type: "text" })))
  }

  update(_, index) {
    this.input.setAttribute("name", `variations[${index}].sku`);
  }
}

class PriceTd {
  constructor() {
    this.el = el("td.font-medium.p-3.text-gray-900.dark:text-white",
      el("div.flex",
        el("input.form-control.!rounded-r-none", { required: true, autocomplete: "off", inputmode: "numeric", min: "0", type: "number" }),
        el("div.relative.min-w-fit",
          el("select.form-control.!rounded-l-none.mr-6",
            el("option", "USD", { value: "USD" }),
            el("option", "UZS", { value: "UZS" })
          )
        )
      )
    )
  }
}

class Td {
  constructor() {
    this.el = el("td.font-medium.p-3.text-gray-900.dark:text-white",
      (this.input = el("input", { type: "hidden" })),
      (this.span = el("span"))
    )
  }

  update(data, index) {
    setAttr(this.input, { name: `variations[${index}].attributes.${data.key}`, value: data.value });
    this.span.textContent = data.value_label;
  }
}

function VariationFactory(init, data, index, list) {
  if (data.key === "sku") {
    return new SkuTd();
  }

  if (data.key === "price") {
    return new PriceTd();
  }

  return new Td();
}

class Tr {
  constructor() {
    this.el = el("tr");
    this.list = list(this.el, VariationFactory, "key");
  }

  update(data) {
    this.list.update(data);
  }
}

export class Wizard {
  constructor(attributes) {
    this.attributes = attributes;
    this.add_btn = document.querySelector(".js-add-btn");
    this.attribute_form = document.querySelector(".js-attribute-form");
    this.headers = list("tr.border-b border-b-gray-200 dark:border-b-zinc-800", HeaderFactory, "key");
    this.variations = list(document.querySelector(".js-tbody"), Tr);
    this.t;

    this.add_btn.onclick = () => {
      mount(this.attribute_form, new AttributeSelector(attributes, this.on_change.bind(this)), this.add_btn);
    }

    import("/public/js/i18n.js").then(({ t }) => {
      this.t = t;
    });

    mount(document.querySelector(".js-thead"), this.headers);
  }

  on_change() {
    if (!this.t) return;
    let formdata = new FormData(this.attribute_form);
    let attribute_keys = formdata.getAll("attribute_keys");
    let headers = Array(attribute_keys.length + 4).fill("");
    let variations = Array(attribute_keys.length + 4).fill("");
    headers[0] = { key: "sku", label: "SKU" }, variations[0] = { key: "sku", label: "SKU", options: [1] }
    headers[headers.length - 1] = { key: "actions", label: "Actions" }, variations[variations.length - 1] = { key: "actions", label: "Actions", options: [1] };
    headers[headers.length - 2] = { key: "price", label: this.t("form.pricing.price", { ns: "new-listing" }) }, variations[variations.length - 2] = { key: "price", label: this.t("form.pricing.price", { ns: "new-listing" }), options: [1] };
    headers[headers.length - 3] = { key: "quantity", label: this.t("form.pricing.quantity", { ns: "new-listing" }) }, variations[variations.length - 3] = { key: "quantity", label: this.t("form.pricing.quantity", { ns: "new-listing" }), options: [1] };

    for (let i = 0, len = attribute_keys.length; i < len; i++) {
      let key = attribute_keys[i];
      let options = formdata.getAll(`${key}_options`);
      if (options.length) {
        let label = formdata.get(`${key}_label`);
        headers[i + 1] = { label, key };
        variations[i + 1] = { label, options, key }
      }
    }

    this.headers.update(headers);
    this.variations.update(cartesian(variations, formdata));
  }

  static from(attributes) {
    return new Wizard(attributes)
  }
}
