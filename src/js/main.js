import { loadHeaderFooter, loadBooks, loadNumberOfChapters } from "./utils.mjs";

const booksElement = document.getElementById("books");
const chaptersElement = document.getElementById("chapters");

// Change number of chapters when book changes
booksElement.addEventListener("change", () => {
  chaptersElement.innerHTML = "";
  loadNumberOfChapters();
});



loadHeaderFooter();
loadBooks();
loadNumberOfChapters();