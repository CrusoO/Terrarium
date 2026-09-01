const TITLE = {{TITLE_JSON}};
document.title = TITLE;
const board = document.getElementById("board");
if (board && !board.children.length) {
  for (let i = 0; i < 9; i += 1) {
    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "cell";
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", `Cell ${i + 1}`);
    board.append(cell);
  }
}
