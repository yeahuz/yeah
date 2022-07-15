export async function seed(knex) {
  await knex("auth_providers").del();
  await knex("languages").del();

  await knex("languages").insert([
    {
      code: "ru",
      name: "Русский"
    },
    {
      code: "en",
      name: "English"
    },
    {
      code: "uz",
      name: "O'zbek"
    }
  ]);
  await knex("auth_providers").insert([
    {
      name: "google",
    },
    {
      name: "telegram",
    },
  ]);
}
