const results = document.getElementById("results");
const resultsCount = document.getElementById("results-count");
const form = document.getElementById("search-form");
const input = document.getElementById("search-input");

let latestSearch = 0; // guards against slow, older responses overwriting newer ones

function render(items) {
  results.innerHTML = "";

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "result";

    const img = document.createElement("img");
    img.src = item.imageinfo[0].thumburl;
    img.alt = item.title.replace(/^File:/, "");

    const caption = document.createElement("p");
    caption.textContent = img.alt;

    card.appendChild(img);
    card.appendChild(caption);
    results.appendChild(card);
  });
}

async function search(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    "&gsrsearch=" + encodeURIComponent(query) +
    "&gsrnamespace=6&gsrlimit=20&prop=imageinfo&iiprop=url&iiurlwidth=300&format=json&origin=*";

  const response = await fetch(url);
  if (!response.ok) throw new Error(response.status);
  const data = await response.json();

  const pages = data.query ? Object.values(data.query.pages) : [];
  return pages
    .filter((p) => p.imageinfo && p.imageinfo[0].thumburl)
    .sort((a, b) => a.index - b.index);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  const thisSearch = ++latestSearch;

  // Loading state
  results.innerHTML = "";
  resultsCount.classList.remove("error");
  resultsCount.classList.add("loading");
  resultsCount.textContent = "Searching…";

  try {
    const items = await search(query);
    if (thisSearch !== latestSearch) return; // a newer search has started

    resultsCount.classList.remove("loading");

    // Empty state
    if (items.length === 0) {
      resultsCount.textContent = "No results for that word. Try another search.";
      return;
    }

    render(items);
    resultsCount.textContent = `Showing ${items.length} results for "${query}"`;
  } catch (error) {
    if (thisSearch !== latestSearch) return;

    // Error state
    results.innerHTML = "";
    resultsCount.classList.remove("loading");
    resultsCount.classList.add("error");
    resultsCount.textContent = "Something went wrong. Please try again.";
  }
});
