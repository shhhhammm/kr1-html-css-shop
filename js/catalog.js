const filtersForm = document.getElementById("catalog-filters");
const catalogGrid = document.getElementById("catalog-grid");
const productCards = Array.from(catalogGrid.querySelectorAll(".product-card"));
const productSort = document.getElementById("product-sort");
const productsCount = document.getElementById("products-count");
const emptyCatalog = document.getElementById("catalog-empty");
const priceFrom = filtersForm.elements.namedItem("price-from");
const priceTo = filtersForm.elements.namedItem("price-to");

function normalizeSearch(value) {
  return value.trim().toLocaleLowerCase("ru").replaceAll("ё", "е");
}

function sortProducts() {
  // Копия исходного массива позволяет восстановить первоначальный порядок.
  const sortedCards = [...productCards];

  if (productSort.value === "price-asc") {
    sortedCards.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
  } else if (productSort.value === "price-desc") {
    sortedCards.sort((a, b) => Number(b.dataset.price) - Number(a.dataset.price));
  } else if (productSort.value === "name") {
    sortedCards.sort((a, b) =>
      a.querySelector(".product-card__title").textContent.localeCompare(
        b.querySelector(".product-card__title").textContent,
        "ru",
      ),
    );
  }

  catalogGrid.append(...sortedCards);
}

function applyFilters() {
  priceTo.setCustomValidity("");

  if (
    priceFrom.value !== "" &&
    priceTo.value !== "" &&
    Number(priceFrom.value) > Number(priceTo.value)
  ) {
    priceTo.setCustomValidity("Цена «До» должна быть не меньше цены «От».");
  }

  if (!filtersForm.reportValidity()) return;

  const formData = new FormData(filtersForm);
  const query = normalizeSearch(formData.get("search"));
  const categories = formData.getAll("category");
  const minPrice = priceFrom.value === "" ? 0 : Number(priceFrom.value);
  const maxPrice = priceTo.value === "" ? Infinity : Number(priceTo.value);
  let visibleCount = 0;

  productCards.forEach((card) => {
    const title = card.querySelector(".product-card__title").textContent;
    const description = card.querySelector(".product-card__description").textContent;
    const price = Number(card.dataset.price);
    const matches =
      normalizeSearch(`${title} ${description}`).includes(query) &&
      (categories.length === 0 || categories.includes(card.dataset.category)) &&
      price >= minPrice &&
      price <= maxPrice;

    card.hidden = !matches;
    if (matches) visibleCount += 1;
  });

  productsCount.textContent = `Показано: ${visibleCount} из ${productCards.length}`;
  emptyCatalog.hidden = visibleCount !== 0;
  sortProducts();
}

filtersForm.addEventListener("submit", (event) => {
  event.preventDefault();
  applyFilters();
});

[priceFrom, priceTo].forEach((input) => {
  input.addEventListener("input", () => priceTo.setCustomValidity(""));
});

filtersForm.addEventListener("reset", (event) => {
  const resetFromEmptyState = emptyCatalog.contains(document.activeElement);
  // Поля возвращаются к исходным значениям после события reset.
  setTimeout(() => {
    if (event.defaultPrevented) return;
    productSort.value = "default";
    applyFilters();
    if (resetFromEmptyState) filtersForm.elements.namedItem("search").focus();
  }, 0);
});

productSort.addEventListener("change", sortProducts);
applyFilters();
