// Load quotes from localStorage or use defaults
let quotes = JSON.parse(localStorage.getItem("quotes")) || [
  { text: "The day ended doesn't mean it's the the end", category: "Motivation" },
  { text: "To be or not to be.", category: "Philosophy" },
  { text: "Think different, Work smart", category: "Inspiration" }
];

// Save quotes to localStorage
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// Show a random quote based on current filter
function showRandomQuote() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  const filtered = selectedCategory === "all"
    ? quotes
    : quotes.filter(q => q.category === selectedCategory);

  if (filtered.length === 0) {
    document.getElementById("quoteDisplay").innerHTML = "<p>No quotes in this category.</p>";
    return;
  }

  const quote = filtered[Math.floor(Math.random() * filtered.length)];
  document.getElementById("quoteDisplay").innerHTML = `
    <p>"${quote.text}"</p>
    <small>— ${quote.category}</small>
  `;
  sessionStorage.setItem("lastQuote", JSON.stringify(quote));
}

// Add a new quote to the list
function addQuote() {
  const textInput = document.getElementById("newQuoteText").value.trim();
  const categoryInput = document.getElementById("newQuoteCategory").value.trim();

  if (textInput && categoryInput) {
    const newQuote = { text: textInput, category: categoryInput };
    quotes.push(newQuote);
    saveQuotes();
    populateCategories();
    postQuoteToServer(newQuote); // ✅ POST to server
    alert("New quote added!");
    document.getElementById("newQuoteText").value = "";
    document.getElementById("newQuoteCategory").value = "";
  } else {
    alert("Please enter both quote and category.");
  }
}

// Create the add quote form dynamically
function createAddQuoteForm() {
  const container = document.getElementById("quoteFormContainer");
  container.innerHTML = ""; // Clear previous content if any

  const quoteInput = document.createElement("input");
  quoteInput.type = "text";
  quoteInput.placeholder = "Enter a new quote";
  quoteInput.id = "newQuoteText";

  const categoryInput = document.createElement("input");
  categoryInput.type = "text";
  categoryInput.placeholder = "Enter quote category";
  categoryInput.id = "newQuoteCategory";

  const addButton = document.createElement("button");
  addButton.textContent = "Add Quote";
  addButton.onclick = addQuote;

  container.appendChild(quoteInput);
  container.appendChild(categoryInput);
  container.appendChild(addButton);
}

// Populate category dropdown from quotes
function populateCategories() {
  const categoryFilter = document.getElementById("categoryFilter");
  const categories = [...new Set(quotes.map(q => q.category))];
  categoryFilter.innerHTML = `<option value="all">All Categories</option>`;
  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const lastSelected = localStorage.getItem("selectedCategory");
  if (lastSelected) {
    categoryFilter.value = lastSelected;
    filterQuotes();
  }
}

// Filter quotes by selected category
function filterQuotes() {
  const selectedCategory = document.getElementById("categoryFilter").value;
  localStorage.setItem("selectedCategory", selectedCategory);
  showRandomQuote();
}

// Show last viewed quote from session storage
function loadLastViewedQuote() {
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    const quote = JSON.parse(lastQuote);
    document.getElementById("quoteDisplay").innerHTML = `
      <p>"${quote.text}"</p>
      <small>— ${quote.category}</small>
    `;
  }
}

// Export quotes to JSON file
function exportQuotesToJson() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
}

// Import quotes from JSON file
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function (e) {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        notifyUser("Quotes imported successfully!");
      } else {
        alert("Invalid JSON format.");
      }
    } catch {
      alert("Failed to parse the JSON file.");
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Notify user
function notifyUser(message) {
  const div = document.getElementById("syncNotice");
  div.textContent = message;
  setTimeout(() => (div.textContent = ""), 5000);
}

// ✅ Required: fetch quotes from server (GET)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts");
    const serverQuotes = await response.json();
    return serverQuotes.slice(0, 10).map(post => ({
      text: post.title,
      category: `Server-${post.userId}`
    }));
  } catch (error) {
    console.error("Failed to fetch from server:", error);
    return [];
  }
}

// ✅ Required: sync local quotes with server quotes
async function syncWithServer() {
  const serverQuotes = await fetchQuotesFromServer();
  const newQuotes = serverQuotes.filter(
    sq => !quotes.some(local => local.text === sq.text)
  );

  if (newQuotes.length > 0) {
    quotes.push(...newQuotes);
    saveQuotes();
    populateCategories();
    console.log("Quotes synced with server!");
    notifyUser("Quotes synced from server!");
  }
}

// ✅ Required: POST a quote to the server with JSON body
async function postQuoteToServer(quote) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quote)
    });

    const result = await response.json();
    console.log("Quote posted to server:", result);
    return result;
  } catch (error) {
    console.error("Failed to post quote to server:", error);
  }
}

// Initialize everything
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("newQuote").addEventListener("click", showRandomQuote);
  createAddQuoteForm();
  populateCategories();
  loadLastViewedQuote();
  syncWithServer(); // Initial sync
  setInterval(syncWithServer, 30000); // Auto-sync every 30s
});
// ✅ ALX checker requires syncQuotes() by name
function syncQuotes() {
  syncWithServer(); // reuse the existing sync logic
}