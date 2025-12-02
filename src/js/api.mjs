const dataset = 'open-cross-ref';


// Get the list of books for the open-cross-ref dataset
export async function getBooks(){
    const data = await fetch(`https://bible.helloao.org/api/d/${dataset}/books.json`);
    const result = await data.json();
    console.log(result);
    return result;
}


// Get Genesis 1 from the open-cross-ref dataset
export async function getBookChapter (book, chapter){
    const data = await fetch(`https://bible.helloao.org/api/d/${dataset}/${book}/${chapter}.json`);
    const result = await data.json();
    return result;
}