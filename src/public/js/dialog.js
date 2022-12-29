const dialog_closing_event = new Event('closing');
const dialog_closed_event = new Event('closed');
const dialog_opening_event = new Event('opening');
const dialog_opened_event = new Event('opened');
const dialog_removed_event = new Event('removed');

// track opening
const dialog_attr_observer = new MutationObserver((mutations, observer) => {
  mutations.forEach(async mutation => {
    if (mutation.attributeName === 'open') {
      const dialog = mutation.target;

      const is_open = dialog.hasAttribute('open');
      if (!is_open) return;

      dialog.removeAttribute('inert');

      // set focus
      const focus_target = dialog.querySelector('[autofocus]');
      focus_target
        ? focus_target.focus()
        : dialog.querySelector('button').focus();

      dialog.dispatchEvent(dialog_opening_event);
      await animations_complete(dialog);
      dialog.dispatchEvent(dialog_opened_event);
    }
  });
});

// track deletion
const dialog_delete_observer = new MutationObserver((mutations, observer) => {
  mutations.forEach(mutation => {
    mutation.removedNodes.forEach(removedNode => {
      if (removedNode.nodeName === 'DIALOG') {
        removedNode.removeEventListener('click', light_dismiss);
        removedNode.removeEventListener('close', dialog_close);
        removedNode.dispatchEvent(dialog_removed_event);
      }
    });
  });
});

// wait for all dialog animations to complete their promises
const animations_complete = element =>
  Promise.allSettled(
    element.getAnimations().map(animation =>
      animation.finished));

// click outside the dialog handler
const light_dismiss = ({ target: dialog }) => {
  if (dialog.nodeName === 'DIALOG')
    dialog.close('dismiss');
};

const dialog_close = async ({ target: dialog }) => {
  dialog.setAttribute('inert', '');
  dialog.dispatchEvent(dialog_closing_event);

  await animations_complete(dialog);

  dialog.dispatchEvent(dialog_closed_event);
};

// page load dialogs setup
export default async function (dialog) {
  dialog.addEventListener('click', light_dismiss);
  dialog.addEventListener('close', dialog_close);

  dialog_attr_observer.observe(dialog, {
    attributes: true,
  });

  dialog_delete_observer.observe(document.body, {
    attributes: false,
    subtree: false,
    childList: true,
  });

  // remove loading attribute
  // prevent page load @keyframes playing
  await animations_complete(dialog);
  dialog.removeAttribute('loading');
}
