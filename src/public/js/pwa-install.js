const install_btn = document.querySelector(".js-install-btn");

let deferred_prompt = null;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred_prompt = e;
  if (install_btn) {
    install_btn.classList.add("!scale-100");
  }
});

window.addEventListener("appinstalled", (e) => {
  if (install_btn) {
    install_btn.classList.remove("!scale-100");
  }
  deferred_prompt = null;
});

if (install_btn) install_btn?.addEventListener("click", () => deferred_prompt.prompt());
