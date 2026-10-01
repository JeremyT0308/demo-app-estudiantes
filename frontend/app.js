// La API queda centralizada para no repetir URLs en cada petición.
// El frontend corre en :5500 y Spring Boot en :8080; CORS permite esa comunicación en desarrollo.
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
const pageLoader = document.querySelector("#pageLoader");
const cursorGlow = document.querySelector("#cursorGlow");

let products = [];
let dialogTimeline = null;

window.addEventListener("load", () => {
    window.setTimeout(() => pageLoader?.classList.add("is-hidden"), 320);
    initializeMotion();
});

function initializeMotion() {
    // GSAP es una mejora visual, no una dependencia funcional.
    // Si el CDN no carga, la aplicación sigue funcionando con CSS normal.
    if (!window.gsap) {
        document.querySelectorAll(".reveal-up, .reveal-scale").forEach(element => {
            element.style.opacity = "1";
        });
        document.querySelectorAll(".hero-title__line > span").forEach(element => {
            element.style.transform = "none";
        });
        return;
    }

    const { gsap } = window;
    if (window.ScrollTrigger) {
        gsap.registerPlugin(window.ScrollTrigger);
    }

    const intro = gsap.timeline({ defaults: { ease: "power4.out" } });
    intro
        .to(".hero-title__line > span", { y: 0, duration: 1.25, stagger: .11 }, .08)
        .fromTo(".hero__eyebrow", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: .8 }, .25)
        .fromTo(".hero__bottom", { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: .9 }, .45)
        .fromTo(".hero__seal", { scale: .82, rotate: -12, opacity: 0 }, { scale: 1, rotate: 0, opacity: 1, duration: 1.2 }, .4)
        .fromTo(".hero__specs", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .8 }, .6);

    if (window.ScrollTrigger) {
        gsap.utils.toArray(".reveal-up").forEach(element => {
            if (element.closest(".hero")) return;
            gsap.fromTo(element,
                { y: 46, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    ease: "power4.out",
                    scrollTrigger: { trigger: element, start: "top 88%", once: true }
                }
            );
        });

        gsap.to(".hero__seal", {
            yPercent: 14,
            scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 1 }
        });
    }

    setupMagneticElements();
}

function setupMagneticElements() {
    if (!window.gsap || window.matchMedia("(pointer: coarse)").matches) return;

    document.querySelectorAll(".magnetic").forEach(element => {
        element.addEventListener("pointermove", event => {
            const rect = element.getBoundingClientRect();
            const x = event.clientX - (rect.left + rect.width / 2);
            const y = event.clientY - (rect.top + rect.height / 2);
            window.gsap.to(element, { x: x * .12, y: y * .12, duration: .35, ease: "power3.out" });
        });
        element.addEventListener("pointerleave", () => {
            window.gsap.to(element, { x: 0, y: 0, duration: .6, ease: "elastic.out(1, .4)" });
        });
    });
}

// Luz ambiental que sigue el mouse. Es intencionalmente sutil para no parecer un efecto gamer.
if (!window.matchMedia("(pointer: coarse)").matches) {
    window.addEventListener("pointermove", event => {
        cursorGlow.style.left = `${event.clientX}px`;
        cursorGlow.style.top = `${event.clientY}px`;
        cursorGlow.style.opacity = "1";
    });
}

function renderLoadingCards() {
    grid.innerHTML = Array.from({ length: 6 }, () => '<article class="loading-card" aria-hidden="true"></article>').join("");
}

async function loadProducts() {
    statusText.textContent = "Consultando API";
    requestTime.textContent = "—";
    reloadButton.disabled = true;
    emptyState.hidden = true;
    renderLoadingCards();

    const startedAt = performance.now();

    try {
        const response = await fetch(API_URL, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        products = await response.json();
        const elapsed = Math.round(performance.now() - startedAt);
        statusText.textContent = `${products.length} piezas disponibles`;
        requestTime.textContent = `${elapsed} ms`;
        renderProducts();
    } catch (error) {
        grid.innerHTML = `
            <div class="error-card">
                <strong>No se pudo conectar con Spring Boot.</strong><br>
                Verifica que el backend esté disponible en localhost:8080.<br>
                <small>${escapeHtml(error.message)}</small>
            </div>`;
        statusText.textContent = "API no disponible";
        requestTime.textContent = "ERROR";
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

    grid.innerHTML = filtered.map((product, index) => `
        <article class="product-card" data-card-index="${index}">
            <div class="product-card__inner">
                <div class="product-card__header">
                    <span class="product-card__number">${String(index + 1).padStart(2, "0")}</span>
                    <span class="product-card__category">${escapeHtml(product.categoria)}</span>
                </div>

                <div class="product-card__visual" aria-hidden="true">
                    <div class="product-card__monogram">${escapeHtml(product.nombre.charAt(0).toUpperCase())}</div>
                </div>

                <h3 class="product-card__name">${escapeHtml(product.nombre)}</h3>

                <div class="product-card__footer">
                    <span class="product-card__price">${formatPrice(product.precio)}</span>
                    <button class="product-card__action magnetic" type="button" data-product-id="${product.id}" aria-label="Ver ${escapeHtml(product.nombre)}">
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M9 5h10v10"/></svg>
                    </button>
                </div>
            </div>
        </article>
    `).join("");

    emptyState.hidden = filtered.length !== 0;
    addCardMotion();
    setupMagneticElements();

    if (window.gsap && filtered.length) {
        window.gsap.fromTo(".product-card",
            { y: 36, opacity: 0 },
            { y: 0, opacity: 1, duration: .85, stagger: .07, ease: "power4.out" }
        );
    }
}

function addCardMotion() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    grid.querySelectorAll(".product-card").forEach(card => {
        const inner = card.querySelector(".product-card__inner");

        card.addEventListener("pointermove", event => {
            const rect = card.getBoundingClientRect();
            const px = (event.clientX - rect.left) / rect.width;
            const py = (event.clientY - rect.top) / rect.height;
            const rotateY = (px - .5) * 5;
            const rotateX = (.5 - py) * 4;

            card.style.setProperty("--card-x", `${px * 100}%`);
            card.style.setProperty("--card-y", `${py * 100}%`);

            if (window.gsap) {
                window.gsap.to(inner, { rotateX, rotateY, duration: .45, ease: "power3.out" });
            }
        });

        card.addEventListener("pointerleave", () => {
            if (window.gsap) {
                window.gsap.to(inner, { rotateX: 0, rotateY: 0, duration: .8, ease: "elastic.out(1, .45)" });
            }
        });
    });
}

async function showProduct(id) {
    dialogContent.innerHTML = '<p class="dialog-note">Cargando detalle del producto...</p>';
    document.body.classList.add("modal-open");
    dialog.showModal();
    animateDialogIn();

    const startedAt = performance.now();

    try {
        const response = await fetch(`${API_URL}/${id}`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const product = await response.json();
        const elapsed = Math.round(performance.now() - startedAt);

        dialogContent.innerHTML = `
            <span class="dialog-kicker">${escapeHtml(product.categoria)}</span>
            <h2>${escapeHtml(product.nombre)}</h2>
            <div class="dialog-price">${formatPrice(product.precio)}</div>
            <div class="dialog-grid">
                <div><span>Product ID</span><strong>#${product.id}</strong></div>
                <div><span>API response</span><strong>${elapsed} ms</strong></div>
            </div>
            <p class="dialog-note">
                Cierra y abre este mismo producto otra vez. Si la caché ya contiene el resultado,
                la petición debería evitar el acceso costoso al repositorio real.
            </p>`;

        if (window.gsap) {
            window.gsap.fromTo("#dialogContent > *", { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: .65, stagger: .06, ease: "power3.out" });
        }
    } catch (error) {
        dialogContent.innerHTML = `<div class="error-card">No se pudo cargar el producto. ${escapeHtml(error.message)}</div>`;
    }
}

function animateDialogIn() {
    if (!window.gsap) {
        dialog.querySelector(".product-dialog__backdrop").style.opacity = "1";
        dialog.querySelector(".product-dialog__panel").style.opacity = "1";
        dialog.querySelector(".product-dialog__panel").style.transform = "none";
        return;
    }

    if (dialogTimeline) dialogTimeline.kill();
    dialogTimeline = window.gsap.timeline();
    dialogTimeline
        .to(".product-dialog__backdrop", { opacity: 1, duration: .4, ease: "power2.out" })
        .to(".product-dialog__panel", { y: 0, scale: 1, opacity: 1, duration: .72, ease: "power4.out" }, .05);
}

function closeProductDialog() {
    if (!dialog.open) return;

    const finish = () => {
        dialog.close();
        document.body.classList.remove("modal-open");
    };

    if (!window.gsap) {
        finish();
        return;
    }

    window.gsap.timeline({ onComplete: finish })
        .to(".product-dialog__panel", { y: 30, scale: .97, opacity: 0, duration: .35, ease: "power2.in" })
        .to(".product-dialog__backdrop", { opacity: 0, duration: .25 }, .08);
}

function formatPrice(value) {
    return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(value);
}

// Los datos llegan desde la API y se insertan en HTML, así que escapamos caracteres especiales.
function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

searchInput.addEventListener("input", renderProducts);
searchInput.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        searchInput.value = "";
        renderProducts();
        searchInput.blur();
    }
});

window.addEventListener("keydown", event => {
    if (event.key === "/" && document.activeElement !== searchInput) {
        event.preventDefault();
        searchInput.focus();
    }
    if (event.key === "Escape" && dialog.open) closeProductDialog();
});

reloadButton.addEventListener("click", loadProducts);
closeDialog.addEventListener("click", closeProductDialog);
dialog.addEventListener("click", event => {
    if (event.target.classList.contains("product-dialog__backdrop")) closeProductDialog();
});

grid.addEventListener("click", event => {
    const button = event.target.closest("[data-product-id]");
    if (button) showProduct(button.dataset.productId);
});

loadProducts();
