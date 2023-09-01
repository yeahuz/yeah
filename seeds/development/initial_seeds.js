import fs from "fs";

export async function seed(knex) {
  await knex("auth_providers").del();
  await knex("languages").del();
  await knex("attributes").del();
  await knex("attribute_translations").del();
  await knex("categories").del();
  await knex("category_translations").del();
  await knex("countries").del();
  await knex("country_translations").del();
  await knex("regions").del();
  await knex("region_translations").del();
  await knex("districts").del();
  await knex("payment_providers").del();
  await knex("payment_statuses").del();
  await knex("payment_status_translations").del();
  await knex("district_translations").del();
  await knex("listing_statuses").del();
  await knex("listing_status_translations").del();
  await knex("exchange_rates").del();
  await knex("currencies").del();
  await knex("notifications").del();
  await knex("notification_types").del();
  await knex("notification_type_translations").del();
  await knex("roles").del();
  await knex("promotion_types").del();
  await knex("promotion_statuses").del();

  async function insert_promotion_stuff() {
    let { types, statuses } = JSON.parse(fs.readFileSync(process.cwd() + "/src/data/promotions.json", "utf-8"));
    for (let type of types) {
      await knex("promotion_types").insert({
        id: type.id
      });
      for (let lang in type.translations) {
        let { name, description } = type.translations[lang];
        await knex("promotion_type_translations").insert({
          name, description, language_id: lang, type_id: type.id
        })
      }
    }

    for (let status of statuses) {
      await knex("promotion_statuses").insert({
        id: status.id
      });
      for (let lang in status.translations) {
        let { name } = status.translations[lang];
        await knex("promotion_status_translations").insert({
          name, language_id: lang, status_id: status.id
        })
      }
    }
  }

  async function insert_regions() {
    let { cities: regions } = JSON.parse(
      fs.readFileSync(process.cwd() + "/src/data/soato.json", "utf-8")
    );

    for (let i = 0; i < regions.length; i++) {
      let region = regions[i];
      let [ru_first, ru_second] = region.ru_name.split(" ");
      let [uz_first] = region.name.split(" ");
      let [en_first, en_second] = region.en_name.split(" ");

      let [inserted_region] = await knex("regions")
        .returning("id")
        .insert({
          country_id: "uz",
          soato: region.soato,
          code: region.code,
          ...(region.lat && { coords: knex.raw(`point(${region.lat}, ${region.lon})`) }),
        });

      await knex("region_translations").insert([
        {
          language_id: "uz",
          short_name: uz_first,
          long_name: region.name,
          region_id: inserted_region.id,
        },
        {
          language_id: "ru",
          short_name: ru_second ? ru_first.substring(0, ru_first.length - 4) : ru_first,
          long_name: region.ru_name,
          region_id: inserted_region.id,
        },
        {
          language_id: "en",
          short_name: en_second ? en_first.substring(0, ru_first.length - 4) : en_first,
          long_name: region.en_name,
          region_id: inserted_region.id,
        },
      ]);

      for (let j = 0; j < region.districts.length; j++) {
        let district = region.districts[j];
        let [ru_first] = district.ru_name.split(" ");
        let [uz_first] = district.name.split(" ");
        let [en_first] = district.en_name.split(" ");

        let [inserted] = await knex("districts")
          .returning("id")
          .insert({
            region_id: inserted_region.id,
            soato: district.soato,
            code: district.code,
            ...(district.lat && { coords: knex.raw(`point(${district.lat}, ${district.lon})`) }),
          });

        await knex("district_translations").insert([
          {
            language_id: "uz",
            short_name: uz_first,
            long_name: district.name,
            district_id: inserted.id,
          },
          {
            language_id: "ru",
            short_name: ru_first,
            long_name: district.ru_name,
            district_id: inserted.id,
          },
          {
            language_id: "en",
            short_name: en_first,
            long_name: district.en_name,
            district_id: inserted.id,
          },
        ]);
      }
    }
  }

  await knex("currencies").insert([
    {
      id: "USD",
    },
    {
      id: "UZS",
    },
  ]);

  await knex("exchange_rates").insert([
    {
      from_currency: "USD",
      to_currency: "UZS",
      rate: 10995.1,
    },
    {
      from_currency: "UZS",
      to_currency: "USD",
      rate: 0.000090949604824,
    },
    {
      from_currency: "USD",
      to_currency: "USD",
      rate: 1.0,
    },
    {
      from_currency: "UZS",
      to_currency: "UZS",
      rate: 1.0,
    },
  ]);

  await knex("languages").insert([
    {
      id: "ru",
      name: "Русский",
    },
    {
      id: "en",
      name: "English",
    },
    {
      id: "uz",
      name: "O'zbek",
    },
  ]);

  await knex("listing_statuses").insert([
    {
      active: true,
      id: "ACTIVE",
      bg_hex: "#ECFDF3",
      fg_hex: "#027A48"
    },
    {
      active: true,
      id: "ARCHIVED",
      bg_hex: "#F2F4F7",
      fg_hex: "#344054"
    },
    {
      active: true,
      id: "IN_MODERATION",
      bg_hex: "#FFFAEB",
      fg_hex: "#B54708"
    },
    {
      active: true,
      id: "DRAFT",
      bg_hex: "#FFFAEB",
      fg_hex: "#B54708"
    },
    {
      active: true,
      id: "INDEXING",
      bg_hex: "#eff4ff",
      fg_hex: "#0066e9"
    },
  ]);

  await knex("listing_status_translations").insert([
    {
      status_id: 'ACTIVE',
      language_id: "ru",
      name: "Активный",
    },
    {
      status_id: 'ACTIVE',
      language_id: "en",
      name: "Active",
    },
    {
      status_id: 'ACTIVE',
      language_id: "uz",
      name: "Faol",
    },
    {
      status_id: "ARCHIVED",
      language_id: "ru",
      name: "Архивирован",
    },
    {
      status_id: "ARCHIVED",
      language_id: "en",
      name: "Archived",
    },
    {
      status_id: "ARCHIVED",
      language_id: "uz",
      name: "Arxivlangan",
    },
    {
      status_id: "IN_MODERATION",
      language_id: "ru",
      name: "В модерации",
    },
    {
      status_id: "IN_MODERATION",
      language_id: "en",
      name: "In moderation",
    },
    {
      status_id: "IN_MODERATION",
      language_id: "uz",
      name: "Tekshiruvda",
    },
    {
      status_id: "INDEXING",
      language_id: "ru",
      name: "Индексирование",
    },
    {
      status_id: "INDEXING",
      language_id: "uz",
      name: "Indekslanmoqda",
    },
    {
      status_id: "INDEXING",
      language_id: "en",
      name: "Indexing",
    },
    {
      status_id: 'DRAFT',
      language_id: "en",
      name: "Draft",
    },
    {
      status_id: 'DRAFT',
      language_id: "ru",
      name: "Черновик",
    },
    {
      status_id: 'DRAFT',
      language_id: "uz",
      name: "Qoralama",
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

  // Planning to use this for creating separate tables for each category with its columns.
  // Listings will be but in one these tables based on selected category.
  // This is also can be saved in databsae for retrieving information about which table name to query and fields to retrieve based on these definitions;
  let categories = [
    {
      key: "electronics",
      translation: ["Electronics", "Электроника", "Eletronika"],
      columns: [
        {
          name: "brand",
          translation: ["Brand", "Бренд", "Brend"],
          type: "varchar",
          options: ["Apple", "Samsung", "Nvidia", "Cisco", "AMD", "LG", "SONY", "Dell", "Xiaomi", "Microsoft", "Alienware"]
        }
      ],
      children: [
        {
          key: "phones",
          translation: ["Phones", "Телефоны", "Telefonlar"],
          columns: [
            {
              name: "brand",
              translation: ["Brand", "Бренд", "Brend"],
              type: "varchar",
              options: ["Apple", "Samsung", "Google", "Nothing", "OnePlus", "Asus", "Acer", "LG", "SONY", "Huawei", "Nokia", "Lenovo", "Xiaomi"]
            },
            {
              name: "model",
              type: "varchar",
              translation: ["Model", "Модель", "Model"],
            },
            {
              name: "storage_capacity",
              type: "integer",
              translation: ["Storage capacity", "Хранилище", "Saqlash hajmi"],
            },
            {
              name: "color",
              type: "varchar",
              translation: ["Color", "Цвет", "Rang"],
            },
            {
              name: "ram",
              type: "integer",
              nullable: true,
              translation: ["RAM", "Оперативная память", "Xotira"],
            }
          ]
        }
      ]
    }
  ]

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
    },
  ]);

  await knex.raw("select setval('categories_id_seq', max(id)) from categories");

  await knex("category_translations").insert([
    {
      category_id: 1,
      title: "Недвижимость",
      language_id: "ru",
    },
    {
      category_id: 1,
      title: "Ko'chmas mulk",
      language_id: "uz",
    },
    {
      category_id: 1,
      title: "Real estate",
      language_id: "en",
    },
    {
      category_id: 2,
      title: "Аренда квартиры",
      language_id: "ru",
    },
    {
      category_id: 2,
      title: "Kvartira arendasi",
      language_id: "uz",
    },
    {
      category_id: 2,
      title: "Rent apartment",
      language_id: "en",
    },
    {
      category_id: 3,
      title: "Продажа квартиры",
      language_id: "ru",
    },
    {
      category_id: 3,
      title: "Kvartira sotish",
      language_id: "uz",
    },
    {
      category_id: 3,
      title: "Sell apartment",
      language_id: "en",
    },
  ]);

  await knex("attributes").insert([
    {
      id: 1,
      type: "checkbox",
      key: "apartment-has",
      category_set: [1, 2, 3],
    },
    {
      id: 2,
      type: "radio",
      key: "apartment-repair",
      category_set: [1, 2, 3],
    },
    {
      id: 3,
      parent_id: 1,
      key: "internet",
      category_set: [1, 2, 3],
    },
    {
      id: 4,
      parent_id: 1,
      key: "refrigirator",
      category_set: [1, 2, 3],
    },
    {
      id: 5,
      parent_id: 1,
      key: "washing-machine",
      category_set: [1, 2, 3],
    },
    {
      id: 6,
      parent_id: 2,
      key: "not-needed",
      category_set: [1, 2, 3],
    },
    {
      id: 7,
      parent_id: 2,
      key: "euro",
      category_set: [1, 2, 3],
    },
    {
      id: 8,
      parent_id: 2,
      key: "designer",
      category_set: [1, 2, 3],
    },
  ]);

  await knex("attribute_translations").insert([
    {
      attribute_id: 1,
      language_id: "ru",
      name: "В квартире есть",
    },
    {
      attribute_id: 1,
      language_id: "en",
      name: "Apartment has",
    },
    {
      attribute_id: 1,
      language_id: "uz",
      name: "Kvartirada bor",
    },
    {
      attribute_id: 3,
      language_id: "ru",
      name: "Интернет",
    },
    {
      attribute_id: 3,
      language_id: "en",
      name: "Internet",
    },
    {
      attribute_id: 3,
      language_id: "uz",
      name: "Internet",
    },
    {
      attribute_id: 4,
      language_id: "ru",
      name: "Холодильник",
    },
    {
      attribute_id: 4,
      language_id: "en",
      name: "Refrigirator",
    },
    {
      attribute_id: 4,
      language_id: "uz",
      name: "Muzlatgich",
    },
    {
      attribute_id: 5,
      language_id: "ru",
      name: "Стиральная машина",
    },
    {
      attribute_id: 5,
      language_id: "en",
      name: "Washing machine",
    },
    {
      attribute_id: 5,
      language_id: "uz",
      name: "Kir uvish mashinasi",
    },
    {
      attribute_id: 2,
      language_id: "ru",
      name: "Ремонт",
    },
    {
      attribute_id: 2,
      language_id: "en",
      name: "Repair",
    },
    {
      attribute_id: 2,
      language_id: "uz",
      name: "Ta'mir",
    },
    {
      attribute_id: 6,
      language_id: "ru",
      name: "Не требуется",
    },
    {
      attribute_id: 6,
      language_id: "en",
      name: "Not needed",
    },
    {
      attribute_id: 6,
      language_id: "uz",
      name: "Kerak emas",
    },
    {
      attribute_id: 7,
      language_id: "ru",
      name: "Евроремонт",
    },
    {
      attribute_id: 7,
      language_id: "en",
      name: "Renovation",
    },
    {
      attribute_id: 7,
      language_id: "uz",
      name: "Yevroremont",
    },
    {
      attribute_id: 8,
      language_id: "ru",
      name: "Дизайнерская",
    },
    {
      attribute_id: 8,
      language_id: "en",
      name: "Designer",
    },
    {
      attribute_id: 8,
      language_id: "uz",
      name: "Dizayner",
    },
  ]);

  await knex("countries").insert({
    id: "uz",
  });

  await knex("country_translations").insert([
    {
      language_id: "ru",
      name: "Узбекистан",
      country_id: "uz",
    },
    {
      language_id: "en",
      name: "Uzbekistan",
      country_id: "uz",
    },
    {
      language_id: "uz",
      name: "O'zbekiston",
      country_id: "uz",
    },
  ]);

  await knex("notification_types").insert([
    {
      name: "WEBSITE_UPDATE",
      description: "Used when sending notification about website updates/features",
    },
  ]);

  await knex("notification_type_translations").insert([
    {
      notification_type_name: "WEBSITE_UPDATE",
      language_id: "en",
      title: "Woah, new update!",
      content:
        "Hey %s. We have new updates for you. Learn more <a href='https://needs.uz/updates'>here</a>",
    },
    {
      notification_type_name: "WEBSITE_UPDATE",
      language_id: "uz",
      title: "Voy, yangi yangilanish!",
      content:
        "Salom %s. Bizda siz uchun yangi yangiliklar. Batafsil <a href='https://needs.uz/updates'>bu yerda</a>",
    },
    {
      notification_type_name: "WEBSITE_UPDATE",
      language_id: "ru",
      title: "Ура, новое обновление!",
      content:
        "Привет, %s. У нас есть новые обновления для вас. Узнайте больше <a href='https://needs.uz/updates'>здесь</a>",
    },
  ]);

  await knex("payment_providers").insert([
    {
      name: "payme",
      title: "Payme",
      light_logo_url: "/public/images/payme-logo-light.png",
      dark_logo_url: "/public/images/payme-logo-dark.png",
    },
    {
      name: "click",
      title: "Click Evolution",
      light_logo_url: "/public/images/click-logo-light.png",
      dark_logo_url: "/public/images/click-logo-dark.png",
    },
    {
      name: "octo",
      title: "Octo",
      light_logo_url: "/public/images/octo-logo-light.png",
      dark_logo_url: "/public/images/octo-logo-dark.png",
    },
  ]);

  await knex("payment_statuses").insert([
    {
      id: "PENDING",
    },
    {
      id: "FAILED",
    },
    {
      id: "SUCCESS",
    },
  ]);

  await knex("payment_status_translations").insert([
    {
      status_id: "PENDING",
      language_id: "ru",
      name: "В обработке",
    },
    {
      status_id: "PENDING",
      language_id: "en",
      name: "Pending",
    },
    {
      status_id: "PENDING",
      language_id: "uz",
      name: "Kutilmoqda",
    },
    {
      status_id: "FAILED",
      language_id: "ru",
      name: "Ошибка",
    },
    {
      status_id: "FAILED",
      language_id: "en",
      name: "Failed",
    },
    {
      status_id: "FAILED",
      language_id: "uz",
      name: "Muvaffaqiyatsiz",
    },
    {
      status_id: "SUCCESS",
      language_id: "ru",
      name: "Успешно",
    },
    {
      status_id: "SUCCESS",
      language_id: "en",
      name: "Success",
    },
    {
      status_id: "SUCCESS",
      language_id: "uz",
      name: "Muvaffaqiyatli",
    },
  ]);

  let roles = [
    {
      code: "admin",
      permissions: [
        { action: "manage", subject: "all" }
      ],
      translations: [
        {
          language_id: "en",
          title: "Administrator"
        },
        {
          language_id: "ru",
          title: "Администратор"
        },
        {
          language_id: "uz",
          title: "Administrator"
        }
      ]
    },
    {
      code: "user",
      permissions: [
        {
          action: "update",
          subject: "Listing",
          fields: ["title", "description", "attributes", "cover_id", "category_id", "quantity"],
          conditions: { created_by: "return (user) => user.id" }
        },
        {
          action: "delete",
          subject: "Chat",
          conditions: { created_by: "return (user) => user.id" }
        },
        {
          action: "manage",
          subject: "Session",
          fields: ["active"],
          conditions: { user_id: "return (user) => user.id" }
        },
        {
          action: "manage",
          subject: "Credential",
          conditions: { user_id: "return (user) => user.id" }
        },
        {
          action: "create",
          subject: "Message",
          fields: ["content", "reply_to", "attachments", "type"],
          conditions: { sender_id: "return (user) => user.id" }
        },
        {
          action: "update",
          subject: "Message",
          fields: ["content", "reply_to"],
          conditions: { sender_id: "return (user) => user.id" }
        },
        {
          action: "manage",
          subject: "User",
          fields: ["phone", "email", "name", "username", "bio", "website_url", "profile_photo_url", "email", "password"],
          conditions: { id: "return (user) => user.id" }
        }
      ],
      translations: [
        {
          language_id: "en",
          title: "User"
        },
        {
          language_id: "ru",
          title: "Пользователь"
        },
        {
          language_id: "uz",
          title: "Foydalanuvchi"
        }
      ]
    },
    {
      code: "moderator",
      translations: [
        {
          language_id: "en",
          title: "Moderator"
        },
        {
          language_id: "ru",
          title: "Модератор"
        },
        {
          language_id: "uz",
          title: "Moderator"
        }
      ]
    }
  ];

  for (let role of roles) {
    let result = await knex("roles").insert({
      code: role.code
    }).returning("id");
    let role_id = result[0].id;
    await knex("role_translations").insert(role.translations.map(t => Object.assign(t, { role_id })));
    if (role.permissions) {
      let permissions = await knex("permissions").insert(role.permissions).returning("id");
      await knex("role_permissions").insert(permissions.map(p => ({ role_id, permission_id: p.id })));
    }
  };

  await Promise.all([
    insert_regions(),
    insert_promotion_stuff()
  ]);
}
