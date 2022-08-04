import { option, request } from './utils.js';
const login_form = document.querySelector(".js-login-form");
const logout_form = document.querySelector(".js-logout-form");

login_form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const data = Object.fromEntries(new FormData(form))

  const [result, err] = await option(request(form.action, { body: data, method: form.method, state: { replace: true } }));

  if (!err) {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "refetch_partials" })
    }
    window.location.reload();
  }
});


logout_form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const [result, err] = await option(request(form.action, { method: form.method }))

  if (!err) {
    if (navigator.serviceWorker && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: "refetch_partials" })
    }
    window.location.reload();
  }
})
