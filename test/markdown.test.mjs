import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { setupDom } from "./helpers.mjs";

setupDom();
const { renderMarkdown, plainPreview, mountMarkdown } = await import("../src/markdown.js");

function host(markdown) {
  const root = document.createElement("div");
  renderMarkdown(root, markdown);
  return root;
}

describe("plain preview", () => {
  test("collapses markdown to a single line", () => {
    const text = plainPreview("## Title\n\n- **milk**\n- eggs\n\n[shop](https://example.com)");
    assert.equal(text.includes("\n"), false);
    assert.equal(text, "Title milk eggs shop");
  });
});

describe("sanitized markdown", () => {
  test("renders headings, bold, lists, tables and new-tab links", () => {
    const root = host([
      "## Plan",
      "",
      "Buy **flour** and *yeast*.",
      "",
      "- weigh",
      "  - salt",
      "- mix",
      "",
      "| Step | Time |",
      "| --- | --- |",
      "| Rise | 1h |",
      "",
      "[recipe](https://example.com/bread)",
    ].join("\n"));
    assert.equal(root.querySelector("h2").textContent, "Plan");
    assert.equal(root.querySelector("strong").textContent, "flour");
    assert.equal(root.querySelector("em").textContent, "yeast");
    const top = [...root.querySelector("ul").children].map((li) => li.childNodes[0].textContent);
    assert.deepEqual(top, ["weigh", "mix"]);
    assert.equal(root.querySelector("li li").textContent, "salt");
    assert.equal(root.querySelector("tbody td").textContent, "Rise");
    const link = root.querySelector("a");
    assert.equal(link.getAttribute("href"), "https://example.com/bread");
    assert.equal(link.target, "_blank");
    assert.match(link.rel, /noopener/);
    assert.match(link.rel, /noreferrer/);
  });

  test("keeps raw html as text and drops unsafe urls", () => {
    const root = host('Hello <script>alert(1)</script> <img src=x onerror=alert(1)>\n\n[x](javascript:alert(1))\n\nhttps://example.com/ok');
    assert.equal(root.querySelector("script"), null);
    assert.equal(root.querySelector("img"), null);
    assert.match(root.textContent, /<script>alert\(1\)<\/script>/);
    assert.equal(root.querySelector('a[href^="javascript:"]'), null);
    assert.equal(root.querySelector('a[href="https://example.com/ok"]').target, "_blank");
  });

  test("uses ha-markdown when the dashboard has defined it", () => {
    class FakeMarkdown extends window.HTMLElement {
      set content(value) { this._content = value; }
      get content() { return this._content; }
    }
    if (!customElements.get("ha-markdown")) customElements.define("ha-markdown", FakeMarkdown);
    const root = document.createElement("div");
    const node = mountMarkdown(root, "# Hello");
    assert.equal(node.localName, "ha-markdown");
    assert.equal(node.content, "# Hello");
    assert.equal(node.breaks, true);
    assert.equal(root.querySelector("h1"), null);
  });
});
