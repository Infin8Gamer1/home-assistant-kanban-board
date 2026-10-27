/*
 * A small markdown renderer for item descriptions.
 *
 * Home Assistant dashboards already define `<ha-markdown>` (sanitized, themed, links
 * open in a new tab). When that element exists, use it. The demo, the tests, and any
 * dashboard old enough to lack it fall through to the renderer below.
 *
 * The fallback never parses HTML and never assigns to innerHTML. Markup becomes
 * elements and text nodes, so a description cannot smuggle a script, an onerror
 * handler, or a `javascript:` link. Links are http(s), mailto, or same-document
 * relative URLs, and they open in a new tab.
 */

export function plainPreview(markdown) {
  if (!markdown) return "";
  return String(markdown)
    .replace(/\r\n?/g, "\n")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "")
    .replace(/\|/g, " ")
    .replace(/[*_~]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function mountMarkdown(parent, markdown) {
  parent.replaceChildren();
  const text = markdown == null ? "" : String(markdown);
  if (typeof customElements !== "undefined" && customElements.get("ha-markdown")) {
    const node = document.createElement("ha-markdown");
    node.breaks = true;
    node.setAttribute("breaks", "");
    node.content = text;
    parent.appendChild(node);
    return node;
  }
  renderMarkdown(parent, text);
  return null;
}

export function renderMarkdown(parent, markdown) {
  parent.replaceChildren();
  const frag = document.createDocumentFragment();
  for (const block of parseBlocks(markdown)) frag.appendChild(renderBlock(block));
  parent.appendChild(frag);
}

function parseBlocks(markdown) {
  const lines = String(markdown ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/\t/g, "  ")
    .split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }

    const fence = line.match(/^(`{3,}|~{3,})/);
    if (fence) {
      const marker = fence[1][0];
      const min = fence[1].length;
      const buf = [];
      i++;
      while (i < lines.length) {
        const close = lines[i].trim();
        if (close[0] === marker && close.length >= min && [...close].every((c) => c === marker)) {
          i++;
          break;
        }
        buf.push(lines[i]);
        i++;
      }
      blocks.push({ type: "code", text: buf.join("\n") });
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      i++;
      continue;
    }

    if (/^\s*>\s?/.test(line)) {
      const buf = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ""));
        i++;
      }
      blocks.push({ type: "quote", text: buf.join("\n") });
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && isSeparator(lines[i + 1])) {
      const header = splitRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim() && lines[i].includes("|")) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      blocks.push({ type: "table", header, rows });
      continue;
    }

    if (isListItem(line)) {
      const items = [];
      while (i < lines.length && isListItem(lines[i])) {
        const m = lines[i].match(/^(\s*)(?:[-*+]|\d+[.)])\s+(.*)$/);
        items.push({
          depth: Math.floor(m[1].length / 2),
          ordered: /^\s*\d+[.)]\s+/.test(lines[i]),
          text: m[2],
        });
        i++;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() && !isSpecial(lines, i)) {
      para.push(lines[i]);
      i++;
    }
    blocks.push({ type: "paragraph", lines: para });
  }
  return blocks;
}

function isListItem(line) {
  return /^\s*(?:[-*+]|\d+[.)])\s+\S/.test(line);
}

function isSeparator(line) {
  const cells = splitRow(line);
  return cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c));
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((c) => c.trim());
}

function isSpecial(lines, i) {
  const line = lines[i];
  if (/^(#{1,6})\s+/.test(line)) return true;
  if (/^(`{3,}|~{3,})/.test(line)) return true;
  if (/^\s*>\s?/.test(line)) return true;
  if (isListItem(line)) return true;
  if (line.includes("|") && i + 1 < lines.length && isSeparator(lines[i + 1])) return true;
  return false;
}

function renderBlock(block) {
  switch (block.type) {
    case "heading": {
      const h = document.createElement(`h${block.level}`);
      appendInline(h, block.text);
      return h;
    }
    case "paragraph": {
      const p = document.createElement("p");
      block.lines.forEach((line, n) => {
        if (n) p.appendChild(document.createElement("br"));
        appendInline(p, line);
      });
      return p;
    }
    case "code": {
      const pre = document.createElement("pre");
      const code = document.createElement("code");
      code.textContent = block.text;
      pre.appendChild(code);
      return pre;
    }
    case "quote": {
      const quote = document.createElement("blockquote");
      for (const inner of parseBlocks(block.text)) quote.appendChild(renderBlock(inner));
      return quote;
    }
    case "table": {
      const wrap = document.createElement("div");
      wrap.className = "table-wrap";
      const table = document.createElement("table");
      const thead = document.createElement("thead");
      const headRow = document.createElement("tr");
      for (const cell of block.header) {
        const th = document.createElement("th");
        appendInline(th, cell);
        headRow.appendChild(th);
      }
      thead.appendChild(headRow);
      const tbody = document.createElement("tbody");
      for (const row of block.rows) {
        const tr = document.createElement("tr");
        for (const cell of row) {
          const td = document.createElement("td");
          appendInline(td, cell);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
      table.append(thead, tbody);
      wrap.appendChild(table);
      return wrap;
    }
    case "list":
      return renderList(block.items, 0, block.items[0].depth).list;
    default: {
      const p = document.createElement("p");
      return p;
    }
  }
}

function renderList(items, start, depth) {
  const list = document.createElement(items[start].ordered ? "ol" : "ul");
  let i = start;
  while (i < items.length && items[i].depth === depth) {
    const li = document.createElement("li");
    appendInline(li, items[i].text);
    i++;
    if (i < items.length && items[i].depth > depth) {
      const nested = renderList(items, i, items[i].depth);
      li.appendChild(nested.list);
      i = nested.i;
    }
    list.appendChild(li);
  }
  return { list, i };
}

function appendInline(parent, text) {
  const src = String(text);
  let i = 0;
  let buf = "";
  const flush = () => {
    if (!buf) return;
    parent.appendChild(document.createTextNode(buf));
    buf = "";
  };

  while (i < src.length) {
    const rest = src.slice(i);

    if (rest.startsWith("https://") || rest.startsWith("http://")) {
      const matched = rest.match(/^https?:\/\/[^\s<]+/i);
      if (matched) {
        const href = trimUrl(matched[0]);
        if (safeUrl(href)) {
          flush();
          parent.appendChild(linkEl(href, href));
          i += href.length;
          continue;
        }
      }
    }

    if (src[i] === "`") {
      const end = src.indexOf("`", i + 1);
      if (end > i) {
        flush();
        const code = document.createElement("code");
        code.textContent = src.slice(i + 1, end);
        parent.appendChild(code);
        i = end + 1;
        continue;
      }
    }

    if (src.startsWith("**", i) || src.startsWith("__", i)) {
      const marker = src.slice(i, i + 2);
      const end = src.indexOf(marker, i + 2);
      if (end !== -1) {
        flush();
        const strong = document.createElement("strong");
        appendInline(strong, src.slice(i + 2, end));
        parent.appendChild(strong);
        i = end + 2;
        continue;
      }
    }

    if (src.startsWith("~~", i)) {
      const end = src.indexOf("~~", i + 2);
      if (end !== -1) {
        flush();
        const del = document.createElement("del");
        appendInline(del, src.slice(i + 2, end));
        parent.appendChild(del);
        i = end + 2;
        continue;
      }
    }

    if ((src[i] === "*" || src[i] === "_") && src[i + 1] !== src[i]) {
      const marker = src[i];
      const prev = i === 0 ? "" : src[i - 1];
      if (!(marker === "_" && /\w/.test(prev))) {
        const end = src.indexOf(marker, i + 1);
        const after = end === -1 ? "" : src[end + 1] || "";
        if (end > i + 1 && !src.slice(i + 1, end).includes("\n") && !(marker === "_" && /\w/.test(after))) {
          flush();
          const em = document.createElement("em");
          appendInline(em, src.slice(i + 1, end));
          parent.appendChild(em);
          i = end + 1;
          continue;
        }
      }
    }

    if (src.startsWith("![", i)) {
      const close = src.indexOf("]", i + 2);
      if (close !== -1 && src[close + 1] === "(") {
        const end = src.indexOf(")", close + 2);
        if (end !== -1 && !src.slice(i, end).includes("\n")) {
          flush();
          const alt = src.slice(i + 2, close);
          if (alt) parent.appendChild(document.createTextNode(alt));
          i = end + 1;
          continue;
        }
      }
    }

    if (src[i] === "[") {
      const close = src.indexOf("]", i + 1);
      if (close !== -1 && src[close + 1] === "(") {
        const end = findClosingParen(src, close + 1);
        if (end !== -1 && !src.slice(i, end).includes("\n")) {
          const label = src.slice(i + 1, close);
          const href = safeUrl(src.slice(close + 2, end).trim());
          flush();
          if (href) parent.appendChild(linkEl(href, label, true));
          else appendInline(parent, label);
          i = end + 1;
          continue;
        }
      }
    }

    buf += src[i];
    i += 1;
  }
  flush();
}

function findClosingParen(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const ch = src[i];
    if (ch === "\n") return -1;
    if (ch === "(") depth++;
    else if (ch === ")") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function trimUrl(raw) {
  return raw.replace(/[),.;:!?]+$/g, "");
}

function safeUrl(href) {
  if (!href || /[\u0000-\u001f\s]/.test(href)) return null;
  if (href.startsWith("//")) return null;
  const proto = href.match(/^([a-z][a-z0-9+.-]*):/i);
  if (proto) {
    const name = proto[1].toLowerCase();
    if (name === "http" || name === "https" || name === "mailto") return href;
    return null;
  }
  if (href.startsWith("#") || href.startsWith("/") || href.startsWith("./") || href.startsWith("../")) {
    return href;
  }
  return null;
}

function linkEl(href, label, inlineLabel) {
  const a = document.createElement("a");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  if (inlineLabel) appendInline(a, label);
  else a.textContent = label;
  return a;
}
