import { getBooks, getVerse } from "./api.mjs";

const books = await getBooks();

export async function loadTemplate(path){
  const file = await fetch(path);
  const result = await file.text();
  return result;
}

export function renderWithTemplate(template, parentElement) {
  parentElement.innerHTML = template;
}

export async function loadHeaderFooter(){
  const headerContent = await loadTemplate('../partials/header.html');
  const footerContent = await loadTemplate('../partials/footer.html');

  const header = document.getElementById('main-header');
  const footer = document.getElementById('main-footer');

  renderWithTemplate(headerContent, header);
  renderWithTemplate(footerContent, footer);
}

export async function loadBooks(){
  const booksElement = document.getElementById("books");

  books.forEach(book => {
    const bookElement = document.createElement("option");
    bookElement.value = book.id;
    bookElement.textContent = book.id;

    booksElement.appendChild(bookElement);
  })
}

export async function loadNumberOfChapters(){
  const booksElement = document.getElementById("books");

  if(booksElement.value){
    const book = books.filter((book) => book.id == booksElement.value)[0];
    const chaptersElement = document.getElementById("chapters");

    for(let i = 0; i < book.numberOfChapters; i++){
      const chapterElement = document.createElement("option");
      chapterElement.value = i + 1;
      chapterElement.textContent = i + 1;

      chaptersElement.appendChild(chapterElement);
    }
  }
}

await getVerse("GEN", 1, 1);