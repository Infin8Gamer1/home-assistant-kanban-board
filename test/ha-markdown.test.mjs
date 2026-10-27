import { test } from "node:test";
import assert from "node:assert/strict";
import { setupDom, makeHass, tick, click } from "./helpers.mjs";

const dom = setupDom();

class FakeMarkdown extends dom.window.HTMLElement {
  set content(value) {
    this._content = value;
    this.setAttribute("data-content", value);
  }
  get content() { return this._content; }
}
dom.window.customElements.define("ha-markdown", FakeMarkdown);

await import("../todo-kanban-card-plus.js");

test("the detail view prefers ha-markdown when it is registered", async () => {
  const description = "## From Home Assistant\n\n**bold**";
  const calls = [];
  const { hass } = makeHass({
    "todo.urgent": [{ uid: "u1", summary: "Pepper", status: "needs_action", description }],
    "todo.normal": [],
    "todo.later": [],
  }, calls);
  const card = document.createElement("todo-kanban-card-plus");
  card.setConfig({
    default_collapsed: false,
    lanes: [
      { entity: "todo.urgent" },
      { entity: "todo.normal" },
      { entity: "todo.later" },
    ],
  });
  card.hass = hass;
  document.body.appendChild(card);
  await tick();
  click(card.shadowRoot.querySelector(".label"));
  const md = card.shadowRoot.querySelector("dialog.detail ha-markdown");
  assert.ok(md, "expected ha-markdown inside the detail dialog");
  assert.equal(md.content, description);
  assert.equal(card.shadowRoot.querySelector("dialog.detail .md h2"), null);
});
