/* todo-kanban-card-plus 1.4.0
 * Fork of https://github.com/DennisdeBest/HaTodoKanbanCard (MIT, Dennis de Best).
 *
 * BUILT FILE — do not edit. The source is in src/; run `npm run build`.
 * MIT licensed. Bundled from src/ so that HACS, which installs exactly one file,
 * has one file to install.
 */

// src/dom.js
function el(tag, props, children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === void 0 || v === null || v === false) continue;
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k === "style") {
      for (const [prop, value] of Object.entries(v)) {
        if (prop.startsWith("--")) node.style.setProperty(prop, value);
        else node.style[prop] = value;
      }
    } else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of [].concat(children || [])) {
    if (c === null || c === void 0 || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}
function icon(name, cls) {
  return el("ha-icon", { icon: name, class: cls || "" });
}
function dueLabel(due) {
  if (!due) return null;
  const day = String(due).slice(0, 10);
  const d = /* @__PURE__ */ new Date(day + "T00:00:00");
  if (isNaN(d)) return { text: String(due), state: "" };
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d - today) / 864e5);
  const text = days === 0 ? "today" : days === 1 ? "tomorrow" : days === -1 ? "yesterday" : d.toLocaleDateString(void 0, { weekday: "short", day: "numeric", month: "short" });
  return { text, state: days < 0 ? "overdue" : days <= 1 ? "soon" : "" };
}

// src/tags.js
var TAG_PATTERN = /(?:^|\s)#(?:"([^"\n]+)"|'([^'\n]+)'|([\p{L}\p{N}][\p{L}\p{N}_-]*))/gu;
function splitTags(summary) {
  const raw = String(summary ?? "");
  const tags = [];
  const text = raw.replace(TAG_PATTERN, (_match, quoted, singled, bare) => {
    const tag = (quoted ?? singled ?? bare).trim();
    if (tag && !tags.includes(tag)) tags.push(tag);
    return " ";
  }).replace(/\s+/g, " ").trim();
  return { text: text || raw.trim(), tags };
}
function formatTag(tag) {
  const clean = String(tag ?? "").trim();
  return /^[\p{L}\p{N}][\p{L}\p{N}_-]*$/u.test(clean) ? `#${clean}` : `#"${clean}"`;
}
function toggleTag(text, tag) {
  const raw = String(text ?? "");
  if (!splitTags(raw).tags.includes(tag)) return `${raw.trim()} ${formatTag(tag)}`.trim();
  return raw.replace(TAG_PATTERN, (match, quoted, singled, bare) => {
    const found = (quoted ?? singled ?? bare).trim();
    return found === tag ? " " : match;
  }).replace(/\s+/g, " ").trim();
}
function tagTokenAt(value, caret) {
  const text = String(value ?? "");
  const at = Math.max(0, Math.min(caret ?? text.length, text.length));
  const hash = text.lastIndexOf("#", Math.max(0, at - 1));
  const none = { from: at, to: at, query: null };
  if (hash === -1) return none;
  if (hash > 0 && !/\s/.test(text[hash - 1])) return none;
  const rest = text.slice(hash + 1);
  if (rest.startsWith('"')) {
    const close = rest.indexOf('"', 1);
    const to2 = close === -1 ? text.length : hash + 1 + close + 1;
    if (at > to2) return none;
    return { from: hash, to: to2, query: rest.slice(1, close === -1 ? void 0 : close) };
  }
  const space = rest.search(/\s/);
  const to = space === -1 ? text.length : hash + 1 + space;
  if (at > to) return none;
  return { from: hash, to, query: rest.slice(0, space === -1 ? void 0 : space) };
}

// src/colors.js
var HA_COLORS = /* @__PURE__ */ new Set([
  "primary",
  "accent",
  "red",
  "pink",
  "purple",
  "deep-purple",
  "indigo",
  "blue",
  "light-blue",
  "cyan",
  "teal",
  "green",
  "light-green",
  "lime",
  "yellow",
  "amber",
  "orange",
  "deep-orange",
  "brown",
  "light-grey",
  "grey",
  "dark-grey",
  "blue-grey",
  "black",
  "white",
  "primary-text",
  "secondary-text",
  "disabled"
]);
function computeCssColor(value) {
  if (!value || typeof value !== "string") return value;
  return HA_COLORS.has(value) ? `var(--${value}-color)` : value;
}
var TAG_PALETTE = [
  "blue",
  "green",
  "orange",
  "purple",
  "teal",
  "pink",
  "amber",
  "indigo",
  "light-green",
  "deep-orange",
  "cyan",
  "brown"
];
function hashOf(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) hash = hash * 31 + value.charCodeAt(i) >>> 0;
  return hash;
}
function autoTagColors(tags, configured) {
  const chosen = configured || {};
  const taken = new Set(Object.values(chosen).filter(Boolean));
  const out = {};
  for (const tag of [...new Set(tags || [])].sort((a, b) => a.localeCompare(b))) {
    if (chosen[tag]) continue;
    const start = hashOf(String(tag)) % TAG_PALETTE.length;
    let pick = TAG_PALETTE[start];
    for (let i = 0; i < TAG_PALETTE.length; i++) {
      const candidate = TAG_PALETTE[(start + i) % TAG_PALETTE.length];
      if (!taken.has(candidate)) {
        pick = candidate;
        break;
      }
    }
    taken.add(pick);
    out[tag] = pick;
  }
  return out;
}
function tagColor(tag, configured, allTags) {
  const set = (configured || {})[tag];
  if (set) return computeCssColor(set);
  if (allTags && allTags.length) {
    const auto = autoTagColors(allTags, configured);
    if (auto[tag]) return computeCssColor(auto[tag]);
  }
  return computeCssColor(TAG_PALETTE[hashOf(String(tag)) % TAG_PALETTE.length]);
}

// src/markdown.js
function plainPreview(markdown) {
  if (!markdown) return "";
  return String(markdown).replace(/\r\n?/g, "\n").replace(/```[\s\S]*?```/g, " ").replace(/`([^`]*)`/g, "$1").replace(/!\[[^\]]*]\([^)]*\)/g, " ").replace(/\[([^\]]*)]\([^)]*\)/g, "$1").replace(/^\s{0,3}#{1,6}\s+/gm, "").replace(/^\s{0,3}>\s?/gm, "").replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, "").replace(/\|/g, " ").replace(/[*_~]+/g, "").replace(/\s+/g, " ").trim();
}
function mountMarkdown(parent, markdown) {
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
function renderMarkdown(parent, markdown) {
  parent.replaceChildren();
  const frag = document.createDocumentFragment();
  for (const block of parseBlocks(markdown)) frag.appendChild(renderBlock(block));
  parent.appendChild(frag);
}
function parseBlocks(markdown) {
  const lines = String(markdown ?? "").replace(/\r\n?/g, "\n").replace(/\t/g, "  ").split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
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
          text: m[2]
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

// src/styles.css
var styles_default = `/* Styles for the board. Bundled into the card at build time. */
:host { display: block; }
[hidden] { display: none !important; }
ha-card { padding: 8px 8px 12px; }
.card-title {
  font-size: var(--ha-font-size-l, 20px); font-weight: 500;
  margin: 8px 8px 4px; color: var(--primary-text-color);
}
.error {
  display: flex; align-items: center; gap: 8px; margin: 4px 8px 8px; padding: 8px 12px;
  border-radius: 10px; background: rgba(var(--rgb-error-color, 219,68,55), 0.12);
  color: var(--error-color); font-size: 13px;
}
.board {
  display: grid; gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(var(--lane-min, 270px), 1fr));
}
.lane {
  --lane-accent: var(--primary-color);
  display: flex; flex-direction: column; min-width: 0;
  border-radius: 12px; padding: 4px 6px 6px;
  background: var(--secondary-background-color, rgba(127,127,127,0.08));
  border: 1px solid transparent;
}
.lane.drop-target { border-color: var(--lane-accent); }
.lane.collapsed .items,
.lane.collapsed .add,
.lane.collapsed .done-wrap,
.lane.gone .items,
.lane.gone .add,
.lane.gone .done-wrap { display: none; }
.lane-head {
  display: flex; align-items: center; gap: 8px; padding: 8px 6px; cursor: pointer;
  user-select: none;
}
.lane-icon { color: var(--lane-accent); --mdc-icon-size: 20px; }
.lane-title {
  flex: 1; min-width: 0; font-weight: 500; color: var(--primary-text-color);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.count {
  min-width: 22px; padding: 1px 7px; border-radius: 11px; text-align: center;
  font-size: 12px; font-weight: 600; color: var(--text-primary-color, #fff);
  background: var(--lane-accent);
}
.count.done { background: none; color: var(--success-color, #4caf50); --mdc-icon-size: 20px; }
.chev { color: var(--secondary-text-color); --mdc-icon-size: 20px; }
.items { display: flex; flex-direction: column; gap: 2px; }
.empty, .missing { padding: 10px 8px; color: var(--secondary-text-color); font-size: 13px; }
.item {
  display: flex; align-items: flex-start; gap: 6px; padding: 6px 2px 6px 4px;
  border-radius: 8px; background: var(--card-background-color);
}
.item.dragging { opacity: 0.35; }
.item.completed .summary { text-decoration: line-through; color: var(--secondary-text-color); }
.item-wrap { display: flex; flex-direction: column; gap: 2px; }
.check { flex: none; width: 18px; height: 18px; margin-top: 6px; accent-color: var(--lane-accent); }
.label {
  flex: 1; min-width: 0; cursor: pointer; padding: 2px 2px 4px;
  display: flex; flex-direction: column; align-items: stretch; gap: 2px;
}
.summary-line { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; min-width: 0; }
.summary { color: var(--primary-text-color); font-size: 14px; word-break: break-word; }
.desc-preview {
  display: flex; align-items: center; gap: 4px; min-width: 0;
  color: var(--secondary-text-color); font-size: 12px; line-height: 1.3;
}
.desc-text {
  min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.due {
  font-size: 11px; padding: 1px 6px; border-radius: 8px; color: var(--secondary-text-color);
  background: rgba(127,127,127,0.16);
}
.tag {
  font-size: 11px; padding: 0 7px; border-radius: 9px; white-space: nowrap;
  color: var(--tag-color, var(--secondary-text-color));
  border: 1px solid currentColor; opacity: .95;
}
.due.soon { color: var(--warning-color, #ff9800); }
.due.overdue { color: var(--error-color); }
.note { --mdc-icon-size: 14px; color: var(--secondary-text-color); }
.grip {
  flex: none; display: grid; place-items: center; width: 30px; height: 30px; margin-top: 1px;
  color: var(--secondary-text-color); cursor: grab; touch-action: none;
}
.grip:active { cursor: grabbing; }
.ghost {
  position: fixed; z-index: 10; pointer-events: none; opacity: 0.95;
  box-shadow: var(--ha-card-box-shadow, 0 4px 14px rgba(0,0,0,0.35));
}
.placeholder {
  height: 30px; border-radius: 8px; border: 2px dashed var(--lane-accent); opacity: 0.7;
}
.add { padding: 6px 2px 2px; }
.add-row { display: flex; align-items: center; gap: 4px; }
.tag-btn {
  flex: none; display: grid; place-items: center; width: 30px; height: 30px;
  border: none; border-radius: 8px; cursor: pointer;
  background: transparent; color: var(--secondary-text-color);
}
.tag-btn:hover { background: rgba(127,127,127,.16); color: var(--primary-text-color); }
.tag-btn ha-icon { --mdc-icon-size: 18px; }
.tag-suggest { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 2px 0; }
.tag-chip { padding: 2px 9px; font-size: 12px; }
/* Off: the tag's own colour, muted right down. On: the colour itself, filled. A tag
   whose colour is grey is admittedly harder to read either way — worth it for every
   other tag showing what it will actually look like. */
.tag-chip {
  color: var(--tag-color, var(--secondary-text-color));
  border-color: currentColor; opacity: .45;
}
.tag-chip.on {
  opacity: 1;
  background: var(--tag-color, var(--lane-accent));
  border-color: transparent;
  color: var(--text-primary-color, #fff);
}
.no-tags { font-size: 12px; color: var(--secondary-text-color); padding: 2px; }
.field {
  flex: 1; min-width: 0; box-sizing: border-box; padding: 7px 10px; border-radius: 8px;
  border: 1px solid var(--divider-color); background: var(--card-background-color);
  color: var(--primary-text-color); font: inherit; font-size: 14px;
}
.field:focus { outline: none; border-color: var(--lane-accent); }
.field.short { flex: 0 0 auto; width: 9.5em; }
.icon-btn {
  flex: none; display: grid; place-items: center; width: 34px; height: 34px;
  border: none; border-radius: 8px; cursor: pointer;
  background: var(--lane-accent); color: var(--text-primary-color, #fff);
}
.editor {
  display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 0;
  padding: 0 20px 12px; margin: 0; border: none; background: transparent;
}
.editor .fields {
  display: flex; flex-direction: column; gap: 8px;
  overflow: auto; flex: 1; min-height: 0; padding-bottom: 8px;
}
.editor .row { display: flex; gap: 6px; align-items: flex-start; }
.field-label { font-size: 12px; font-weight: 600; color: var(--secondary-text-color); }
.editor textarea.desc {
  flex: none; width: 100%; min-height: 220px; resize: vertical; line-height: 1.45;
  font-family: inherit; field-sizing: content;
}
.editor input[type="date"] { width: 100%; max-width: 16em; flex: none; }
.editor .actions {
  flex: none; position: sticky; bottom: 0;
  padding-top: 10px; padding-bottom: env(safe-area-inset-bottom);
  background: var(--card-background-color, #fff);
}
.moveto { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.moveto-label { font-size: 12px; color: var(--secondary-text-color); }
.actions { display: flex; align-items: center; gap: 6px; }
.spacer { flex: 1; }
.chip {
  display: inline-flex; align-items: center; gap: 4px; padding: 5px 10px;
  border-radius: 14px; border: 1px solid var(--divider-color); cursor: pointer;
  background: transparent; color: var(--primary-text-color); font: inherit; font-size: 13px;
}
.chip ha-icon { --mdc-icon-size: 16px; }
.chip.primary { background: var(--lane-accent); border-color: transparent; color: var(--text-primary-color, #fff); }
.chip.danger { color: var(--error-color); }
.link {
  display: inline-flex; align-items: center; gap: 2px; padding: 4px 2px;
  background: none; border: none; cursor: pointer; font: inherit; font-size: 13px;
  color: var(--secondary-text-color);
}
.link ha-icon { --mdc-icon-size: 18px; }
.link.danger { color: var(--error-color); margin-left: auto; }
.done-head { display: flex; align-items: center; padding: 2px 4px; }
.done-items { opacity: 0.75; }

/* Detail dialog. <dialog> is shown with showModal(), so it paints in the top layer
   and a sections view cannot clip it. Near full-screen on a phone, a comfortable
   width on a desktop. */
dialog.detail {
  border: none; padding: 0; margin: auto; color: var(--primary-text-color);
  background: var(--card-background-color, #fff);
  width: min(720px, calc(100vw - 48px));
  max-width: calc(100vw - 48px);
  max-height: min(860px, calc(100dvh - 48px));
  height: auto;
  border-radius: 16px;
  box-shadow: 0 18px 50px rgba(0,0,0,.35);
  overflow: hidden;
  display: flex; flex-direction: column;
  min-height: 0;
}
dialog.detail::backdrop { background: rgba(0,0,0,.52); }
dialog.detail:focus { outline: none; }
.detail-head {
  display: flex; align-items: flex-start; gap: 12px; flex: none;
  padding: 16px 12px 8px 20px;
}
.detail-title {
  flex: 1; min-width: 0; margin: 4px 0 0; font-size: 22px; font-weight: 600;
  line-height: 1.3; word-break: break-word; color: var(--primary-text-color);
}
.detail-title:focus, .detail-kicker:focus { outline: none; }
.detail-kicker {
  flex: 1; margin-top: 8px; font-size: 12px; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--secondary-text-color);
}
.detail-close {
  flex: none; display: grid; place-items: center; width: 36px; height: 36px;
  border: none; border-radius: 18px; cursor: pointer;
  background: transparent; color: var(--primary-text-color);
}
.detail-close:hover { background: rgba(127,127,127,.16); }
.detail-close ha-icon { --mdc-icon-size: 22px; }
.detail-body {
  flex: 1; min-height: 0; overflow: auto;
  padding: 4px 20px 20px;
}
.detail-meta {
  display: inline-flex; align-items: center; gap: 6px; margin: 0 0 14px;
  font-size: 13px; color: var(--secondary-text-color);
}
.detail-meta.due { padding: 2px 8px; border-radius: 8px; background: rgba(127,127,127,.14); }
.detail-meta.soon { color: var(--warning-color, #ff9800); }
.detail-meta.overdue { color: var(--error-color); }
.detail-meta .meta-icon { --mdc-icon-size: 16px; }
.detail-empty { margin: 8px 0; color: var(--secondary-text-color); font-size: 14px; }
.detail-actions {
  flex: none; padding: 10px 20px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--divider-color);
  background: var(--card-background-color, #fff);
}
.md {
  font-size: 15px; line-height: 1.55; color: var(--primary-text-color);
  overflow-wrap: anywhere;
}
.md > :first-child { margin-top: 0; }
.md > :last-child { margin-bottom: 0; }
.md h1, .md h2, .md h3, .md h4, .md h5, .md h6 {
  margin: 1em 0 .4em; font-weight: 600; line-height: 1.25;
}
.md h1 { font-size: 1.45em; }
.md h2 { font-size: 1.25em; }
.md h3 { font-size: 1.08em; }
.md p { margin: .65em 0; }
.md ul, .md ol { margin: .4em 0; padding-left: 1.3em; }
.md li { margin: .2em 0; }
.md a { color: var(--primary-color); }
.md code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: .9em; padding: .1em .35em; border-radius: 4px;
  background: rgba(127,127,127,.16);
}
.md pre {
  margin: .7em 0; padding: 10px 12px; border-radius: 8px; overflow: auto;
  background: rgba(127,127,127,.12);
}
.md pre code { padding: 0; background: none; }
.md blockquote {
  margin: .7em 0; padding-left: 12px; border-left: 3px solid var(--divider-color);
  color: var(--secondary-text-color);
}
.md .table-wrap { overflow-x: auto; max-width: 100%; margin: .7em 0; }
.md table { border-collapse: collapse; width: max-content; min-width: 100%; font-size: .95em; }
.md th, .md td {
  border: 1px solid var(--divider-color); padding: 6px 8px; text-align: left; vertical-align: top;
}
.md th { background: rgba(127,127,127,.12); }
.md ha-markdown { display: block; }

@media (max-width: 700px) {
  dialog.detail {
    position: fixed; inset: 12px 0 0 0;
    width: 100%; max-width: 100%;
    height: auto; max-height: none;
    margin: 0; border-radius: 16px 16px 0 0;
  }
  .editor textarea.desc { min-height: 38vh; }
  .detail-title { font-size: 20px; }
}
`;

// src/card.js
var STORE = "todo-kanban.collapsed.";
var DEFAULT_ICON = "mdi:format-list-checks";
function cssAttr(value) {
  return String(value).replace(/(["\\])/g, "\\$1");
}
var DEFAULTS = {
  title: void 0,
  // "auto" opens a lane that has something in it and shuts one that does not; true and
  // false pin it. Whatever the default, a click on the header wins until the lane next
  // crosses empty (and under true/false, until the browser forgets).
  default_collapsed: "auto",
  hide_completed: false,
  hide_add: false,
  // Off by default: plenty of people have a `#` in an item for reasons of their own,
  // and a card update should not quietly start eating it.
  enable_tags: false,
  min_lane_width: 270,
  // tag name -> colour. Any tag not listed here still shows, in a neutral chip.
  tags: {}
};
var TodoKanbanCard = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._items = {};
    this._subs = [];
    this._drafts = {};
    this._wasEmpty = {};
    this._detail = null;
    this._detailKey = null;
    this._detailRevert = null;
    this._suppressOpen = false;
    this._showDone = {};
    this._drag = null;
    this._error = null;
    this._focus = null;
    this._lanes = /* @__PURE__ */ new Map();
    this._shell = null;
    this._shellKey = null;
    this._scrollRaf = null;
    this._onDragMove = this._onDragMove.bind(this);
    this._onDragEnd = this._onDragEnd.bind(this);
    this._autoScroll = this._autoScroll.bind(this);
  }
  static getConfigElement() {
    return document.createElement("todo-kanban-card-plus-editor");
  }
  // What the card picker drops in. Real lists if this instance has any, so the card is
  // useful the moment it is added rather than showing an error about todo.shopping.
  static getStubConfig(hass) {
    const todos = Object.keys(hass && hass.states || {}).filter((id) => id.startsWith("todo.")).slice(0, 3);
    return { lanes: (todos.length ? todos : ["todo.shopping"]).map((entity) => ({ entity })) };
  }
  setConfig(config) {
    const lanes = config && config.lanes || [];
    if (!lanes.length) throw new Error("todo-kanban-card-plus: `lanes` needs at least one entry");
    lanes.forEach((lane, i) => {
      if (!lane || !lane.entity) throw new Error(`todo-kanban-card-plus: lane ${i + 1} has no \`entity\``);
      if (!lane.entity.startsWith("todo.")) {
        throw new Error(`todo-kanban-card-plus: ${lane.entity} is not a todo entity`);
      }
    });
    if (config.tags !== void 0 && (typeof config.tags !== "object" || config.tags === null || Array.isArray(config.tags))) {
      throw new Error("todo-kanban-card-plus: `tags` must be a map of tag name to colour");
    }
    const collapse = config.default_collapsed;
    if (collapse !== void 0 && !["auto", true, false].includes(collapse)) {
      throw new Error("todo-kanban-card-plus: `default_collapsed` must be auto, true or false");
    }
    this._config = { ...DEFAULTS, ...config, lanes };
    this._render();
  }
  // Lane settings fall back to the card-wide setting, which falls back to DEFAULTS.
  _opt(lane, key) {
    return lane[key] !== void 0 ? lane[key] : this._config[key];
  }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    if (first) {
      this._subscribe();
      this._render();
    }
  }
  connectedCallback() {
    if (this._hass && !this._subs.length) this._subscribe();
  }
  disconnectedCallback() {
    this._unsubscribe();
    this._endDragListeners();
    clearTimeout(this._suppressTimer);
    const dialog = this.shadowRoot && this.shadowRoot.querySelector("dialog.detail");
    if (dialog) {
      try {
        if (dialog.open && dialog.close) dialog.close();
      } catch (err) {
      }
      dialog.remove();
    }
  }
  getCardSize() {
    return 2 + 3 * (this._config && this._config.lanes.length || 1);
  }
  // ---------------------------------------------------------------- live data
  _subscribe() {
    if (!this._hass || !this._config) return;
    this._unsubscribe();
    for (const lane of this._config.lanes) {
      const p = this._hass.connection.subscribeMessage(
        (msg) => this._externalUpdate(lane.entity, msg && msg.items || []),
        { type: "todo/item/subscribe", entity_id: lane.entity }
      );
      p.catch((err) => this._fail(`${lane.entity}: ${err.message || err}`));
      this._subs.push(p);
    }
  }
  // A push from elsewhere (the phone app, the other tablet, this card's own service
  // calls) must not redraw the board while something is being dragged or edited — the
  // half-typed name would vanish. Hold it and redraw when the interaction finishes.
  _externalUpdate(entity, items) {
    this._items[entity] = items;
    if (this._drag || this._detail) {
      this._pending = true;
      return;
    }
    this._render();
  }
  _unsubscribe() {
    for (const p of this._subs) p.then((unsub) => unsub && unsub()).catch(() => {
    });
    this._subs = [];
  }
  async _refresh(entity) {
    try {
      const res = await this._hass.callWS({ type: "todo/item/list", entity_id: entity });
      this._items[entity] = res && res.items || [];
      return this._items[entity];
    } catch (err) {
      this._fail(err.message || String(err));
      return this._items[entity] || [];
    }
  }
  _fail(message) {
    this._error = message;
    this._render();
    clearTimeout(this._errorTimer);
    this._errorTimer = setTimeout(() => {
      this._error = null;
      this._render();
    }, 8e3);
  }
  // ------------------------------------------------------------- item actions
  _call(service, data) {
    return this._hass.callService("todo", service, data).catch((err) => {
      this._fail(`${service}: ${err && (err.message || err.error) || err}`);
      throw err;
    });
  }
  _add(entity, summary) {
    const item = summary.trim();
    if (!item) return Promise.resolve();
    return this._call("add_item", { entity_id: entity, item });
  }
  _toggle(entity, item) {
    return this._call("update_item", {
      entity_id: entity,
      item: item.uid,
      status: item.status === "completed" ? "needs_action" : "completed"
    });
  }
  _remove(entity, item) {
    return this._call("remove_item", { entity_id: entity, item: item.uid });
  }
  async _save(entity, item, fields) {
    const data = { entity_id: entity, item: item.uid };
    if (fields.summary && fields.summary !== item.summary) data.rename = fields.summary;
    if ((fields.due || "") !== (item.due ? String(item.due).slice(0, 10) : "")) {
      data.due_date = fields.due || null;
    }
    if ((fields.description || "") !== (item.description || "")) {
      data.description = fields.description || "";
    }
    if (Object.keys(data).length === 2) return;
    await this._call("update_item", data);
  }
  /*
   * Move between lanes. HA has no such service, so: create on the target, delete from
   * the source. Add first — if the remove then fails the item exists twice, which is
   * annoying but recoverable, where the other order loses it outright.
   *
   * add_item appends, so landing it at a chosen position needs the new uid. Diffing
   * the target's uids before and after is exact (matching on the summary is not — two
   * "Milk"s are perfectly legal). If that lookup fails the item simply stays at the
   * bottom of the lane, which is a cosmetic loss, not a data one.
   */
  async _moveBetween(fromEntity, item, toEntity, beforeUid) {
    const before = new Set((await this._refresh(toEntity) || []).map((i) => i.uid));
    await this._call("add_item", {
      entity_id: toEntity,
      item: item.summary,
      ...item.due ? { due_date: String(item.due).slice(0, 10) } : {},
      ...item.description ? { description: item.description } : {}
    });
    await this._remove(fromEntity, item);
    if (beforeUid === void 0) return;
    for (let attempt = 0; attempt < 10; attempt++) {
      const items = await this._refresh(toEntity);
      const fresh = items.find((i) => !before.has(i.uid) && i.summary === item.summary);
      if (fresh) {
        try {
          await this._hass.callWS({
            type: "todo/item/move",
            entity_id: toEntity,
            uid: fresh.uid,
            ...beforeUid ? { previous_uid: beforeUid } : {}
          });
        } catch (err) {
        }
        return;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
  }
  async _reorder(entity, item, beforeUid) {
    try {
      await this._hass.callWS({
        type: "todo/item/move",
        entity_id: entity,
        uid: item.uid,
        ...beforeUid ? { previous_uid: beforeUid } : {}
      });
    } catch (err) {
      this._fail(`move: ${err.message || err}`);
    }
  }
  // ------------------------------------------------------------------ collapse
  _collapsed(lane, outstanding) {
    const entity = lane.entity;
    const mode = this._opt(lane, "default_collapsed");
    const empty = outstanding === 0;
    if (mode === "auto" && this._wasEmpty[entity] !== void 0 && this._wasEmpty[entity] !== empty) {
      this._store(entity, null);
    }
    this._wasEmpty[entity] = empty;
    const stored = this._read(entity);
    if (stored === "1") return true;
    if (stored === "0") return false;
    return mode === "auto" ? empty : !!mode;
  }
  _read(entity) {
    try {
      return localStorage.getItem(STORE + entity);
    } catch (err) {
      return null;
    }
  }
  _store(entity, value) {
    try {
      if (value === null) localStorage.removeItem(STORE + entity);
      else localStorage.setItem(STORE + entity, value);
    } catch (err) {
    }
  }
  // -------------------------------------------------------------------- drag
  _grip(laneEntity, item) {
    const handle = el("div", {
      class: "grip",
      title: "Drag to another list",
      onpointerdown: (ev) => this._onGripDown(ev, laneEntity, item)
    }, [icon("mdi:drag-horizontal-variant")]);
    return handle;
  }
  _onGripDown(ev, laneEntity, item) {
    if (ev.button !== void 0 && ev.button !== 0) return;
    ev.preventDefault();
    ev.stopPropagation();
    const row = ev.target.closest(".item");
    if (!row) return;
    this._suppressOpen = true;
    const block = row.parentNode.classList.contains("item-wrap") ? row.parentNode : row;
    const rect = row.getBoundingClientRect();
    const ghost = row.cloneNode(true);
    ghost.classList.add("ghost");
    ghost.style.width = `${rect.width}px`;
    this.shadowRoot.appendChild(ghost);
    this._drag = {
      from: laneEntity,
      item,
      row: block,
      ghost,
      dx: ev.clientX - rect.left,
      dy: ev.clientY - rect.top,
      placeholder: el("div", { class: "placeholder" }),
      target: null,
      point: { x: ev.clientX, y: ev.clientY },
      scrollers: this._scrollParents(),
      pointerId: ev.pointerId,
      capture: null
    };
    if (ev.pointerId !== void 0 && ev.target.setPointerCapture) {
      try {
        ev.target.setPointerCapture(ev.pointerId);
        this._drag.capture = ev.target;
      } catch (err) {
      }
    }
    block.classList.add("dragging");
    block.parentNode.insertBefore(this._drag.placeholder, block);
    this._positionGhost(ev.clientX, ev.clientY);
    document.addEventListener("pointermove", this._onDragMove, { passive: false });
    document.addEventListener("pointerup", this._onDragEnd);
    document.addEventListener("pointercancel", this._onDragEnd);
    this._scrollRaf = requestAnimationFrame(this._autoScroll);
  }
  /*
   * Every scrollable ancestor, innermost first — crossing shadow boundaries, since the
   * card sits several shadow roots deep inside a Home Assistant dashboard and the thing
   * that actually scrolls is one of them, not the window.
   */
  _scrollParents() {
    const out = [];
    let node = this;
    let guard = 0;
    while (node && guard++ < 100) {
      if (node.nodeType === 1 && node !== this) {
        let style = null;
        try {
          style = getComputedStyle(node);
        } catch (err) {
        }
        if (style && /(auto|scroll|overlay)/.test(style.overflowY) && node.scrollHeight > node.clientHeight + 1) {
          out.push(node);
        }
      }
      const root = node.getRootNode && node.getRootNode();
      node = node.parentElement || root && root.host || null;
    }
    const doc = document.scrollingElement || document.documentElement;
    if (doc && doc.scrollHeight > doc.clientHeight + 1) out.push(doc);
    return out;
  }
  /*
   * Hold the item near the top or bottom of the screen and the page follows. Without
   * this a phone cannot move an item into a lane that is off the bottom of the
   * viewport: the grip sets `touch-action: none` so the browser will not scroll for us,
   * and a finger held still fires no further pointermove events — hence the rAF loop,
   * which re-runs the drop calculation itself rather than waiting to be told.
   */
  _autoScroll() {
    this._scrollRaf = null;
    if (!this._drag) return;
    const { x, y } = this._drag.point;
    const height = window.innerHeight || document.documentElement.clientHeight || 0;
    const EDGE = 90;
    const SPEED = 24;
    let dy = 0;
    if (y < EDGE) dy = -SPEED * Math.min(1, (EDGE - y) / EDGE);
    else if (y > height - EDGE) dy = SPEED * Math.min(1, (y - (height - EDGE)) / EDGE);
    if (dy) {
      for (const node of this._drag.scrollers) {
        const before = node.scrollTop;
        node.scrollTop = before + dy;
        if (node.scrollTop !== before) break;
      }
      this._updateDrop(x, y);
    }
    this._scrollRaf = requestAnimationFrame(this._autoScroll);
  }
  _positionGhost(x, y) {
    const g = this._drag.ghost;
    g.style.left = `${x - this._drag.dx}px`;
    g.style.top = `${y - this._drag.dy}px`;
  }
  _onDragMove(ev) {
    if (!this._drag) return;
    ev.preventDefault();
    this._drag.point = { x: ev.clientX, y: ev.clientY };
    this._positionGhost(ev.clientX, ev.clientY);
    this._updateDrop(ev.clientX, ev.clientY);
  }
  // Where would the item land if it were dropped at (x, y)? Moves the placeholder and
  // records the answer on `_drag.target`. Called on pointer move and, while the pointer
  // is parked at a screen edge, on every autoscroll frame.
  _updateDrop(x, y) {
    const root = this.shadowRoot;
    const under = root.elementFromPoint ? root.elementFromPoint(x, y) : null;
    const laneEl = under && under.closest && under.closest("[data-lane]");
    if (!laneEl) return;
    const entity = laneEl.getAttribute("data-lane");
    if (laneEl.classList.contains("collapsed") || laneEl.classList.contains("gone")) {
      this._drag.target = { entity, beforeUid: null, append: true };
      if (this._drag.placeholder.parentNode) this._drag.placeholder.remove();
      laneEl.classList.add("drop-target");
      this._clearDropTargets(laneEl);
      return;
    }
    this._clearDropTargets(null);
    const list = laneEl.querySelector(".items");
    if (!list) return;
    const rows = [...list.children].filter(
      (n) => n.hasAttribute("data-uid") && !n.classList.contains("dragging")
    );
    let beforeRow = null;
    for (const r of rows) {
      const box = r.getBoundingClientRect();
      if (y < box.top + box.height / 2) {
        beforeRow = r;
        break;
      }
    }
    if (beforeRow) list.insertBefore(this._drag.placeholder, beforeRow);
    else list.appendChild(this._drag.placeholder);
    let prev = this._drag.placeholder.previousElementSibling;
    while (prev && !prev.hasAttribute("data-uid")) prev = prev.previousElementSibling;
    this._drag.target = {
      entity,
      beforeUid: prev ? prev.getAttribute("data-uid") : null,
      append: false
    };
  }
  _clearDropTargets(except) {
    this.shadowRoot.querySelectorAll(".lane.drop-target").forEach((l) => {
      if (l !== except) l.classList.remove("drop-target");
    });
  }
  async _onDragEnd() {
    const drag = this._drag;
    if (!drag) return;
    this._endDragListeners();
    drag.ghost.remove();
    if (drag.placeholder.parentNode) drag.placeholder.remove();
    drag.row.classList.remove("dragging");
    this._clearDropTargets(null);
    this._drag = null;
    clearTimeout(this._suppressTimer);
    this._suppressTimer = setTimeout(() => {
      this._suppressOpen = false;
    }, 80);
    const target = drag.target;
    if (target) {
      if (target.entity === drag.from) {
        const current = (this._items[drag.from] || []).map((i) => i.uid);
        const at = current.indexOf(drag.item.uid);
        const last = current.filter((uid) => uid !== drag.item.uid).slice(-1)[0] || null;
        const beforeUid = target.append ? last : target.beforeUid;
        const landsAfter = beforeUid ? current.indexOf(beforeUid) : -1;
        if (landsAfter !== at - 1) await this._reorder(drag.from, drag.item, beforeUid);
      } else {
        await this._moveBetween(
          drag.from,
          drag.item,
          target.entity,
          target.append ? void 0 : target.beforeUid
        );
      }
    }
    this._render();
  }
  _endDragListeners() {
    document.removeEventListener("pointermove", this._onDragMove);
    document.removeEventListener("pointerup", this._onDragEnd);
    document.removeEventListener("pointercancel", this._onDragEnd);
    if (this._scrollRaf !== null) {
      cancelAnimationFrame(this._scrollRaf);
      this._scrollRaf = null;
    }
    const drag = this._drag;
    if (drag && drag.capture && drag.pointerId !== void 0) {
      try {
        drag.capture.releasePointerCapture(drag.pointerId);
      } catch (err) {
      }
    }
  }
  // ------------------------------------------------------------------ render
  /*
   * The board is built once and then updated in place. It used to be torn down and
   * rebuilt on every push, which destroyed the "add an item" input along with
   * everything else — so the field lost focus after each add, and on a phone the
   * keyboard closed between every item. Keeping the lane elements alive means the
   * input is never recreated, and adding five things in a row is five keystrokes and
   * five taps of enter rather than a re-focus in between.
   */
  _render() {
    if (!this._config) return;
    if (this._drag) return;
    this._pending = false;
    const root = this.shadowRoot;
    const key = this._config.lanes.map((l) => l.entity).join("|");
    if (this._shellKey !== key) {
      while (root.firstChild) root.firstChild.remove();
      root.appendChild(el("style", { text: styles_default }));
      const title2 = el("h1", { class: "card-title" });
      const error2 = el("div", { class: "error" });
      const board2 = el("div", { class: "board" });
      const card = el("ha-card", {}, [title2, error2, board2]);
      root.appendChild(card);
      this._lanes = /* @__PURE__ */ new Map();
      for (const lane of this._config.lanes) {
        const node = this._buildLane(lane);
        this._lanes.set(lane.entity, node);
        board2.appendChild(node);
      }
      this._shell = { title: title2, error: error2, board: board2 };
      this._shellKey = key;
      this._detailKey = null;
    }
    const { title, error, board } = this._shell;
    title.textContent = this._config.title || "";
    title.hidden = !this._config.title;
    error.replaceChildren(
      ...this._error ? [icon("mdi:alert-circle-outline"), document.createTextNode(this._error)] : []
    );
    error.hidden = !this._error;
    board.style.setProperty("--lane-min", `${parseInt(this._config.min_lane_width, 10) || 270}px`);
    for (const lane of this._config.lanes) this._syncLane(this._lanes.get(lane.entity), lane);
    this._syncDetail();
    if (this._focus) {
      const [fkey, caret] = this._focus;
      const target = root.querySelector(`[data-focus="${fkey}"]`);
      if (target) {
        target.focus();
        if (caret !== null && caret !== void 0 && target.setSelectionRange) {
          try {
            target.setSelectionRange(caret, caret);
          } catch (err) {
          }
        }
      }
      this._focus = null;
    }
  }
  // The parts of a lane that never change. The add row is in here deliberately: it is
  // built once for the life of the card and `_syncLane` does not touch it.
  _buildLane(lane) {
    const entity = lane.entity;
    const laneEl = el("section", { class: "lane", "data-lane": entity });
    if (lane.color) laneEl.style.setProperty("--lane-accent", computeCssColor(lane.color));
    const head = el("header", {
      class: "lane-head",
      onclick: () => {
        this._store(entity, laneEl.classList.contains("collapsed") ? "0" : "1");
        this._render();
      }
    });
    const missing = el("div", { class: "missing" });
    const items = el("div", { class: "items" });
    const done = el("div", { class: "done-wrap" });
    laneEl.append(head, missing, items);
    if (!this._opt(lane, "hide_add")) laneEl.appendChild(this._renderAdd(entity));
    laneEl.appendChild(done);
    laneEl._parts = { head, missing, items, done };
    return laneEl;
  }
  // Everything that depends on the current items. Rebuilds the header, the item rows
  // and the completed section; never the add row.
  _syncLane(laneEl, lane) {
    const entity = lane.entity;
    const { head, missing, items, done } = laneEl._parts;
    const all = this._items[entity] || [];
    const open = all.filter((i) => i.status !== "completed");
    const doneItems = this._opt(lane, "hide_completed") ? [] : all.filter((i) => i.status === "completed");
    const stateObj = this._hass && this._hass.states[entity];
    const title = lane.title || stateObj && stateObj.attributes.friendly_name || entity;
    const collapsed = this._collapsed(lane, open.length);
    laneEl.classList.toggle("collapsed", collapsed);
    head.replaceChildren(
      icon(lane.icon || DEFAULT_ICON, "lane-icon"),
      el("span", { class: "lane-title", text: title }),
      open.length ? el("span", { class: "count", text: String(open.length) }) : icon("mdi:check", "count done"),
      icon(collapsed ? "mdi:chevron-down" : "mdi:chevron-up", "chev")
    );
    const gone = !!this._hass && !stateObj;
    laneEl.classList.toggle("gone", gone);
    missing.hidden = !gone;
    missing.textContent = gone ? `${entity} is not available` : "";
    if (gone) {
      items.replaceChildren();
      done.replaceChildren();
      return;
    }
    const rows = open.map((item) => this._renderItem(entity, item));
    if (!open.length && !doneItems.length) {
      rows.push(el("div", { class: "empty", text: "Nothing on this list" }));
    }
    items.replaceChildren(...rows);
    if (!doneItems.length) {
      done.replaceChildren();
      return;
    }
    const showing = !!this._showDone[entity];
    const parts = [
      el("div", { class: "done-head" }, [
        el("button", {
          class: "link",
          onclick: () => {
            this._showDone[entity] = !showing;
            this._render();
          }
        }, [icon(showing ? "mdi:chevron-up" : "mdi:chevron-down"), `${doneItems.length} done`]),
        el("button", {
          class: "link danger",
          text: "Clear",
          onclick: () => this._call("remove_completed_items", { entity_id: entity })
        })
      ])
    ];
    if (showing) {
      parts.push(el(
        "div",
        { class: "items done-items" },
        doneItems.map((item) => this._renderItem(entity, item))
      ));
    }
    done.replaceChildren(...parts);
  }
  _renderItem(entity, item) {
    const row = el("div", {
      class: `item${item.status === "completed" ? " completed" : ""}`,
      "data-uid": item.uid
    });
    const box = el("input", {
      type: "checkbox",
      class: "check",
      checked: item.status === "completed",
      onclick: (ev) => {
        ev.stopPropagation();
        this._toggle(entity, item);
      }
    });
    const due = dueLabel(item.due);
    const lane = (this._config.lanes || []).find((l) => l.entity === entity) || {};
    const palette = this._config.tags || {};
    const known = this._knownTags();
    const label = el("div", { class: "label" });
    const paint = (summary) => {
      const shown = this._opt(lane, "enable_tags") ? splitTags(summary) : { text: summary, tags: [] };
      const preview = plainPreview(item.description);
      label.replaceChildren(
        el("div", { class: "summary-line" }, [
          el("span", { class: "summary", text: shown.text }),
          // A tag with no colour configured still shows, in a neutral chip — tagging
          // something should not require a trip to the editor first.
          ...shown.tags.map((tag) => {
            const chip = el("span", { class: "tag", text: tag });
            chip.style.setProperty("--tag-color", tagColor(tag, palette, known));
            return chip;
          }),
          ...due ? [el("span", { class: `due ${due.state}`, text: due.text })] : []
        ]),
        ...preview ? [this._descPreview(preview)] : []
      );
    };
    paint(item.summary);
    row._paint = paint;
    row.addEventListener("pointerdown", (ev) => {
      if (ev.target.closest && ev.target.closest(".grip, .check")) return;
      row._press = { x: ev.clientX, y: ev.clientY };
    });
    row.addEventListener("click", (ev) => {
      if (this._drag || this._suppressOpen) return;
      const target = ev.target;
      if (target.closest && target.closest(".check, .grip, button, a, input, textarea")) return;
      if (row._press) {
        const dx = Math.abs((ev.clientX || 0) - row._press.x);
        const dy = Math.abs((ev.clientY || 0) - row._press.y);
        if (dx > 8 || dy > 8) return;
      }
      this._openDetail(entity, item);
    });
    row.appendChild(box);
    row.appendChild(label);
    if (item.status !== "completed") row.appendChild(this._grip(entity, item));
    return row;
  }
  _descPreview(text) {
    return el("div", { class: "desc-preview", title: text }, [
      icon("mdi:text", "note"),
      el("span", { class: "desc-text", text })
    ]);
  }
  _openDetail(entity, item) {
    if (this._drag || this._suppressOpen) return;
    if (this._detail && this._detail.entity === entity && this._detail.uid === item.uid) return;
    this._detail = { entity, uid: item.uid, mode: "view" };
    this._render();
  }
  _closeDetail() {
    if (!this._detail) return;
    const revert = this._detailRevert;
    this._detailRevert = null;
    this._detail = null;
    if (revert) revert();
    this._render();
  }
  /*
   * The detail dialog lives in the top layer (`<dialog>.showModal`), so a dashboard
   * section that clips overflow cannot chop it off, and Escape / the backdrop belong
   * to the browser. It is not inside a lane: lane renders replace their rows, and the
   * dialog has to survive that.
   */
  _syncDetail() {
    const root = this.shadowRoot;
    const existing = root.querySelector("dialog.detail");
    if (!this._detail) {
      this._detailKey = null;
      this._detailRevert = null;
      this._removeDialog(existing);
      return;
    }
    const { entity, uid, mode } = this._detail;
    const item = (this._items[entity] || []).find((i) => i.uid === uid);
    if (!item) {
      this._detail = null;
      this._detailKey = null;
      this._detailRevert = null;
      this._removeDialog(existing);
      return;
    }
    const key = `${entity}|${uid}|${mode}`;
    if (existing && this._detailKey === key) return;
    this._removeDialog(existing);
    const dialog = mode === "edit" ? this._buildEditorDialog(entity, item) : this._buildViewDialog(entity, item);
    root.appendChild(dialog);
    this._presentDialog(dialog);
    this._detailKey = key;
  }
  _removeDialog(dialog) {
    if (!dialog) return;
    try {
      if (dialog.open && dialog.close) dialog.close();
    } catch (err) {
    }
    dialog.remove();
  }
  _presentDialog(dialog) {
    if (typeof dialog.showModal === "function") {
      try {
        dialog.showModal();
        return;
      } catch (err) {
      }
    }
    dialog.setAttribute("open", "");
  }
  _dialogChrome(entity, item, mode, body, footer) {
    const lane = (this._config.lanes || []).find((l) => l.entity === entity) || {};
    const heading = mode === "edit" ? el("span", { class: "detail-kicker", tabindex: "-1", text: "Edit item" }) : el("h2", { class: "detail-title", id: "item-detail-title", tabindex: "-1", text: item.summary });
    heading.setAttribute("autofocus", "");
    const dialog = el("dialog", {
      class: `detail${mode === "edit" ? " editing" : ""}`,
      "aria-label": item.summary
    }, [
      el("header", { class: "detail-head" }, [
        heading,
        el("button", {
          type: "button",
          class: "detail-close",
          title: "Close",
          "aria-label": "Close",
          onclick: () => this._closeDetail()
        }, [icon("mdi:close")])
      ]),
      body,
      footer
    ]);
    dialog.style.setProperty(
      "--lane-accent",
      lane.color ? computeCssColor(lane.color) : "var(--primary-color)"
    );
    dialog.addEventListener("click", (ev) => {
      if (ev.target === dialog) this._closeDetail();
    });
    dialog.addEventListener("cancel", (ev) => {
      ev.preventDefault();
      this._closeDetail();
    });
    dialog.addEventListener("keydown", (ev) => {
      if (ev.key !== "Escape") return;
      ev.preventDefault();
      ev.stopPropagation();
      this._closeDetail();
    });
    return dialog;
  }
  _buildViewDialog(entity, item) {
    const due = dueLabel(item.due);
    const md = el("div", { class: "md" });
    if (item.description && String(item.description).trim()) mountMarkdown(md, item.description);
    else md.appendChild(el("p", { class: "detail-empty", text: "No description" }));
    const body = el("div", { class: "detail-body" }, [
      due ? el("p", {
        class: `detail-meta due ${due.state}`,
        title: String(item.due).slice(0, 10)
      }, [icon("mdi:calendar", "meta-icon"), due.text]) : el("p", { class: "detail-meta none", text: "No due date" }),
      md
    ]);
    const footer = el("footer", { class: "actions detail-actions" }, [
      el("button", {
        type: "button",
        class: "chip danger",
        onclick: () => {
          this._detailRevert = null;
          this._detail = null;
          this._remove(entity, item);
          this._render();
        }
      }, [icon("mdi:delete-outline"), "Delete"]),
      el("span", { class: "spacer" }),
      el("button", {
        type: "button",
        class: "chip primary",
        "data-action": "edit",
        text: "Edit",
        onclick: () => {
          this._detail = { entity, uid: item.uid, mode: "edit" };
          this._render();
        }
      })
    ]);
    return this._dialogChrome(entity, item, "view", body, footer);
  }
  _buildEditorDialog(entity, item) {
    const row = this.shadowRoot.querySelector(
      `[data-lane="${cssAttr(entity)}"] .item[data-uid="${cssAttr(item.uid)}"]`
    );
    const preview = row && row._paint || (() => {
    });
    const editor = this._renderEditor(entity, item, preview);
    return this._dialogChrome(entity, item, "edit", editor, null);
  }
  _renderEditor(entity, item, preview) {
    const key = `edit.${item.uid}`;
    const name = el("input", {
      type: "text",
      class: "field",
      value: item.summary,
      placeholder: "Title",
      "aria-label": "Title",
      "data-focus": `${key}.name`,
      // Typing shows on the item as you go, the same as toggling a chip does.
      oninput: (ev) => preview(ev.target.value),
      onkeydown: (ev) => {
        if (ev.key === "Enter") {
          ev.preventDefault();
          save();
        }
        if (ev.key === "Escape") {
          ev.preventDefault();
          ev.stopPropagation();
          this._closeDetail();
        }
      }
    });
    const dueInput = el("input", {
      type: "date",
      class: "field",
      value: item.due ? String(item.due).slice(0, 10) : "",
      "aria-label": "Due date",
      "data-focus": `${key}.due`
    });
    const desc = el("textarea", {
      class: "field desc",
      rows: 10,
      placeholder: "Description — markdown is fine",
      "aria-label": "Description",
      "data-focus": `${key}.desc`
    });
    desc.value = item.description || "";
    const grow = () => {
      desc.style.height = "auto";
      const min = 220;
      desc.style.height = `${Math.max(desc.scrollHeight, min)}px`;
    };
    desc.addEventListener("input", grow);
    queueMicrotask(grow);
    this._detailRevert = () => preview(item.summary);
    const cancel = () => {
      const revert = this._detailRevert;
      this._detailRevert = null;
      if (revert) revert();
      this._detail = { entity, uid: item.uid, mode: "view" };
      this._render();
    };
    const save = async () => {
      try {
        await this._save(entity, item, {
          summary: name.value.trim() || item.summary,
          due: dueInput.value,
          description: desc.value
        });
      } catch (err) {
        return;
      }
      this._detailRevert = null;
      this._detail = null;
      this._render();
    };
    const remove = () => {
      this._detailRevert = null;
      this._detail = null;
      this._remove(entity, item);
      this._render();
    };
    const others = this._config.lanes.filter((l) => l.entity !== entity);
    const known = this._opt(
      (this._config.lanes || []).find((l) => l.entity === entity) || {},
      "enable_tags"
    ) ? this._knownTags() : [];
    return el("div", { class: "editor" }, [
      el("div", { class: "fields" }, [
        el("label", { class: "field-label", text: "Title" }),
        name,
        el("label", { class: "field-label", text: "Due date" }),
        dueInput,
        el("label", { class: "field-label", text: "Description" }),
        desc,
        known.length ? el("div", { class: "moveto" }, [
          el("span", { class: "moveto-label", text: "Tags" }),
          ...known.map((tag) => this._tagChip(tag, name, (value) => preview(value)))
        ]) : null,
        others.length ? el("div", { class: "moveto" }, [
          el("span", { class: "moveto-label", text: "Move to" }),
          ...others.map(
            (l) => el("button", {
              type: "button",
              class: "chip",
              onclick: async () => {
                this._detailRevert = null;
                this._detail = null;
                await this._moveBetween(entity, item, l.entity, void 0);
                this._render();
              }
            }, [
              icon(l.icon || DEFAULT_ICON),
              l.title || this._hass.states[l.entity] && this._hass.states[l.entity].attributes.friendly_name || l.entity
            ])
          )
        ]) : null
      ]),
      el("div", { class: "actions" }, [
        el(
          "button",
          { type: "button", class: "chip danger", onclick: remove },
          [icon("mdi:delete-outline"), "Delete"]
        ),
        el("span", { class: "spacer" }),
        el("button", { type: "button", class: "chip", text: "Cancel", onclick: cancel }),
        el("button", { type: "button", class: "chip primary", text: "Save", onclick: save })
      ])
    ]);
  }
  /*
   * Every tag currently in play: the ones given a colour, plus the ones actually
   * written on items. The card already subscribes to every lane, so this costs nothing
   * — no extra round trip to offer suggestions.
   */
  _knownTags() {
    const found = new Set(Object.keys(this._config.tags || {}));
    for (const items of Object.values(this._items)) {
      for (const item of items || []) {
        for (const tag of splitTags(item.summary).tags) found.add(tag);
      }
    }
    return [...found].sort((a, b) => a.localeCompare(b));
  }
  // A chip that puts a tag into, or takes it out of, a text field.
  /*
   * A chip that puts a tag into, or takes it out of, a text field.
   *
   * It wears the tag's own colour when it is on and a muted version of it when it is
   * off, rather than the lane's accent — the point of the row is to show what the tags
   * look like. A tag whose colour happens to be grey is then harder to read as on or
   * off, which is the price of every other tag being obvious.
   */
  _tagChip(tag, field, onChange) {
    const chip = el("button", {
      class: "chip tag-chip",
      // Never take focus: on a phone that closes the keyboard mid-edit.
      onmousedown: (ev) => ev.preventDefault(),
      onclick: () => {
        field.value = toggleTag(field.value, tag);
        chip.classList.toggle("on", splitTags(field.value).tags.includes(tag));
        if (onChange) onChange(field.value);
        field.focus();
      }
    }, [tag]);
    chip.style.setProperty("--tag-color", tagColor(tag, this._config.tags || {}, this._knownTags()));
    if (splitTags(field.value).tags.includes(tag)) chip.classList.add("on");
    return chip;
  }
  _renderAdd(entity) {
    const key = `add.${entity}`;
    const lane = (this._config.lanes || []).find((l) => l.entity === entity) || {};
    const input = el("input", {
      type: "text",
      class: "field",
      placeholder: "Add an item",
      value: this._drafts[entity] || "",
      "data-focus": key,
      oninput: (ev) => {
        this._drafts[entity] = ev.target.value;
        refresh();
      },
      onkeyup: () => refresh(),
      onclick: () => refresh(),
      onkeydown: (ev) => {
        if (ev.key === "Enter") {
          submit();
          return;
        }
        if (ev.key === "Tab" && !suggest.hidden) {
          const first = suggest.querySelector(".tag-chip");
          if (first) {
            ev.preventDefault();
            first.click();
          }
        }
      }
    });
    const submit = async () => {
      const text = input.value;
      if (!text.trim()) return;
      this._drafts[entity] = "";
      input.value = "";
      this._focus = [key, 0];
      await this._add(entity, text);
    };
    const suggest = el("div", { class: "tag-suggest", hidden: true });
    let pinned = false;
    const token = () => tagTokenAt(input.value, input.selectionStart);
    const complete = (tag) => {
      const { from, to } = token();
      const before = input.value.slice(0, from);
      const after = input.value.slice(to);
      const written = formatTag(tag);
      input.value = `${before}${written}${after.startsWith(" ") ? "" : " "}${after}`;
      const caret = (before + written + " ").length;
      input.setSelectionRange(caret, caret);
      this._drafts[entity] = input.value;
      input.focus();
      refresh();
    };
    const refresh = () => {
      if (!this._opt(lane, "enable_tags")) return;
      const known = this._knownTags();
      const { query } = token();
      if (query !== null) {
        const needle = query.toLowerCase();
        const already = splitTags(input.value).tags;
        const matches = known.filter(
          (t) => t.toLowerCase().startsWith(needle) && (t.toLowerCase() !== needle || !already.includes(t))
        );
        suggest.replaceChildren(...matches.map((tag) => {
          const chip = el("button", {
            class: "chip tag-chip",
            onmousedown: (ev) => ev.preventDefault(),
            onclick: () => complete(tag)
          }, [tag]);
          return chip;
        }));
        suggest.hidden = matches.length === 0;
        return;
      }
      if (!pinned) {
        suggest.hidden = true;
        return;
      }
      suggest.replaceChildren(
        ...known.length ? known.map((tag) => this._tagChip(tag, input, (v) => {
          this._drafts[entity] = v;
        })) : [el("span", { class: "no-tags", text: "No tags yet — type #something into an item" })]
      );
      suggest.hidden = false;
    };
    const tagButton = el("button", {
      class: "tag-btn",
      title: "Tags",
      onmousedown: (ev) => ev.preventDefault(),
      onclick: () => {
        pinned = !pinned;
        refresh();
        input.focus();
      }
    }, [icon("mdi:pound")]);
    return el("div", { class: "add" }, [
      el("div", { class: "add-row" }, [
        input,
        this._opt(lane, "enable_tags") ? tagButton : null,
        el("button", {
          class: "icon-btn",
          title: "Add",
          // Stops the tap moving focus off the input, so the caret stays put and a phone
          // keyboard does not close between items. Programmatically re-focusing after the
          // fact does not reopen a mobile keyboard, so it has to never leave.
          onmousedown: (ev) => ev.preventDefault(),
          onclick: submit
        }, [icon("mdi:plus")])
      ]),
      suggest
    ]);
  }
};

// src/editor-styles.css
var editor_styles_default = "/* Styles for the visual editor. Bundled into the card at build time. */\n:host { display: flex; flex-direction: column; gap: 16px; }\n.section-title {\n  margin: 4px 0 -8px; font-size: 15px; font-weight: 500;\n  color: var(--primary-text-color);\n}\n.lane-row {\n  display: flex; align-items: flex-start; gap: 8px;\n  padding: 12px; border-radius: 12px;\n  border: 1px solid var(--divider-color); background: var(--card-background-color);\n}\n.lane-row ha-form { flex: 1; min-width: 0; }\n.lane-tools { display: flex; flex-direction: column; gap: 2px; padding-top: 4px; }\n.tool {\n  display: grid; place-items: center; width: 32px; height: 32px;\n  border: none; border-radius: 8px; cursor: pointer;\n  background: transparent; color: var(--secondary-text-color);\n}\n.tool:hover:not([disabled]) { background: rgba(127,127,127,.14); color: var(--primary-text-color); }\n.tool[disabled] { opacity: .35; cursor: default; }\n.tool ha-icon { --mdc-icon-size: 20px; }\n.add-row { padding: 0 12px; }\n.hint { margin: 0; color: var(--secondary-text-color); font-size: 12px; line-height: 1.5; }\n\n.tag-row { align-items: center; }\n.tag-row ha-form { flex: 1; }\n.tag-preview {\n  flex: 0 0 auto; max-width: 34%; padding: 2px 10px; border-radius: 10px;\n  font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\n  color: var(--tag-color, var(--secondary-text-color));\n  border: 1px solid currentColor;\n}\n.auto-note {\n  flex: none; width: 32px; text-align: center;\n  font-size: 11px; color: var(--secondary-text-color);\n}\n.tag-row-end { flex: none; display: grid; place-items: center; min-width: 32px; }\n";

// src/editor.js
var EDITOR_LABELS = {
  title: "Title",
  default_collapsed: "Folding",
  hide_completed: "Hide completed",
  hide_add: "Hide the add box",
  enable_tags: "Treat #words in an item as tags",
  min_lane_width: "Minimum list width",
  entity: "List",
  icon: "Icon",
  color: "Colour",
  add: "Add a list",
  tag: "Tag"
};
var CARD_SCHEMA = [
  { name: "title", selector: { text: {} } },
  {
    name: "default_collapsed",
    selector: {
      select: {
        mode: "dropdown",
        options: [
          { value: "auto", label: "Automatic — fold a list when it is empty" },
          { value: "false", label: "Always open" },
          { value: "true", label: "Always folded" }
        ]
      }
    }
  },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "hide_completed", selector: { boolean: {} } },
      { name: "hide_add", selector: { boolean: {} } }
    ]
  },
  {
    name: "min_lane_width",
    selector: { number: { min: 120, max: 600, step: 10, mode: "box", unit_of_measurement: "px" } }
  }
];
var LANE_SCHEMA = [
  { name: "entity", required: true, selector: { entity: { domain: "todo" } } },
  {
    name: "",
    type: "grid",
    schema: [
      { name: "title", selector: { text: {} } },
      { name: "icon", selector: { icon: {} } }
    ]
  },
  { name: "color", selector: { ui_color: { include_none: true, default_color: "none" } } }
];
var ADD_SCHEMA = [{ name: "add", selector: { entity: { domain: "todo" } } }];
var tagSchema = [
  { name: "color", selector: { ui_color: { include_none: true, default_color: "none" } } }
];
var TodoKanbanCardEditor = class extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = { lanes: [] };
    this._built = false;
    this._known = [];
    this._seen = {};
    this._subs = [];
  }
  disconnectedCallback() {
    this._unsubscribe();
  }
  /*
   * Watch the configured lists, so a tag typed into an item while this dialog is open
   * turns up here without reopening it. `todo/item/subscribe` pushes the current items
   * immediately as well as on every change, so this covers the first load too.
   */
  _subscribe() {
    this._unsubscribe();
    if (!this._hass || !this._config) return;
    for (const lane of this._config.lanes || []) {
      const p = this._hass.connection.subscribeMessage(
        (msg) => {
          this._seen[lane.entity] = msg && msg.items || [];
          this._refreshKnown();
        },
        { type: "todo/item/subscribe", entity_id: lane.entity }
      );
      p.catch(() => {
      });
      this._subs.push(p);
    }
  }
  _unsubscribe() {
    for (const p of this._subs) p.then((unsub) => unsub && unsub()).catch(() => {
    });
    this._subs = [];
  }
  _refreshKnown() {
    const found = new Set(Object.keys(this._config.tags || {}));
    for (const items of Object.values(this._seen)) {
      for (const item of items || []) {
        for (const tag of splitTags(item.summary).tags) found.add(tag);
      }
    }
    const known = [...found].sort((a, b) => a.localeCompare(b));
    if (known.join("\0") === this._known.join("\0")) return;
    this._known = known;
    this._built = false;
    this._render();
  }
  setConfig(config) {
    this._config = { ...config, lanes: [...config && config.lanes || []] };
    this._render();
    this._subscribe();
  }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this._render();
    if (first) this._subscribe();
  }
  get hass() {
    return this._hass;
  }
  _emit(config) {
    this._config = config;
    this._render();
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config },
      bubbles: true,
      composed: true
    }));
  }
  // `select` hands back strings, and `default_collapsed` is auto | true | false.
  _cardData() {
    const c = this._config;
    return {
      title: c.title ?? "",
      default_collapsed: String(c.default_collapsed ?? "auto"),
      hide_completed: !!c.hide_completed,
      hide_add: !!c.hide_add,
      min_lane_width: c.min_lane_width ?? 270
    };
  }
  _cardChanged(ev) {
    ev.stopPropagation();
    const v = ev.detail.value;
    const next = { ...this._config };
    if (v.title) next.title = v.title;
    else delete next.title;
    const fold = v.default_collapsed;
    if (fold === "auto" || fold === void 0) delete next.default_collapsed;
    else next.default_collapsed = fold === "true";
    if (v.hide_completed) next.hide_completed = true;
    else delete next.hide_completed;
    if (v.hide_add) next.hide_add = true;
    else delete next.hide_add;
    const width = Number(v.min_lane_width);
    if (width && width !== 270) next.min_lane_width = width;
    else delete next.min_lane_width;
    this._emit(next);
  }
  _laneChanged(index, ev) {
    ev.stopPropagation();
    const v = ev.detail.value;
    if (!v.entity) return;
    const lane = { ...this._config.lanes[index], entity: v.entity };
    for (const key of ["title", "icon", "color"]) {
      if (v[key]) lane[key] = v[key];
      else delete lane[key];
    }
    const lanes = [...this._config.lanes];
    lanes[index] = lane;
    this._emit({ ...this._config, lanes });
  }
  // The config carries `tags` as a map, which is the readable thing in YAML; the editor
  // needs an ordered list to render rows from, so it converts in both directions.
  /*
   * A row for every tag in play — the ones given a colour and the ones merely written
   * on an item — so a tag invented while adding a task can be recoloured here without
   * having to be picked out of a dropdown first. An uncoloured tag shows the colour it
   * is being drawn in, and only becomes configuration once it is changed.
   */
  _tagRows() {
    const configured = this._config.tags || {};
    return this._known.map((tag) => ({
      tag,
      color: configured[tag] || "",
      automatic: !configured[tag]
    }));
  }
  _emitTags(rows) {
    const next = { ...this._config };
    const tags = {};
    for (const row of rows) {
      if (!row.tag || !row.color) continue;
      tags[row.tag] = row.color;
    }
    if (Object.keys(tags).length) next.tags = tags;
    else delete next.tags;
    this._emit(next);
  }
  _tagChanged(tag, ev) {
    ev.stopPropagation();
    const rows = this._tagRows().map((row) => row.tag === tag ? { ...row, color: ev.detail.value.color || "" } : row);
    this._emitTags(rows);
  }
  // "auto" while the colour is the card's choice, a reset button once it is yours.
  _tagRowEnd(row) {
    return row.automatic ? el("span", { class: "auto-note", title: "Chosen automatically", text: "auto" }) : this._button(
      "mdi:backup-restore",
      "Back to the automatic colour",
      () => this._resetTag(row.tag)
    );
  }
  // Back to the colour the card picks for it. The tag itself lives in the item text,
  // so there is nothing here to delete.
  _resetTag(tag) {
    this._emitTags(this._tagRows().map((row) => row.tag === tag ? { ...row, color: "" } : row));
  }
  _addLane(ev) {
    ev.stopPropagation();
    const entity = ev.detail.value && ev.detail.value.add;
    if (!entity) return;
    this._emit({ ...this._config, lanes: [...this._config.lanes, { entity }] });
  }
  _removeLane(index) {
    if (this._config.lanes.length <= 1) return;
    const lanes = this._config.lanes.filter((_, i) => i !== index);
    this._emit({ ...this._config, lanes });
  }
  _moveLane(index, delta) {
    const to = index + delta;
    const lanes = [...this._config.lanes];
    if (to < 0 || to >= lanes.length) return;
    [lanes[index], lanes[to]] = [lanes[to], lanes[index]];
    this._emit({ ...this._config, lanes });
  }
  _form(schema, data, onChange) {
    const form = document.createElement("ha-form");
    form.schema = schema;
    form.computeLabel = (field) => EDITOR_LABELS[field.name] || field.name;
    form.addEventListener("value-changed", onChange);
    form.hass = this._hass;
    form.data = data;
    return form;
  }
  _button(icon2, label, onClick, disabled) {
    const b = el(
      "button",
      { class: "tool", title: label, "aria-label": label, onclick: onClick },
      [el("ha-icon", { icon: icon2 })]
    );
    if (disabled) b.setAttribute("disabled", "");
    return b;
  }
  _render() {
    if (!this._hass || !this._config) return;
    const lanes = this._config.lanes || [];
    const tagRows = this._tagRows();
    if (this._built && this._laneCount === lanes.length && this._tagCount === tagRows.length) {
      this._cardForm.hass = this._hass;
      this._cardForm.data = this._cardData();
      this._laneForms.forEach((form, i) => {
        form.hass = this._hass;
        form.data = { ...lanes[i] };
      });
      this._addForm.hass = this._hass;
      this._tagForms.forEach((form, i) => {
        form.hass = this._hass;
        form.data = { color: tagRows[i].color };
      });
      this._tagPreviews.forEach((preview, i) => {
        preview.style.setProperty(
          "--tag-color",
          tagColor(tagRows[i].tag, this._config.tags || {}, this._known)
        );
        preview.classList.toggle("automatic", tagRows[i].automatic);
      });
      this._tagEnds.forEach((end, i) => end.replaceChildren(this._tagRowEnd(tagRows[i])));
      if (this._tagsForm) {
        this._tagsForm.hass = this._hass;
        this._tagsForm.data = { enable_tags: !!this._config.enable_tags };
      }
      return;
    }
    const root = this.shadowRoot;
    while (root.firstChild) root.firstChild.remove();
    root.appendChild(el("style", { text: editor_styles_default }));
    this._cardForm = this._form(CARD_SCHEMA, this._cardData(), (ev) => this._cardChanged(ev));
    root.appendChild(this._cardForm);
    root.appendChild(el("h3", { class: "section-title", text: "Lists" }));
    this._laneForms = [];
    lanes.forEach((lane, i) => {
      const form = this._form(LANE_SCHEMA, { ...lane }, (ev) => this._laneChanged(i, ev));
      this._laneForms.push(form);
      root.appendChild(el("div", { class: "lane-row" }, [
        el("div", { class: "lane-tools" }, [
          this._button("mdi:arrow-up", "Move up", () => this._moveLane(i, -1), i === 0),
          this._button("mdi:arrow-down", "Move down", () => this._moveLane(i, 1), i === lanes.length - 1),
          this._button(
            "mdi:delete-outline",
            "Remove this list",
            () => this._removeLane(i),
            lanes.length <= 1
          )
        ]),
        form
      ]));
    });
    this._addForm = this._form(ADD_SCHEMA, { add: "" }, (ev) => this._addLane(ev));
    root.appendChild(el("div", { class: "add-row" }, [this._addForm]));
    root.appendChild(el("h3", { class: "section-title", text: "Tags" }));
    root.appendChild(el("p", { class: "hint", text: "Off by default, since a “#” in an item may well be there for another reason. Switched on, “Milk #dairy” shows as Milk with a chip, and the add box suggests tags you have already used." }));
    this._tagsForm = this._form(
      [{ name: "enable_tags", selector: { boolean: {} } }],
      { enable_tags: !!this._config.enable_tags },
      (ev) => {
        ev.stopPropagation();
        const next = { ...this._config };
        if (ev.detail.value.enable_tags) next.enable_tags = true;
        else delete next.enable_tags;
        this._emit(next);
      }
    );
    root.appendChild(this._tagsForm);
    this._tagForms = [];
    this._tagPreviews = [];
    this._tagEnds = [];
    if (!tagRows.length) {
      root.appendChild(el("p", { class: "hint", text: "No tags yet. Write one into an item — “Milk #dairy” — and it will appear here to colour." }));
    }
    tagRows.forEach((row) => {
      const form = this._form(tagSchema, { color: row.color }, (ev) => this._tagChanged(row.tag, ev));
      this._tagForms.push(form);
      const preview = el("span", { class: "tag-preview", text: row.tag });
      preview.style.setProperty("--tag-color", tagColor(row.tag, this._config.tags || {}, this._known));
      if (row.automatic) preview.classList.add("automatic");
      this._tagPreviews.push(preview);
      const end = el("span", { class: "tag-row-end" }, [this._tagRowEnd(row)]);
      this._tagEnds.push(end);
      root.appendChild(el("div", { class: "lane-row tag-row" }, [
        preview,
        form,
        end
      ]));
    });
    root.appendChild(el("p", { class: "hint", text: "Per-list overrides for folding, the add box and completed items are available in YAML, and are left alone by this editor." }));
    this._built = true;
    this._laneCount = lanes.length;
    this._tagCount = tagRows.length;
  }
};

// src/version.js
var VERSION = "1.4.0";

// src/index.js
var CARD = "todo-kanban-card-plus";
var EDITOR = "todo-kanban-card-plus-editor";
if (!customElements.get(EDITOR)) {
  customElements.define(EDITOR, TodoKanbanCardEditor);
}
if (!customElements.get(CARD)) {
  customElements.define(CARD, TodoKanbanCard);
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: CARD,
  name: "Todo Kanban Card Plus",
  description: "Several todo lists side by side, drag-and-drop between them, and a markdown detail view."
});
console.info(
  `%c TODO-KANBAN-CARD-PLUS %c ${VERSION} `,
  "color:white;background:#3f51b5;font-weight:700",
  "color:#3f51b5;background:white"
);
