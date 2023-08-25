import { request, option, upload_request, async_pool, gen_id } from "./utils.js";
import { ListingPhotoPreview } from "./components/listing-photo-preview.js";
import { signal } from "state";
import { add_listeners, fragment } from "dom";

export class Uploader {
  constructor(listing) {
    this.listing = listing;
    this.photos_input = document.querySelector(".js-photos-input");
    this.attachment_link_form = document.querySelector(".js-attachment-sync-form");
    this.attachment_create_form = document.querySelector(".js-attachment-create-form");
    this.attachment_delete_forms = document.querySelectorAll(".js-attachment-delete-form");
    this.previews = document.querySelector(".js-photo-previews");
    this.photos_area = document.querySelector(".js-photos-area");

    this.tpromise = import("./i18n.js").then((mod) => {
      this.t = mod.t;
    });
    this.attachments_count = signal(this.previews.children.length);
    this.setup();
  }

  static from(listing) {
    return new Uploader(listing);
  }

  async setup() {
    await this.tpromise;
    this.previews.classList.toggle("hidden", this.attachments_count < 1);

    add_listeners(this.photos_input, { change: this.on_photos_change.bind(this) });
    add_listeners(this.attachment_delete_forms, { submit: this.on_attachment_delete() });
    add_listeners(this.photos_area, {
      dragover: this.on_drag_over.bind(this),
      drop: this.on_drop.bind(this),
      dragenter: this.on_drag_enter.bind(this),
      dragleave: this.on_drag_leave.bind(this),
    })
  }

  on_drag_over(e) {
    e.stopPropagation();
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";

    return false;
  }

  on_drop(e) {
    e.stopPropagation();
    e.preventDefault();
    let files = e.dataTransfer.files;
    e.currentTarget.classList.remove("!border-primary-600");
    this.generate_previews(files);
  }

  on_drag_enter(e) {
    e.currentTarget.classList.add("!border-primary-600");
  }

  on_drag_leave(e) {
    if (e.target === this.photos_area) e.currentTarget.classList.remove("!border-primary-600");
  }

  generate_previews(files) {
    let new_attachments = [];
    let order = this.previews.children.length;
    for (let file of files) {
      new_attachments.push({
        temp_id: gen_id("attachment"),
        raw: file,
        name: file.name,
        size: file.size,
        type: file.type,
        is_image: true,
        uploading: signal(true),
        progress: signal(0),
        order: order++,
        id: signal(undefined)
      })
    }

    this.attachments_count.update(c => c + new_attachments.length);

    let list = fragment();
    for (let file of new_attachments) {
      list.append(ListingPhotoPreview({ file, on_delete: this.on_attachment_delete(file), listing: this.listing, t: this.t }))
    }

    this.previews.append(list);
    this.upload_all(new_attachments);
  }

  on_photos_change(e) {
    let files = e.target.files;
    if (!files.length) return;
    this.generate_previews(files);
  }

  on_attachment_delete(file) {
    let ctx = this;
    return async function del(e) {
      e.preventDefault();
      let form = e.target;
      let action = form.getAttribute("api_action") || form.action;
      let method = form.getAttribute("api_method") || form.method;
      let [result, err] = await option(request(action, { method }));
      if (!err) {
        e.target.closest("li").remove();
        ctx.previews.classList.toggle("hidden", ctx.previews.children.length < 1);
        ctx.attachments_count.update(c => c - 1);
      }
    }
  }

  async upload_all(attachments) {
    let [urls, err] = await option(
      request("/cf/direct_upload", {
        body: { files: attachments }
      })
    )

    if (err) {
      console.log("ERR", err);
      return
    }

    let results = [];
    for await (let result of async_pool(10, attachments, this.upload_to(urls))) {
      results.push(result);
    }

    let [_, e] = await option(request(this.attachment_link_form.action, {
      body: { attachments: results }
    }));
  }


  on_upload_progress(file) {
    return (progress) => file.progress.set(Math.floor(progress.percent));
  }

  on_upload_done(file) {
    return () => file.uploading.set(false);
  }

  upload_to(urls) {
    let ctx = this;
    return async function upload(file) {
      let url = urls[file.temp_id];
      if (!url) return
      let fd = new FormData();
      fd.append("file", file.raw, file.name);

      let [_, upload_err] = await option(
        upload_request(url.upload_url, {
          data: fd,
          method: "POST",
          on_progress: ctx.on_upload_progress(file),
          on_done: ctx.on_upload_done(file),
        })
      );

      if (upload_err) {
        console.log("Something went wrong uploading file");
        return;
      }

      let [result, err] = await option(request(ctx.attachment_create_form.action, {
        body: {
          url: url.public_url,
          resource_id: url.id,
          size: file.size,
          name: file.name,
          type: file.type,
        }
      }));

      file.id.set(result.id);

      return { id: result.id, order: file.order }
    }
  }
}
