/*
 * todo-kanban-card-plus — a kanban board over Home Assistant `todo` entities.
 *
 * Fork of Todo Kanban Card by Dennis de Best (MIT):
 * https://github.com/DennisdeBest/HaTodoKanbanCard
 *
 * Home Assistant can show you a todo list. It cannot move an item from one list to
 * another: the core todo-list card has no such control, and there is no service for it
 * either. This card adds that, and arranges any number of lists as lanes you can drag
 * between — shopping split by urgency, chores by room, a project backlog as
 * Backlog / Doing / Done, a meal plan by day.
 *
 * A move is add-on-the-target followed by remove-from-the-source, run in that order so
 * a failure between the two duplicates an item rather than losing it.
 *
 * Tapping an item opens a detail dialog. The description is rendered as markdown
 * (Home Assistant's `<ha-markdown>` when the dashboard provides it, otherwise a small
 * sanitized renderer in this file). Edit is a separate step, with a real description
 * field instead of a two-line textarea.
 *
 * Items arrive over `todo/item/subscribe`, one subscription per lane, so the board
 * follows changes made anywhere — this card, the companion app, another tablet, an
 * automation.
 *
 * MIT licensed. See README.md for the full config reference and more examples.
 */

import { TodoKanbanCard } from "./card.js";
import { TodoKanbanCardEditor } from "./editor.js";
import { VERSION } from "./version.js";

const CARD = "todo-kanban-card-plus";
const EDITOR = "todo-kanban-card-plus-editor";

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
  description: "Several todo lists side by side, drag-and-drop between them, and a markdown detail view.",
});

console.info(`%c TODO-KANBAN-CARD-PLUS %c ${VERSION} `,
  "color:white;background:#3f51b5;font-weight:700",
  "color:#3f51b5;background:white");
