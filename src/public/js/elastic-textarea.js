class ElasticTextarea extends HTMLElement {
  connectedCallback() {
    this.querySelectorAll("textarea").forEach((textarea_el) => {
      const lines = textarea_el.value.split("\n").length;
      const rows = (lines >= 2 ? lines : textarea_el.rows) || 2;
      textarea_el.rows = rows;
      textarea_el.dataset.min_rows = rows;
      this.update(textarea_el);
    });

    this.addEventListener("input", ({ target }) => {
      if (!(target instanceof HTMLTextAreaElement)) return;
      this.update(target);
    });
  }

  is_scrolling(textarea_el) {
    return textarea_el.scrollHeight > textarea_el.clientHeight;
  }

  grow(textarea_el) {
    let prev_height = textarea_el.clientHeight;
    let rows = this.rows(textarea_el);

    while (this.is_scrolling(textarea_el)) {
      rows++;
      textarea_el.rows = rows;
      const new_height = textarea_el.clientHeight;
      if (new_height === prev_height) break;

      prev_height = new_height;
    }
  }

  shrink(textarea_el) {
    let prev_height = textarea_el.clientHeight;
    const min_rows = parseInt(textarea_el.dataset.min_rows);
    let rows = this.rows(textarea_el);

    while (!this.is_scrolling(textarea_el) && rows > min_rows) {
      rows--;
      textarea_el.rows = Math.max(rows, min_rows);

      const new_height = textarea_el.clientHeight;

      if (new_height === prev_height) break;

      if (this.is_scrolling(textarea_el)) {
        this.grow(textarea_el);
        break;
      }
    }
  }

  update(textarea_el) {
    if (this.is_scrolling(textarea_el)) {
      this.grow(textarea_el);
    } else {
      this.shrink(textarea_el);
    }
  }

  rows(textarea_el) {
    return textarea_el.rows || parseInt(textarea_el.dataset.min_rows);
  }
}

customElements.define("elastic-textarea", ElasticTextarea);
