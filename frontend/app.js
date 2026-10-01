// Dejamos la URL de la API en un solo lugar para no repetirla por todo el front.
// En desarrollo el frontend usa :5500 y Spring Boot usa :8080, por eso entra CORS.
const API_URL = "http://localhost:8080/api/productos";

const grid = document.querySelector("#productsGrid");
const searchInput = document.querySelector("#searchInput");
const reloadButton = document.querySelector("#reloadButton");
const statusText = document.querySelector("#statusText");
const requestTime = document.querySelector("#requestTime");
const emptyState = document.querySelector("#emptyState");
const dialog = document.querySelector("#productDialog");
const dialogContent = document.querySelector("#dialogContent");
const closeDialog = document.querySelector("#closeDialog");

let products = [];

async function loadProducts() {
    statusText.textContent = "Consultando API...";
    requestTime.textContent = "";
    reloadButton.disabled = true;
    const startedAt = performance.now();

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        products = await response.json();
        const elapsed = Math.round(performance.now() - startedAt);
        statusText.textContent = `${products.length} productos disponibles`;
        requestTime.textContent = `Respuesta: ${elapsed} ms`;
        renderProducts();
    } catch (error) {
        grid.innerHTML = `<p class="error">No se pudo conectar al backend. Verifica que Spring Boot esté ejecutándose en el puerto 8080. (${escapeHtml(error.message)})</p>`;
        emptyState.hidden = true;
        statusText.textContent = "Error de conexión";
    } finally {
        reloadButton.disabled = false;
    }
}

function renderProducts() {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = products.filter(product =>
        product.nombre.toLowerCase().includes(term) ||
        product.categoria.toLowerCase().includes(term)
    );

    grid.innerHTML = filtered.map(product => `
        <article class="card">
            <div class="card__top">
                <h2>${escapeHtml(product.nombre)}</h2>
                <span class="badge">${escapeHtml(product.categoria)}</span>
            </div>
            <p class="price">${formatPrice(product.precio)}</p>
            <button type="button" data-product-id="${product.id}">Ver detalle</button>
        </article>
    `).join("");

    emptyState.hidden = filtered.length !== 0;
}

async function showProduct(id) {
    dialogContent.innerHTML = "<p>Cargando detalle...</p>";
    dialog.showModal();
    const startedAt = performance.now();

    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const product = await response.json();
        const elapsed = Math.round(performance.now() - startedAt);

        dialogContent.innerHTML = `
            <span class="badge">${escapeHtml(product.categoria)}</span>
            <h2>${escapeHtml(product.nombre)}</h2>
            <p class="price">${formatPrice(product.precio)}</p>
            <p>ID del producto: ${product.id}</p>
            <p>Tiempo de respuesta: <strong>${elapsed} ms</strong></p>
            <p>Abre el mismo producto otra vez para observar el efecto de la caché.</p>
        `;
    } catch (error) {
        dialogContent.innerHTML = `<p class="error">No se pudo cargar el producto. ${escapeHtml(error.message)}</p>`;
    }
}

function formatPrice(value) {
    return new Intl.NumberFormat("es-EC", {
        style: "currency",
        currency: "USD"
    }).format(value);
}

// El contenido viene de la API. Escapamos texto antes de insertarlo en HTML
// para no mezclar datos recibidos con etiquetas que el navegador pueda interpretar.
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

searchInput.addEventListener("input", renderProducts);
reloadButton.addEventListener("click", loadProducts);
closeDialog.addEventListener("click", () => dialog.close());
grid.addEventListener("click", event => {
    const button = event.target.closest("[data-product-id]");
    if (button) showProduct(button.dataset.productId);
});

// Primera carga automatica apenas abre el navegador.
loadProducts();
