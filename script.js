const products = [
    {
        id: 1,
        name: "Performance Controller",
        category: "electrical",
        categoryLabel: "Electrical",
        description: "An upgraded controller for compatible electric dirt bikes.",
        price: 499,
        image: "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=700&q=80",
        badge: "ELECTRICAL"
    },
    {
        id: 2,
        name: "Precision Throttle",
        category: "electrical",
        categoryLabel: "Electrical",
        description: "Replacement throttle assembly for compatible builds.",
        price: 129,
        image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=700&q=80",
        badge: "CONTROL"
    },
    {
        id: 3,
        name: "Lithium Battery",
        category: "electrical",
        categoryLabel: "Electrical",
        description: "Battery replacement options for compatible models.",
        price: 899,
        image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=700&q=80",
        badge: "POWER"
    },
    {
        id: 4,
        name: "Battery Bag",
        category: "components",
        categoryLabel: "Components",
        description: "Storage for compatible battery setups.",
        price: 79,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=700&q=80",
        badge: "ACCESSORY"
    },
    {
        id: 5,
        name: "Lock-On Grips",
        category: "cockpit",
        categoryLabel: "Cockpit",
        description: "Replacement grips for your handlebar setup.",
        price: 49,
        image: "https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?auto=format&fit=crop&w=700&q=80",
        badge: "COCKPIT"
    },
    {
        id: 6,
        name: "Racing Handlebars",
        category: "cockpit",
        categoryLabel: "Cockpit",
        description: "Handlebar upgrades for compatible electric dirt bikes.",
        price: 289,
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80",
        badge: "UPGRADE"
    },
    {
        id: 7,
        name: "CNC Foot Pegs",
        category: "components",
        categoryLabel: "Components",
        description: "Foot peg upgrades for compatible bike models.",
        price: 149,
        image: "https://images.unsplash.com/photo-1528629297340-d1d466945dc5?auto=format&fit=crop&w=700&q=80",
        badge: "HARDWARE"
    },
    {
        id: 8,
        name: "Rear Dropouts",
        category: "components",
        categoryLabel: "Components",
        description: "Replacement dropout components for compatible builds.",
        price: 259,
        image: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?auto=format&fit=crop&w=700&q=80",
        badge: "COMPONENTS"
    }
];

const productMap = new Map(products.map(product => [product.id, product]));
const cart = new Map();
let activeCategory = "all";
let searchTerm = "";

const productGrid = document.getElementById("product-grid");
const productCount = document.getElementById("product-count");
const productSearch = document.getElementById("product-search");
const emptyState = document.getElementById("empty-state");
const filterButtons = [...document.querySelectorAll(".filter-button")];
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const cartButton = document.getElementById("cart-button");
const cartOverlay = document.getElementById("cart-overlay");
const cartDrawer = document.getElementById("cart-drawer");
const closeCartButton = document.getElementById("close-cart");
const checkoutForm = document.getElementById("checkout-form");
const checkoutStatus = document.getElementById("checkout-status");
const toast = document.getElementById("toast");
const productModal = document.getElementById("product-modal");
const productModalImage = document.getElementById("product-modal-image");
const productModalCategory = document.getElementById("product-modal-category");
const productModalTitle = document.getElementById("product-modal-title");
const productModalDescription = document.getElementById("product-modal-description");
const productModalPrice = document.getElementById("product-modal-price");
const productModalButton = document.getElementById("product-modal-button");
const closeProductModalButton = document.getElementById("close-product-modal");
const currentYear = document.getElementById("current-year");

function formatPrice(value) {
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD"
    }).format(value);
}

function getFilteredProducts() {
    return products.filter(product => {
        const matchesCategory = activeCategory === "all" || product.category === activeCategory;
        const lowerSearch = searchTerm.trim().toLowerCase();
        const matchesSearch = !lowerSearch || [
            product.name,
            product.categoryLabel,
            product.description,
            product.badge
        ].join(" ").toLowerCase().includes(lowerSearch);

        return matchesCategory && matchesSearch;
    });
}

function renderProducts() {
    const filteredProducts = getFilteredProducts();

    productGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card" data-product-id="${product.id}" tabindex="0" aria-label="${product.name}">
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

    productCount.textContent = `${filteredProducts.length} PRODUCT${filteredProducts.length === 1 ? "" : "S"}`;
    emptyState.hidden = filteredProducts.length !== 0;

    filterButtons.forEach(button => {
        const isActive = button.dataset.category === activeCategory;
        button.classList.toggle("active", isActive);
    });
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 2200);
}

function openCart() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("open");
    document.body.classList.add("cart-open");
}

function closeCart() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("open");
    document.body.classList.remove("cart-open");
}

function renderCart() {
    const cartEntries = [...cart.entries()];
    const cartItemCount = cartEntries.reduce((total, [, quantity]) => total + quantity, 0);
    const subtotal = cartEntries.reduce((total, [productId, quantity]) => {
        const product = productMap.get(productId);
        return total + (product ? product.price * quantity : 0);
    }, 0);

    document.getElementById("cart-count").textContent = String(cartItemCount);
    cartTotal.textContent = formatPrice(subtotal);

    if (cartEntries.length === 0) {
        cartItems.innerHTML = '<p class="cart-empty">Your cart is empty.</p>';
        return;
    }

    cartItems.innerHTML = cartEntries.map(([productId, quantity]) => {
        const product = productMap.get(productId);
        if (!product) {
            return "";
        }

        return `
            <div class="cart-item">
                <div>
                    <div class="cart-item-name">${product.name}</div>
                    <div class="cart-item-price">${formatPrice(product.price)} each</div>
                    <div class="cart-item-actions">
                        <button type="button" class="quantity-button" data-quantity-change="${productId},-1" aria-label="Decrease quantity">−</button>
                        <span class="quantity-number">${quantity}</span>
                        <button type="button" class="quantity-button" data-quantity-change="${productId},1" aria-label="Increase quantity">+</button>
                        <button type="button" class="remove-button" data-remove-product="${productId}">Remove</button>
                    </div>
                </div>
                <div class="cart-item-total">${formatPrice(product.price * quantity)}</div>
            </div>
        `;
    }).join("");
}

function addToCart(productId) {
    const nextQuantity = (cart.get(productId) || 0) + 1;
    cart.set(productId, nextQuantity);
    renderCart();
    openCart();
    showToast("Added to cart");
}

function updateCartQuantity(productId, delta) {
    const current = cart.get(productId) || 0;
    const next = current + delta;

    if (next <= 0) {
        cart.delete(productId);
    } else {
        cart.set(productId, next);
    }

    renderCart();
}

function removeFromCart(productId) {
    cart.delete(productId);
    renderCart();
}

function openProductModal(productId) {
    const product = productMap.get(productId);
    if (!product) {
        return;
    }

    productModalImage.src = product.image;
    productModalImage.alt = product.name;
    productModalCategory.textContent = product.categoryLabel;
    productModalTitle.textContent = product.name;
    productModalDescription.textContent = product.description;
    productModalPrice.textContent = formatPrice(product.price);
    productModalButton.dataset.productId = String(productId);

    productModal.classList.add("open");
    productModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
}

function closeProductModal() {
    productModal.classList.remove("open");
    productModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
}

productSearch.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderProducts();
});

filterButtons.forEach(button => {
    button.addEventListener("click", () => {
        activeCategory = button.dataset.category;
        renderProducts();
    });
});

productGrid.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
        addToCart(Number(addButton.dataset.addProduct));
        return;
    }

    const productCard = event.target.closest("[data-product-id]");
    if (productCard) {
        openProductModal(Number(productCard.dataset.productId));
    }
});

productGrid.addEventListener("keydown", (event) => {
    const productCard = event.target.closest("[data-product-id]");
    if (!productCard) {
        return;
    }

    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openProductModal(Number(productCard.dataset.productId));
    }
});

cartButton.addEventListener("click", openCart);
closeCartButton.addEventListener("click", closeCart);
cartOverlay.addEventListener("click", closeCart);

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeCart();
        closeProductModal();
    }
});

cartItems.addEventListener("click", (event) => {
    const quantityButton = event.target.closest("[data-quantity-change]");
    if (quantityButton) {
        const [productId, delta] = quantityButton.dataset.quantityChange.split(",");
        updateCartQuantity(Number(productId), Number(delta));
        return;
    }

    const removeButton = event.target.closest("[data-remove-product]");
    if (removeButton) {
        removeFromCart(Number(removeButton.dataset.removeProduct));
    }
});

productModalButton.addEventListener("click", () => {
    const productId = Number(productModalButton.dataset.productId);
    if (productId) {
        addToCart(productId);
        closeProductModal();
    }
});

closeProductModalButton.addEventListener("click", closeProductModal);
productModal.addEventListener("click", (event) => {
    if (event.target.closest("[data-close-product-modal]")) {
        closeProductModal();
    }
});

checkoutForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const cartEntries = [...cart.entries()];
    if (cartEntries.length === 0) {
        checkoutStatus.textContent = "Your cart is empty.";
        return;
    }

    const customer = {
        name: document.getElementById("order-name").value.trim(),
        email: document.getElementById("order-email").value.trim(),
        phone: document.getElementById("order-phone").value.trim(),
        address: document.getElementById("order-address").value.trim(),
        website: checkoutForm.elements.website?.value || ""
    };

    const payload = {
        customer,
        items: cartEntries.map(([productId, quantity]) => ({
            id: Number(productId),
            quantity
        }))
    };

    checkoutStatus.textContent = "Sending order request...";
    checkoutStatus.style.color = "var(--red)";

    try {
        const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "There was a problem with your order.");
        }

        checkoutStatus.textContent = `Order request sent successfully. Reference: ${result.orderId}`;
        checkoutStatus.style.color = "#7ee081";
        cart.clear();
        renderCart();
        checkoutForm.reset();
    } catch (error) {
        checkoutStatus.textContent = error.message || "There was a problem with your order.";
        checkoutStatus.style.color = "#ff8b8b";
    }
});

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

renderProducts();
renderCart();

const initialProductCount = document.getElementById("product-count");
if (initialProductCount) {
    initialProductCount.textContent = `${products.length} PRODUCTS`;
}

window.addEventListener("DOMContentLoaded", () => {
    renderProducts();
    renderCart();
});

window.addEventListener("load", () => {
    renderProducts();
    renderCart();
});
