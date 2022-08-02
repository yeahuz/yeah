import { add_listeners } from './dom.js'

function init() {
  if ("serviceWorker" in window.navigator) {
    window.navigator.serviceWorker.register("/public/js/sw.js", { scope: "/" })
          .then(reg => console.log("Service worker registered."))
          .catch(err => console.error("Failed to register service worker ", err));
  }
}

window.addEventListener("load", init, false);
