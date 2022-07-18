export async function seed(knex) {
  await knex("auth_providers").del();
  await knex("languages").del();
  await knex("categories").del();
  await knex("category_translations").del();
  await knex("category_field_values").del();
  await knex("category_fields").del();
  await knex("category_field_value_translations").del();
  await knex("category_field_translations").del();

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

  await knex("categories").insert([
    {
      id: 1,
    },
    {
      id: 2,
      parent_id: 1,
    },
    {
      id: 3,
      parent_id: 1,
    }
  ]);

  await knex("category_fields").insert([
    {
      id: 1,
      type: "checkbox",
      name: "repair",
      category_id: 2,
    },
  ])

  await knex("category_field_values").insert([
    {
      id: 1,
      category_field_id: 1,
    },
    {
      id: 2,
      category_field_id: 1,
    },
    {
      id: 3,
      category_field_id: 1,
    },
  ])

  await knex("category_field_value_translations").insert([
    {
      category_field_value_id: 1,
      language_code: "ru",
      label: "Не требуется",
    },
    {
      category_field_value_id: 1,
      language_code: "en",
      label: "Not needed",
    },
    {
      category_field_value_id: 1,
      language_code: "uz",
      label: "Shart emas",
    },
    {
      category_field_value_id: 2,
      language_code: "ru",
      label: "Евроремонт",
    },
    {
      category_field_value_id: 2,
      language_code: "en",
      label: "Euro",
    },
    {
      category_field_value_id: 2,
      language_code: "uz",
      label: "Evro",
    },
    {
      category_field_value_id: 3,
      language_code: "ru",
      label: "Дизайнерская",
    },
    {
      category_field_value_id: 3,
      language_code: "en",
      label: "Designer",
    },
    {
      category_field_value_id: 3,
      language_code: "uz",
      label: "Dizayner",
    }
  ])

  await knex("category_field_translations").insert([
    {
      category_field_id: 1,
      language_code: "ru",
      label: "Ремонт",
    },
  ])

  await knex("category_translations").insert([
    {
      category_id: 1,
      title: "Недвижимость",
      language_code: "ru",
    },
    {
      category_id: 1,
      title: "Ko\'chmas mulk",
      language_code: "uz",
    },
    {
      category_id: 1,
      title: "Real estate",
      language_code: "en",
    },
    {
      category_id: 2,
      title: "Аренда квартиры",
      language_code: "ru"
    },
    {
      category_id: 2,
      title: "Kvartira arendasi",
      language_code: "uz",
    },
    {
      category_id: 2,
      title: "Rent apartment",
      language_code: "en",
    },
    {
      category_id: 3,
      title: "Продажа квартиры",
      language_code: "ru"
    },
    {
      category_id: 3,
      title: "Kvartira sotish",
      language_code: "uz",
    },
    {
      category_id: 3,
      title: "Sell apartment",
      language_code: "en",
    }
  ]);
}
