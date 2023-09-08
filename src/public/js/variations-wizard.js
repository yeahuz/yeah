export { Wizard } from "./components/variations-wizard.js";
// import { add_listeners } from "dom";
// import { signal, effect } from "state";
// import { AttributeSelector, TableHeaders, TableBody } from "./components/variations-wizard.js";

// function cartesian(args, formdata) {
//   var r = [], max = args.length - 1;
//   function helper(arr, i) {
//     for (let j = 0, len = args[i].options.length; j < len; j++) {
//       let a = arr.slice();
//       let obj = { key: args[i].key, value: args[i].options[j], label: args[i].label, value_label: formdata.get(`option_${args[i].options[j]}_label`) }
//       a.push(obj);
//       if (i == max) {
//         r.push(a)
//       } else {
//         helper(a, i + 1)
//       }
//     }
//   }
//   helper([], 0);
//   return r;
// }

// export class Wizard {
//   constructor(attributes) {
//     this.attributes = attributes;
//     this.added_count = signal(0);
//     this.add_btn = document.querySelector(".js-add-btn");
//     this.attribute_form = document.querySelector(".js-attribute-form");
//     this.combinations_form = document.querySelector(".js-combinations-form");
//     this.thead = this.combinations_form.querySelector(".js-thead")
//     this.tbody = this.combinations_form.querySelector(".js-tbody")
//     this.variations = signal([]);
//     this.headers = signal([]);
//     this.init();
//   }

//   async init() {
//     add_listeners(this.add_btn, {
//       click: this.on_add.bind(this)
//     });

//     TableHeaders({ headers: this.headers, where: this.thead });
//     TableBody({ variations: this.variations, where: this.tbody, remove_variation: this.remove_variation.bind(this) });

//     effect(() => {
//       let count = this.added_count();
//       if (count >= this.attributes.length) {
//         this.add_btn.classList.add("!hidden")
//       } else {
//         this.add_btn.classList.remove("!hidden")
//       }
//     });
//   }

//   remove_variation(idx) {
//     this.variations.update((variations) => variations.filter((_, i) => idx !== i));
//   }

//   on_form_update() {
//     let formdata = new FormData(this.attribute_form);
//     let attribute_keys = formdata.getAll("attribute_keys");
//     let headers = [];
//     let variations = [];
//     for (let key of attribute_keys) {
//       let options = formdata.getAll(`${key}_options`);
//       let label = formdata.get(`${key}_label`);
//       if (options.length) {
//         headers.push(label);
//         variations.push({ label, options, key });
//       }
//     }

//     if (headers.length) this.headers.set(headers);
//     if (variations.length) this.variations.set(cartesian(variations, formdata));
//   }

//   on_add() {
//     this.add_btn.insertAdjacentElement("beforebegin", AttributeSelector(this.attributes, this.added_count(), this.on_form_update.bind(this)));
//     this.added_count.update(c => c + 1);
//   }

//   static from(attributes) {
//     return new Wizard(attributes);
//   }
// }
