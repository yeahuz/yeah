import { message_sw, option, request } from './utils.js'
import { toast } from './toast.js'
import { add_listeners, disable_form, remove_node } from './dom.js'
import { add_credential, format_credential_request } from './webauthn.js'

const credential_request_form = document.querySelector(".js-credential-request-form");
const credential_delete_forms = document.querySelectorAll(".js-credential-delete-form");
const credentials_delele_form = document.querySelector(".js-credentials-delete-form");
const credentials_table = document.querySelector(".js-credentials-table");

async function on_credentials_delete(e) {
  e.preventDefault();
  const form = e.target;
  const { cache_url } = form.dataset;

  const enable_form = disable_form(form);
  const restore_table = remove_node(credentials_table);
  const [result, err] = await option(request(form.action, { method: "DELETE" }));

  if (err) {
    toast(err.message, "err");
    restore_table();
    return;
  }

  enable_form(err);

  if (cache_url) {
    await message_sw({ type: "delete_content", payload: { cache_name: "swr_content", url: cache_url } });
  }

  form.remove();
}

async function on_credential_delete(e) {
  e.preventDefault();
  const form = e.target;
  const { cache_url } = form.dataset;

  const enable_form = disable_form(form);
  const restore_node = remove_node(form.closest("tr"));
  const [result, err] = await option(request(form.action, { method: "DELETE" }));

  if (err) {
    toast(err.message, "err");
    restore_node();
    return;
  }

  enable_form(err);

  if (cache_url  ) {
    await message_sw({ type: "delete_content", payload: { cache_name: "swr_content", url: cache_url   } })
  }
}

async function on_credential_add(e) {
  e.preventDefault();
  const form = e.target;
  const { cache_url } = form.dataset;
  console.log(cache_url)
  const resource = new URL(form.action);
  const data = new FormData(form);

  resource.search = new URLSearchParams(data)

  const [credential_request, credential_request_err] = await option(request(resource));

  if (credential_request_err) {
    toast(credential_request_err.message, "err");
    return
  }

  const credential = await window.navigator.credentials.create({
    publicKey: format_credential_request(credential_request)
  })

  const [result, err] = await option(add_credential(Object.assign(credential, { title: data.get("title") })))

  if (err) {
    toast(err.message, "err")
    return
  }

  if (cache_url) {
    await message_sw({ type: "delete_content", payload: { cache_name: "swr_content", url: cache_url } })
  }

  window.location.reload();
}

add_listeners(credential_delete_forms, {
  submit: on_credential_delete,
});

add_listeners(credential_request_form, {
  submit: on_credential_add,
});

add_listeners(credentials_delele_form, {
  submit: on_credentials_delete,
})
