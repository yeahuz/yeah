const TOKENS = {
  "#": { pattern: /\d/ },
  X: { pattern: /[0-9a-zA-Z]/ },
  S: { pattern: /[a-zA-Z]/ },
  A: { pattern: /[a-zA-Z]/, transform: (v) => v.toLocaleUpperCase() },
  a: { pattern: /[a-zA-Z]/, transform: (v) => v.toLocaleLowerCase() },
  "!": { escape: true },
};

export function maskit(value, mask, masked = true) {
  value = value || "";
  mask = mask || "";
  let i_mask = 0;
  let i_value = 0;
  let output = "";
  while (i_mask < mask.length && i_value < value.length) {
    let c_mask = mask[i_mask];
    let masker = TOKENS[c_mask];
    let c_value = value[i_value];
    if (masker && !masker.escape) {
      if (masker.pattern.test(c_value)) {
        output += masker.transform ? masker.transform(c_value) : c_value;
        i_mask++;
      }
      i_value++;
    } else {
      if (masker && masker.escape) {
        i_mask++; // take the next mask char and treat it as char
        c_mask = mask[i_mask];
      }
      if (masked) output += c_mask;
      if (c_value === c_mask) i_value++; // user typed the same char
      i_mask++;
    }
  }

  // fix mask that ends with a char: (#)
  var rest_output = "";
  while (i_mask < mask.length && masked) {
    let c_mask = mask[i_mask];
    if (TOKENS[c_mask]) {
      rest_output = "";
      break;
    }
    rest_output += c_mask;
    i_mask++;
  }

  return output + rest_output;
}
