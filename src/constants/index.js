import { query } from "../services/db.service.js";

export let ROLES = {};
export let CATEGORY_REFERENCE = {};

async function load_roles() {
  let { rows: roles } = await query(`select * from roles`);
  for (let role of roles) {
    ROLES[role.code] = role.id;
  }
}

async function load_category_references() {
  let { rows: references } = await query(`select * from category_reference`);
  for (let reference of references) {
    CATEGORY_REFERENCE[reference.category_id] = reference;
  }
}

export async function load_constants() {
  await Promise.all([load_roles(), load_category_references()]);
}
