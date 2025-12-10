import { getBooks, getChapterVerses, getVerse } from "./api.mjs";

const books = await getBooks();

// Function to get URL params
export function getParams() {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return {
    book: urlParams.get('book'),
    chapter: urlParams.get('chapter'),
    verse: urlParams.get('verse')
  };
}

// Function to set URL params without reloading
export function setParams(book, chapter, verse) {
  const url = new URL(window.location);
  url.searchParams.set('book', book);
  url.searchParams.set('chapter', chapter);
  url.searchParams.set('verse', verse);
  window.history.pushState({}, '', url);
}

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

export async function loadBooks() {
  const booksElement = document.getElementById("books");
  // Clear existing options first to avoid duplicates
  booksElement.innerHTML = ""; 
  
  books.forEach(book => {
    const bookElement = document.createElement("option");
    bookElement.value = book.id;
    bookElement.textContent = book.id;
    booksElement.appendChild(bookElement);
  });
}

// Updated to accept optional chapter count if we already know it
export async function loadNumberOfChapters(selectedBookId) {
  const booksElement = document.getElementById("books");
  const bookId = selectedBookId || booksElement.value;

  if (bookId) {
    const book = books.find((b) => b.id === bookId);
    const chaptersElement = document.getElementById("chapters");
    chaptersElement.innerHTML = ""; // Clear old chapters

    if (book) {
      for (let i = 0; i < book.numberOfChapters; i++) {
        const chapterElement = document.createElement("option");
        chapterElement.value = i + 1;
        chapterElement.textContent = i + 1;
        chaptersElement.appendChild(chapterElement);
      }
    }
  }
}

export async function loadNumberOfVerses(book, chapter){
  const verses = await getChapterVerses(book, chapter);
  const versesElement = document.getElementById("verses");
  const bookElement = document.getElementById("books");
  const chapterElement = document.getElementById("chapters");

  versesElement.innerHTML = "";

  if (chapterElement.value && bookElement.value){
    const versesContent = verses.chapter.content;

    versesContent.forEach((verse) => {
      const verseElement = document.createElement("option");
      verseElement.value = verse.verse;
      verseElement.textContent = verse.verse;

      versesElement.appendChild(verseElement);
    });
  }
}