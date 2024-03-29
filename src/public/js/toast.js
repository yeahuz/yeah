import { ul, li, span, listeners, html } from "dom";

let ICONS = {
  info: `<svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
      class="w-5 h-5 flex-shrink-0 text-warning-600"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  `,
  success: `<svg
      viewBox="0 0 24 24"
      class="w-5 h-5 flex-shrink-0 text-success-600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22 11.0857V12.0057C21.9988 14.1621 21.3005 16.2604 20.0093 17.9875C18.7182 19.7147 16.9033 20.9782 14.8354 21.5896C12.7674 22.201 10.5573 22.1276 8.53447 21.3803C6.51168 20.633 4.78465 19.2518 3.61096 17.4428C2.43727 15.6338 1.87979 13.4938 2.02168 11.342C2.16356 9.19029 2.99721 7.14205 4.39828 5.5028C5.79935 3.86354 7.69279 2.72111 9.79619 2.24587C11.8996 1.77063 14.1003 1.98806 16.07 2.86572M22 4L12 14.01L9 11.01"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`,
  err: `<svg
      viewBox="0 0 24 24"
      class="w-5 h-5 flex-shrink-0 text-error-600"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>`,
};

function init() {
  let container = ul({ class: "toast-group" });
  document.firstElementChild.insertBefore(container, document.body);
  return container;
}

let Toaster = init();

function add_toast(toast) {
  return Toaster.children.length ? flip_toast(toast) : Toaster.appendChild(toast);
}

function pause_animation(e) {
  let animations = e.target.getAnimations();
  animations.forEach((animation) => animation.pause());
}

function resume_animation(e) {
  let animations = e.target.getAnimations();
  animations.forEach((animation) => animation.play());
}

function create_toast(text, type) {
  let toast = li(
    { class: `toast-item toast-item-${type}` },
    html(ICONS[type]),
    span({ class: "font-medium ml-2" }, text),
    listeners({
      mouseover: pause_animation,
      mouseleave: resume_animation
    })
  )
  return toast;
}


export function toast(text, type = "info") {
  let t = create_toast(text, type);
  add_toast(t);

  return new Promise(async (resolve, reject) => {
    await Promise.allSettled(t.getAnimations().map((animation) => animation.finished));
    Toaster.removeChild(t);
    resolve();
  });
}

function flip_toast(toast) {
  let prev_height = Toaster.offsetHeight;

  Toaster.appendChild(toast);

  let current_height = Toaster.offsetHeight;
  let delta_height = current_height - prev_height;

  let animation = Toaster.animate(
    [{ transform: `translateY(${delta_height}px)` }, { transform: `translateY(0)` }],
    { duration: 150, easing: "ease-out" });

  animation.startTime = document.timeline.currentTime;
}
