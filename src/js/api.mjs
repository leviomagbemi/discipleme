const dataset = 'open-cross-ref';
"https://bible-api.com/GEN%203:16-18?translation=kjv"

// Get the list of books for the open-cross-ref dataset
export async function getBooks(){
    const data = await fetch(`https://bible.helloao.org/api/d/${dataset}/books.json`);
    const result = await data.json();
    return result.books;
}

// Get Genesis 1 from the open-cross-ref dataset
export async function getBookChapter (book, chapter){
    const data = await fetch(`https://bible.helloao.org/api/d/${dataset}/${book}/${chapter}.json`);
    const result = await data.json();
    console.log(result);
    return result;
}

export async function getVerse(book, chapter, verse) {
    // 1. Construct the string normally with spaces (e.g., "John 3:16")
    const reference = `${book} ${chapter}:${verse}`;
    
    // 2. Encode it safely (e.g., "John%203%3A16")
    const encodedRef = encodeURIComponent(reference);

    // 3. Fetch
    const response = await fetch(`https://bible-api.com/${encodedRef}?translation=kjv`);
    
    if (!response.ok) {
        throw new Error('Verse not found');
    }

    const result = await response.json();
    console.log(result);
    return result;
}