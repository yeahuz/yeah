import { add_listeners, div, select, fragment, option, listeners, input, label, condition } from "dom";
import { signal, effect } from "state";

let add_btn = document.querySelector(".js-add-btn");

// <div class="flex max-w-3xl gap-4 items-center">
//   <select class="form-control !w-1/3">
//     <option disabled selected></option>
//     <% it.attributes.forEach(function (attribute) {%>
//       <option value="<%= attribute.value %>"><%= attribute.name %></option>
//     <% }) %>
//   </select>
//   <div class="flex gap-2 w-full">
//     <div>
//       <input type="checkbox" name="color" id="color-red" class="absolute -z-10 opacity-0 w-0 peer" />
//       <label for="color-red" class="border border-gray-300 dark:border-zinc-700 p-2.5 rounded-md cursor-pointer text-gray-500
//           dark:text-gray-400 peer-checked:bg-gray-100 peer-checked:dark:bg-zinc-800 peer-checked:dark:border-zinc-600
//           peer-checked:text-gray-900 dark:peer-checked:text-white hover:bg-gray-50 hover:text-gray-900
//           hover:dark:bg-zinc-800 hover:dark:text-white duration-200">Red</label>
//     </div>
//     <div>
//       <input type="checkbox" name="color" id="color-black" class="absolute -z-10 opacity-0 w-0 peer" />
//       <label for="color-black" class="border border-gray-300 dark:border-zinc-700 p-2.5 rounded-md cursor-pointer text-gray-500
//           dark:text-gray-400 peer-checked:bg-gray-100 peer-checked:dark:bg-zinc-800 peer-checked:dark:border-zinc-600
//           peer-checked:text-gray-900 dark:peer-checked:text-white hover:bg-gray-50 hover:text-gray-900
//           hover:dark:bg-zinc-800 hover:dark:text-white duration-200">Black</label>
//     </div>
//   </div>
// </div>


let selected = [["Red", "Green", "Blue"], ["16 GB"]];
let results = [];

function cartesian(...args) {
  var r = [], max = args.length - 1;
  function helper(arr, i) {
    for (var j = 0, l = args[i].length; j < l; j++) {
      var a = arr.slice(0); // clone arr
      a.push(args[i][j]);
      if (i == max)
        r.push(a);
      else
        helper(a, i + 1);
    }
  }
  helper([], 0);
  return r;
}
console.log(cartesian(["Red", "Green", "Blue"], ["16 GB"], ["Unlocked", "Factory Locked"]))

function AttributeOptions(attribute, index) {
  let list = div({ class: "flex gap-2 w-full flex-wrap" });
  effect(() => {
    list.innerHTML = "";
    let att = attribute();
    for (let option of att?.options || []) {
      let id = option.unit ? `${att.key}-${option.value}-${option.unit}` : `${att.key}-${option.value}`;
      let value = option.unit ? `${option.name} ${option.unit}` : option.name;
      let container = div(
        input({ type: "checkbox", name: att.key, id: id + index, class: "absolute -z-10 opacity-0 w-0 peer", value }),
        label({
          for: id + index,
          class: `border border-gray-300 dark:border-zinc-700 p-2 rounded-md cursor-pointer text-gray-500
           dark:text-gray-400 peer-checked:bg-gray-100 peer-checked:dark:bg-zinc-800 peer-checked:dark:border-zinc-600
           peer-checked:text-gray-900 dark:peer-checked:text-white hover:bg-gray-50 hover:text-gray-900
           hover:dark:bg-zinc-800 hover:dark:text-white duration-200 inline-block`
        }, value)
      )
      list.append(container)
    }
  })

  return list;
}

function SelectOptions(attributes) {
  let list = fragment();
  for (let attribute of attributes) list.append(option({ value: attribute.key }, attribute.name))
  return list;
}

function AttributeSelector(attributes, index = 0) {
  let attribute = signal();
  let component = div(
    { class: "flex max-w-3xl gap-4 items-start" },
    select(
      { class: "form-control !w-1/3 flex-shrink-0" },
      option({ disabled: true, selected: true }),
      SelectOptions(attributes),
      listeners({
        change: ({ target }) => {
          let found = attributes.find(a => a.key === target.value);
          if (found) attribute.set(found)
        }
      })
    ),
    AttributeOptions(attribute, index)
  )

  return component;
}

export class Wizard {
  constructor(attributes) {
    this.attributes = attributes;

    this.added_count = signal(0);
    this.selected_attributes = new Map();
    this.add_btn = document.querySelector(".js-add-btn");
    this.attributes_el = document.querySelector(".js-attributes");
    this.init();
  }

  init() {
    add_listeners(this.add_btn, {
      click: this.on_add.bind(this)
    });

    effect(() => {
      let count = this.added_count();
      if (count >= this.attributes.length) {
        this.add_btn.classList.add("!hidden")
      } else {
        this.add_btn.classList.remove("!hidden")
      }
    });
  }

  on_add() {
    this.added_count.update(c => c + 1);
    this.add_btn.insertAdjacentElement("beforebegin", AttributeSelector(this.attributes, this.added_count()));
  }

  static from(attributes) {
    return new Wizard(attributes);
  }
}
