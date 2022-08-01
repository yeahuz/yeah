export async function seed(knex) {
  await knex("auth_providers").del();
  await knex("languages").del();
  await knex("categories").del();
  await knex("category_translations").del();
  await knex("category_field_values").del();
  await knex("category_fields").del();
  await knex("category_field_value_translations").del();
  await knex("category_field_translations").del();
  await knex("countries").del();
  await knex("country_translations").del();
  await knex("regions").del();
  await knex("region_translations").del();
  await knex("districts").del();
  await knex("district_translations").del();

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
      type: "radio",
      name: "repair",
      category_id: 2,
    },
    {
      id: 2,
      type: "checkbox",
      name: "exists",
      category_id: 2
    }
  ]);

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
    {
      id: 4,
      category_field_id: 2,
    },
    {
      id: 5,
      category_field_id: 2,
    },
    {
      id: 6,
      category_field_id: 2,
    },
    {
      id: 7,
      category_field_id: 2,
    },
    {
      id: 8,
      category_field_id: 2,
    },
  ]);

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
    },
    {
      category_field_value_id: 4,
      language_code: "ru",
      label: "Интернет",
    },
    {
      category_field_value_id: 4,
      language_code: "en",
      label: "Internet",
    },
    {
      category_field_value_id: 4,
      language_code: "uz",
      label: "Internet",
    },
    {
      category_field_value_id: 5,
      language_code: "ru",
      label: "Телефон",
    },
    {
      category_field_value_id: 5,
      language_code: "en",
      label: "Phone",
    },
    {
      category_field_value_id: 5,
      language_code: "uz",
      label: "Telefon",
    },
    {
      category_field_value_id: 6,
      language_code: "ru",
      label: "Холодильник",
    },
    {
      category_field_value_id: 6,
      language_code: "en",
      label: "Refrigirator",
    },
    {
      category_field_value_id: 6,
      language_code: "uz",
      label: "Muzlatgich",
    },
    {
      category_field_value_id: 7,
      language_code: "ru",
      label: "Телевизор",
    },
    {
      category_field_value_id: 7,
      language_code: "en",
      label: "TV",
    },
    {
      category_field_value_id: 7,
      language_code: "uz",
      label: "Televizor",
    },
    {
      category_field_value_id: 8,
      language_code: "ru",
      label: "Стиральная машина",
    },
    {
      category_field_value_id: 8,
      language_code: "en",
      label: "Washing machine",
    },
    {
      category_field_value_id: 8,
      language_code: "uz",
      label: "Kir uvish mashinasi",
    }
  ]);

  await knex("category_field_translations").insert([
    {
      category_field_id: 1,
      language_code: "ru",
      label: "Ремонт",
    },
    {
      category_field_id: 1,
      language_code: "en",
      label: "Repair",
    },
    {
      category_field_id: 1,
      language_code: "uz",
      label: "Ta'mir",
    },
    {
      category_field_id: 2,
      language_code: "ru",
      label: "В квартире есть",
    },
    {
      category_field_id: 2,
      language_code: "en",
      label: "Apartment has",
    },
    {
      category_field_id: 2,
      language_code: "uz",
      label: "Kvartirada bor",
    }
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

  await knex("countries").insert({
    code: "uz"
  });

  await knex("country_translations").insert([
    {
      language_code: "ru",
      name: "Узбекистан",
      country_code: "uz"
    },
    {
      language_code: "en",
      name: "Uzbekistan",
      country_code: "uz"
    },
    {
      language_code: "uz",
      name: "O'zbekiston",
      country_code: "uz"
    },
  ]);

  await knex("regions").insert({
    id: 1,
    country_code: "uz",
    coords: knex.raw("point(41.292, 69.3048)")
  });

  await knex("region_translations").insert([
    {
      language_code: "ru",
      short_name: "Ташкент",
      long_name: "Ташкент",
      region_id: 1,
    },
    {
      language_code: "en",
      short_name: "Tashkent",
      long_name: "Tashkent",
      region_id: 1,
    },
    {
      language_code: "uz",
      short_name: "Toshkent",
      long_name: "Toshkent",
      region_id: 1,
    }
  ]);

  await knex("districts").insert([
    {
      id: 1,
      region_id: 1,
      coords: knex.raw("point(41.292, 69.3048)")
    },
    {
      id: 2,
      region_id: 1,
      coords: knex.raw("point(41.3335, 69.2997)")
    },
    {
      id: 3,
      region_id: 1,
      coords: knex.raw("point(41.2739, 69.247)")
    },
    {
      id: 4,
      region_id: 1,
      coords: knex.raw("point(41.295, 69.181)")
    },
    {
      id: 5,
      region_id: 1,
      coords: knex.raw("point(41.362, 69.228)")
    },
    {
      id: 6,
      region_id: 1,
      coords: knex.raw("point(41.308, 69.24)")
    },
    {
      id: 7,
      region_id: 1,
      coords: knex.raw("point(41.2082, 69.2318)")
    },
    {
      id: 8,
      region_id: 1,
      coords: knex.raw("point(41.331, 69.333)")
    },
    {
      id: 9,
      region_id: 1,
      coords: knex.raw("point(41.2739, 69.2936)")
    },
    {
      id: 10,
      region_id: 1,
      coords: knex.raw("point(41.2842, 69.3236)")
    },
    {
      id: 11,
      region_id: 1,
      coords: knex.raw("point(41.2639, 69.2194)")
    },
    {
      id: 12,
      region_id: 1,
      coords: knex.raw("point(41.2357, 69.3455)")
    }
  ]);

  await knex("district_translations").insert([
    {
      language_code: "ru",
      short_name: "Ташкент",
      long_name: "Ташкент",
      district_id: 1,
    },
    {
      language_code: "en",
      short_name: "Tashkent",
      long_name: "Tashkent",
      district_id: 1,
    },
    {
      language_code: "uz",
      short_name: "Toshkent",
      long_name: "Toshkent",
      district_id: 1,
    },
    {
      language_code: "ru",
      short_name: "Юнусабадский",
      long_name: "Юнусабадский район",
      district_id: 2,
    },
    {
      language_code: "en",
      short_name: "Yunusabod",
      long_name: "Yunusabod district",
      district_id: 2,
    },
    {
      language_code: "uz",
      short_name: "Yunusobod",
      long_name: "Yunusobod tumani",
      district_id: 2,
    },
    {
      language_code: "ru",
      short_name: "Яккасарайский",
      long_name: "Яккасарайский район",
      district_id: 3,
    },
    {
      language_code: "en",
      short_name: "Yakkasaroy",
      long_name: "Yakkasaroy district",
      district_id: 3,
    },
    {
      language_code: "uz",
      short_name: "Yakkasaroy",
      long_name: "Yakkasaroy tumani",
      district_id: 3,
    },
    {
      language_code: "ru",
      short_name: "Учтепинский",
      long_name: "Учтепинский район",
      district_id: 4,
    },
    {
      language_code: "en",
      short_name: "Uchtepa",
      long_name: "Uchtepa district",
      district_id: 4,
    },
    {
      language_code: "uz",
      short_name: "Uchtepa",
      long_name: "Uchtepa tumani",
      district_id: 4,
    },
    {
      language_code: "ru",
      short_name: "Алмазарский",
      long_name: "Алмазарский район",
      district_id: 5,
    },
    {
      language_code: "en",
      short_name: "Olmazor",
      long_name: "Olmazor district",
      district_id: 5,
    },
    {
      language_code: "uz",
      short_name: "Olmazor",
      long_name: "Olmazor tumani",
      district_id: 5,
    },
    {
      language_code: "ru",
      short_name: "Шайхантахурский",
      long_name: "Шайхантахурский район",
      district_id: 6,
    },
    {
      language_code: "en",
      short_name: "Sheikhontokhur",
      long_name: "Sheikhontokhur district",
      district_id: 6,
    },
    {
      language_code: "uz",
      short_name: "Shayxontohur",
      long_name: "Shayxontohur tumani",
      district_id: 6,
    },
    {
      language_code: "ru",
      short_name: "Сергелийский",
      long_name: "Сергелийский район",
      district_id: 7,
    },
    {
      language_code: "en",
      short_name: "Sergeli",
      long_name: "Sergeli district",
      district_id: 7,
    },
    {
      language_code: "uz",
      short_name: "Sirg'ali",
      long_name: "Sirg'ali tumani",
      district_id: 7,
    },
    {
      language_code: "ru",
      short_name: "Мирзо-Улугбекский",
      long_name: "Мирзо-Улугбекский район",
      district_id: 8,
    },
    {
      language_code: "en",
      short_name: "Mirzo-Ulugbek",
      long_name: "Mirzo-Ulugbek district",
      district_id: 8,
    },
    {
      language_code: "uz",
      short_name: "Mirzo-Ulug'bek",
      long_name: "Mirzo-Ulug'bek tumani",
      district_id: 8,
    },
    {
      language_code: "ru",
      short_name: "Мирабадский",
      long_name: "Мирабадский район",
      district_id: 9,
    },
    {
      language_code: "en",
      short_name: "Mirobod",
      long_name: "Mirobod district",
      district_id: 9,
    },
    {
      language_code: "uz",
      short_name: "Mirobod",
      long_name: "Mirobod tumani",
      district_id: 9,
    },
    {
      language_code: "ru",
      short_name: "Яшнабадский",
      long_name: "Яшнабадский район",
      district_id: 10,
    },
    {
      language_code: "en",
      short_name: "Yashnobod",
      long_name: "Yashnobod district",
      district_id: 10,
    },
    {
      language_code: "uz",
      short_name: "Yashnobod",
      long_name: "Yashnobod tumani",
      district_id: 10,
    },
    {
      language_code: "ru",
      short_name: "Чиланзарский",
      long_name: "Чиланзарский район",
      district_id: 11,
    },
    {
      language_code: "en",
      short_name: "Chilonzor",
      long_name: "Chilonzor district",
      district_id: 11,
    },
    {
      language_code: "uz",
      short_name: "Chilonzor",
      long_name: "Chilonzor tumani",
      district_id: 11,
    },
    {
      language_code: "ru",
      short_name: "Бектемирский",
      long_name: "Бектемирский район",
      district_id: 12,
    },
    {
      language_code: "en",
      short_name: "Bektemir",
      long_name: "Bektemir district",
      district_id: 12,
    },
    {
      language_code: "uz",
      short_name: "Bektemir",
      long_name: "Bektemir tumani",
      district_id: 12,
    }
  ])
}
