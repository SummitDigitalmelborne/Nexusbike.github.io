const ORDER_EMAIL = "nexusbike@tutamail.com";
const ORDER_API_URL = `https://formsubmit.co/ajax/${ORDER_EMAIL}`;

const products = [
    {
        id: 1,
        name: "Performance Controller",
        category: "electrical",
        categoryLabel: "Electrical",
        description: "An upgraded controller for compatible electric dirt bikes.",
        price: 499,
        image: "./assets/product-controller.svg",
        badge: "ELECTRICAL"
    },
    {
        id: 2,
        name: "Precision Throttle",
        category: "electrical",
        categoryLabel: "Electrical",
        description: "Replacement throttle assembly for compatible builds.",
        price: 129,
        image: "./assets/product-throttle.svg",
        badge: "CONTROL"
    },
    {
        id: 3,
        name: "Lithium Battery",
        category: "electrical",
        categoryLabel: "Electrical",
        description: "Battery replacement options for compatible models.",
        price: 899,
        image: "./assets/product-battery.svg",
        badge: "POWER"
    },
    {
        id: 4,
        name: "Battery Bag",
        category: "components",
        categoryLabel: "Components",
        description: "Storage for compatible battery setups.",
        price: 79,
        image: "./assets/product-bag.svg",
        badge: "ACCESSORY"
    },
    {
        id: 5,
        name: "Lock-On Grips",
        category: "cockpit",
        categoryLabel: "Cockpit",
        description: "Replacement grips for your handlebar setup.",
        price: 49,
        image: "./assets/product-grips.svg",
        badge: "COCKPIT"
    },
    {
        id: 6,
        name: "Racing Handlebars",
        category: "cockpit",
        categoryLabel: "Cockpit",
        description: "Handlebar upgrades for compatible electric dirt bikes.",
        price: 289,
        image: "./assets/product-handles.svg",
        badge: "UPGRADE"
    },
    {
        id: 7,
        name: "CNC Foot Pegs",
        category: "components",
        categoryLabel: "Components",
        description: "Foot peg upgrades for compatible bike models.",
        price: 149,
        image: "./assets/product-footpegs.svg",
        badge: "HARDWARE"
    },
    {
        id: 8,
        name: "Rear Dropouts",
        category: "components",
        categoryLabel: "Components",
        description: "Replacement dropout components for compatible builds.",
        price: 259,
        image: "./assets/product-dropouts.svg",
        badge: "COMPONENTS"
    },
    {
        id: 9,
        name: "Ultra Bee Rear Brake Assembly Caliper Lever Line",
        category: "components",
        categoryLabel: "Components",
        description: "Rear brake assembly caliper lever line for Ultra Bee, Surron LBX and Talaria models. Designed for sturdy braking performance without the rotor included.",
        price: 300,
        image: "./assets/product-ultra-bee-brake.svg",
        badge: "BRAKE"
    },
    {
        id: 10,
        name: "Black Pro Taper Grip",
        category: "cockpit",
        categoryLabel: "Cockpit",
        description: "Black Pro Taper-style grip for improved control, comfort and grip on your handlebar setup.",
        price: 5,
        image: "./assets/product-pro-taper-black-grip.svg",
        badge: "COCKPIT"
    }
];

const productMap = new Map(products.map(product => [product.id, product]));
const cart = new Map();

let activeCategory = "all";
let searchTerm = "";

const $ = id => document.getElementById(id);
const productGrid = $("product-grid");
const productCount = $("product-count");
const productSearch = $("product-search");
const emptyState = $("empty-state");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const cartItems = $("cart-items");
const cartTotal = $("cart-total");
const cartButton = $("cart-button");
const cartOverlay = $("cart-overlay");
const cartDrawer = $("cart-drawer");
const closeCartButton = $("close-cart");
const checkoutForm = $("checkout-form");
const checkoutStatus = $("checkout-status");
const toast = $("toast");
const productModal = $("product-modal");
const productModalImage = $("product-modal-image");
const productModalCategory = $("product-modal-category");
const productModalTitle = $("product-modal-title");
const productModalDescription = $("product-modal-description");
const productModalPrice = $("product-modal-price");
const productModalButton = $("product-modal-button");
const closeProductModalButton = $("close-product-modal");
const currentYear = $("current-year");

function formatPrice(value) {
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD"
    }).format(value);
}

function getFilteredProducts() {
    const search = searchTerm.trim().toLowerCase();

    return products.filter(product => {
        const matchesCategory =
            activeCategory === "all" ||
            product.category === activeCategory;

        const searchableText = [
            product.name,
            product.categoryLabel,
            product.description,
            product.badge
        ].join(" ").toLowerCase();

        return matchesCategory && (!search || searchableText.includes(search));
    });
}

function renderProducts() {
    if (!productGrid) return;

    const filteredProducts = getFilteredProducts();

    productGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card" data-product-id="${product.id}" tabindex="0" aria-label="View ${product.name}">
            <div class="product-image-wrap">
                <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy">
                <span class="product-badge">${product.badge}</span>
            </div>
            <div class="product-info">
                <p class="product-category">${product.categoryLabel}</p>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-bottom">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <button type="button" class="add-button" data-add-product="${product.id}" aria-label="Add ${product.name} to cart">+</button>
                </div>
            </div>
        </article>
    `).join("");

    if (productCount) {
        productCount.textContent = `${filteredProducts.length} PRODUCT${filteredProducts.length === 1 ? "" : "S"}`;
    }

    if (emptyState) {
        emptyState.hidden = filteredProducts.length !== 0;
    }

    filterButtons.forEach(button => {
        button.classList.toggle("active", button.dataset.category === activeCategory);
    });
}

function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(showToast.timeoutId);
    showToast.timeoutId = setTimeout(() => toast.classList.remove("show"), 2500);
}

function openCart() {
    cartDrawer?.classList.add("open");
    cartOverlay?.classList.add("open");
    document.body.classList.add("cart-open");
}

function closeCart() {
    cartDrawer?.classList.remove("open");
    cartOverlay?.classList.remove("open");
    document.body.classList.remove("cart-open");
}

function renderCart() {
    if (!cartItems || !cartTotal) return;

    const entries = [...cart.entries()];
    const quantityTotal = entries.reduce((sum, [, quantity]) => sum + quantity, 0);
    const subtotal = entries.reduce((sum, [id, quantity]) => {
        const product = productMap.get(id);
        return sum + (product ? product.price * quantity : 0);
    }, 0);

    if ($("cart-count")) $("cart-count").textContent = String(quantityTotal);
    cartTotal.textContent = formatPrice(subtotal);

    if (entries.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
        return;
    }

    cartItems.innerHTML = entries.map(([id, quantity]) => {
        const product = productMap.get(id);
        if (!product) return "";
        return `
            <div class="cart-item">
                <div>
                    <div class="cart-item-name">${product.name}</div>
                    <div class="cart-item-price">${formatPrice(product.price)} each</div>
                    <div class="cart-item-actions">
                        <button type="button" class="quantity-button" data-quantity-change="${id},-1" aria-label="Decrease quantity">−</button>
                        <span class="quantity-number">${quantity}</span>
                        <button type="button" class="quantity-button" data-quantity-change="${id},1" aria-label="Increase quantity">+</button>
                        <button type="button" class="remove-button" data-remove-product="${id}">Remove</button>
                    </div>
                </div>
                <div class="cart-item-total">${formatPrice(product.price * quantity)}</div>
            </div>
        `;
    }).join("");
}

function addToCart(id) {
    if (!productMap.has(id)) return;
    cart.set(id, (cart.get(id) || 0) + 1);
    renderCart();
    openCart();
    showToast("Added to cart");
}

function updateCartQuantity(id, change) {
    const quantity = (cart.get(id) || 0) + change;
    if (quantity <= 0) cart.delete(id);
    else cart.set(id, quantity);
    renderCart();
}

function removeFromCart(id) {
    cart.delete(id);
    renderCart();
}

function openProductModal(id) {
    const product = productMap.get(id);
    if (!product || !productModal) return;

    if (productModalImage) {
        productModalImage.src = product.image;
        productModalImage.alt = product.name;
    }
    if (productModalCategory) productModalCategory.textContent = product.categoryLabel;
    if (productModalTitle) productModalTitle.textContent = product.name;
    if (productModalDescription) productModalDescription.textContent = product.description;
    if (productModalPrice) productModalPrice.textContent = formatPrice(product.price);
    if (productModalButton) productModalButton.dataset.productId = String(id);

    productModal.classList.add("open");
    productModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeProductModal() {
    productModal?.classList.remove("open");
    productModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

productSearch?.addEventListener("input", event => {
    searchTerm = event.target.value;
    renderProducts();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        activeCategory = button.dataset.category || "all";
        renderProducts();
    });
});

productGrid?.addEventListener("click", event => {
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
        event.stopPropagation();
        addToCart(Number(addButton.dataset.addProduct));
        return;
    }

    const card = event.target.closest("[data-product-id]");
    if (card) openProductModal(Number(card.dataset.productId));
});

productGrid?.addEventListener("keydown", event => {
    if (event.target.closest("button")) return;
    const card = event.target.closest("[data-product-id]");
    if (card && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        openProductModal(Number(card.dataset.productId));
    }
});

cartButton?.addEventListener("click", openCart);
closeCartButton?.addEventListener("click", closeCart);
cartOverlay?.addEventListener("click", closeCart);

cartItems?.addEventListener("click", event => {
    const quantityButton = event.target.closest("[data-quantity-change]");
    if (quantityButton) {
        const [id, change] = quantityButton.dataset.quantityChange.split(",");
        updateCartQuantity(Number(id), Number(change));
        return;
    }

    const removeButton = event.target.closest("[data-remove-product]");
    if (removeButton) removeFromCart(Number(removeButton.dataset.removeProduct));
});

productModalButton?.addEventListener("click", () => {
    const id = Number(productModalButton.dataset.productId);
    if (id) {
        addToCart(id);
        closeProductModal();
    }
});

closeProductModalButton?.addEventListener("click", closeProductModal);
productModal?.addEventListener("click", event => {
    if (event.target.closest("[data-close-product-modal]")) closeProductModal();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
        closeCart();
        closeProductModal();
    }
});

checkoutForm?.addEventListener("submit", async event => {
    event.preventDefault();

    if (cart.size === 0) {
        if (checkoutStatus) checkoutStatus.textContent = "Your cart is empty.";
        return;
    }

    const name = $("order-name")?.value.trim() || "";
    const email = $("order-email")?.value.trim() || "";
    const phone = $("order-phone")?.value.trim() || "";
    const address = $("order-address")?.value.trim() || "";

    const items = [...cart.entries()].map(([id, quantity]) => {
        const product = productMap.get(id);
        return {
            name: product.name,
            price: product.price,
            quantity,
            subtotal: product.price * quantity
        };
    });

    const total = items.reduce((sum, item) => sum + item.subtotal, 0);
    const orderSummary = items.map(item => `${item.name} x ${item.quantity} — ${formatPrice(item.subtotal)}`).join("\n");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("address", address);
    formData.append("order", orderSummary);
    formData.append("total", formatPrice(total));
    formData.append("_subject", "New NEXUS BIKE order request");
    formData.append("_template", "table");
    formData.append("_captcha", "false");

    if (checkoutStatus) {
        checkoutStatus.textContent = "Sending order request...";
        checkoutStatus.style.color = "var(--red)";
    }

    const submitButton = checkoutForm.querySelector('[type="submit"]');
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Sending...";
    }

    try {
        const response = await fetch(ORDER_API_URL, {
            method: "POST",
            headers: { Accept: "application/json" },
            body: formData
        });

        const responseText = await response.text();
        let result;
        try {
            result = JSON.parse(responseText);
        } catch {
            throw new Error("FormSubmit returned an unexpected response. Check your internet connection and try again.");
        }

        if (!response.ok || result.success === "false" || result.success === false) {
            throw new Error(result.message || "Your order could not be sent. Please try again.");
        }

        if (checkoutStatus) {
            checkoutStatus.textContent = "Your order request was submitted. Please check your email for confirmation.";
            checkoutStatus.style.color = "#7ee081";
        }

        cart.clear();
        renderCart();
        checkoutForm.reset();
    } catch (error) {
        console.error("NEXUS BIKE checkout error:", error);
        if (checkoutStatus) {
            checkoutStatus.textContent = error.message || "Unable to send your order. Please try again.";
            checkoutStatus.style.color = "#ff8b8b";
        }
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "SUBMIT ORDER REQUEST ↗";
        }
    }
});

if (currentYear) currentYear.textContent = new Date().getFullYear();
renderProducts();
renderCart();
