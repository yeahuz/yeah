export async function seed(knex) {
  await knex("auth_providers").del();
  await knex("auth_providers").insert([
    {
      name: "google",
    },
    {
      name: "telegram",
    },
  ]);
}
