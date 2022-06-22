import { request, option } from "./utils.js";

const forms = document.querySelectorAll("form");

async function onSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  const [result, err] = await option(
    request(form.action, { method: form.method, body: data, replace_state: true })
  );
  if (err) {
    console.log(err);
  }
}

forms.forEach((form) => form.addEventListener("submit", onSubmit));
