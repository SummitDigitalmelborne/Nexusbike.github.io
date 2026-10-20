// NEXUS BIKE — STORE FUNCTIONALITY

const ORDER_API_URL = "/api/orders";

const products = [
    {
        id: 1,
        name: "Performance Controller",
        category: "electrical",
        categoryLabel: "Electrical",
        description: "An upgraded controller for compatible electric dirt bikes.",
        price: 499,
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=700&q=80",
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
        image: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7auto=format&fit=crop&w=700&q=80",
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
        image: "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=700&q=80",
        badge: "HARDWARE"
    },
    {
        id: 8,
        name: "Rear Dropouts",
        category: "components",
        categoryLabel: "Components",
        description: "Replacement dropout components for compatible builds.",
        price: 259,
        image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=700&q=80",
        badge: "COMPONENTS"
    }
];

let activeCategory = "all";
let searchTerm = "";
let cart = [];
let toastTimer;

const productGrid = document.getElementById("product-grid");
const productSearch = document.getElementById("product-search");
const filterButtons = document.getElementById("filter-buttons");
const productCount = document.getElementById("product-count");
const emptyState = document.getElementById("empty-state");
const cartButton = document.getElementById("cart-button");
const cartCount = document.getElementById("cart-count");
const cartDrawer = document.getElementById("cart-drawer");
const cartOverlay = document.getElementById("cart-overlay");
const closeCartButton = document.getElementById("close-cart");
const cartItems = document.getElementById("cart-items");
const cartTotal = document.getElementById("cart-total");
const checkoutButton = document.getElementById("checkout-button");
const checkoutForm = document.getElementById("checkout-form");
const checkoutStatus = document.getElementById("checkout-status");
const productModal = document.getElementById("product-modal");
const closeProductModalButton = document.getElementById("close-product-modal");
const productModalImage = document.getElementById("product-modal-image");
const productModalCategory = document.getElementById("product-modal-category");
const productModalTitle = document.getElementById("product-modal-title");
const productModalDescription = document.getElementById("product-modal-description");
const productModalPrice = document.getElementById("product-modal-price");
const productModalButton = document.getElementById("product-modal-button");
const menuButton = document.getElementById("menu-button");
const navigation = document.getElementById("navigation");
const toast = document.getElementById("toast");

const requiredElements = [
    productGrid, productSearch, filterButtons, productCount, emptyState,
    cartButton, cartCount, cartDrawer, cartOverlay, closeCartButton,
    cartItems, cartTotal, checkoutButton, checkoutForm, checkoutStatus,
    productModal, closeProductModalButton, productModalImage,
    productModalCategory, productModalTitle, productModalDescription,
    productModalPrice, productModalButton, menuButton, navigation, toast
];

if (requiredElements.some(element => !element)) {
    console.error("NEXUS BIKE: A required HTML element is missing. Check index.html.");
} else {
    initialiseStore();
}

function initialiseStore() {
    loadCart();

    productSearch.addEventListener("input", () => {
        searchTerm = productSearch.value.trim().toLowerCase();
        renderProducts();
    });

    filterButtons.addEventListener("click", event => {
        const button = event.target.closest("[data-category]");
        if (!button) return;

        activeCategory = button.dataset.category;

        filterButtons.querySelectorAll(".filter-button").forEach(filter => {
            filter.classList.toggle("active", filter === button);
        });

        renderProducts();
    });

    productGrid.addEventListener("click", event => {
        const addButton = event.target.closest("[data-add]");

        if (addButton) {
            event.stopPropagation();
            addToCart(Number(addButton.dataset.add));
            return;
        }

        const card = event.target.closest(".product-card");
        if (card) openProductModal(Number(card.dataset.productId));
    });

    productGrid.addEventListener("keydown", event => {
        const card = event.target.closest(".product-card");

        if (card && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openProductModal(Number(card.dataset.productId));
        }
    });

    cartItems.addEventListener("click", event => {
        const decrease = event.target.closest("[data-decrease]");
        const increase = event.target.closest("[data-increase]");
        const remove = event.target.closest("[data-remove]");

        if (decrease) changeQuantity(Number(decrease.dataset.decrease), -1);
        else if (increase) changeQuantity(Number(increase.dataset.increase), 1);
        else if (remove) removeFromCart(Number(remove.dataset.remove));
    });

    cartButton.addEventListener("click", openCart);
    closeCartButton.addEventListener("click", closeCart);
    cartOverlay.addEventListener("click", closeCart);
    closeProductModalButton.addEventListener("click", closeProductModal);

    productModal.addEventListener("click", event => {
        if (event.target.closest("[data-close-product-modal]")) {
            closeProductModal();
        }
    });

    productModalButton.addEventListener("click", () => {
        const productId = Number(productModal.dataset.productId);

        if (productId) {
            addToCart(productId);
            closeProductModal();
        }
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") {
            if (cartDrawer.classList.contains("open")) closeCart();
            else if (productModal.classList.contains("open")) closeProductModal();
        }
    });

    menuButton.addEventListener("click", () => {
        const isOpen = navigation.classList.toggle("open");
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Toggle navigation");
        menuButton.textContent = isOpen ? "✕" : "☰";
    });

    navigation.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
            navigation.classList.remove("open");
            menuButton.setAttribute("aria-expanded", "false");
            menuButton.setAttribute("aria-label", "Toggle navigation");
            menuButton.textContent = "☰";
        });
    });

    checkoutForm.addEventListener("submit", submitOrder);

    const yearElement = document.getElementById("current-year");
    if (yearElement) yearElement.textContent = new Date().getFullYear();

    renderProducts();
    renderCart();
}

function loadCart() {
    try {
        const saved = JSON.parse(localStorage.getItem("nexusBikeCart"));

        cart = Array.isArray(saved)
            ? saved.filter(item =>
                products.some(product => product.id === item.id) &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0 &&
                item.quantity <= 99
            ).map(item => ({ id: item.id, quantity: item.quantity }))
            : [];
    } catch (error) {
        console.error("NEXUS BIKE: Could not load the saved cart.", error);
        cart = [];
    }
}

function saveCart() {
    try {
        localStorage.setItem("nexusBikeCart", JSON.stringify(cart));
    } catch (error) {
        console.error("NEXUS BIKE: Could not save the cart.", error);
        showToast("Your browser could not save the cart.");
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD"
    }).format(price);
}

function getProductImage(product) {
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
            <rect width="800" height="600" fill="#222"/>
            <rect x="80" y="70" width="640" height="460" rx="18" fill="#333"/>
            <text x="400" y="340" fill="#fff" font-size="42"
                font-family="Arial,sans-serif" text-anchor="middle"
                font-weight="700">${product.badge}</text>
        </svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getFilteredProducts() {
    return products.filter(product => {
        const matchesCategory =
            activeCategory === "all" || product.category === activeCategory;

        const searchText = [
            product.name,
            product.description,
            product.categoryLabel,
            product.badge
        ].join(" ").toLowerCase();

        return matchesCategory && searchText.includes(searchTerm);
    });
}

function renderProducts() {
    const filteredProducts = getFilteredProducts();

    productCount.textContent =
        `${String(filteredProducts.length).padStart(2, "0")} PRODUCTS`;

    productGrid.innerHTML = filteredProducts.map(product => `
        <article class="product-card" data-product-id="${product.id}"
            tabindex="0" role="button"
            aria-label="View product details for ${product.name}">
            <div class="product-image-wrap">
                <img class="product-image"
                    src="${product.image}"
                    alt="${product.name}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${getProductImage(product)}';">
                <span class="product-badge">${product.badge}</span>
            </div>
            <div class="product-info">
                <p class="product-category">${product.categoryLabel}</p>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-bottom">
                    <span class="product-price">${formatPrice(product.price)}</span>
                    <button class="add-button" data-add="${product.id}"
                        aria-label="Add ${product.name} to cart"
                        title="Add to cart">+</button>
                </div>
            </div>
        </article>
    `).join("");

    emptyState.hidden = filteredProducts.length !== 0;
}

function addToCart(productId) {
    const product = products.find(item => item.id === productId);
    if (!product) return;

    const existing = cart.find(item => item.id === productId);

    if (existing) {
        if (existing.quantity >= 99) {
            showToast("Maximum quantity reached.");
            return;
        }

        existing.quantity += 1;
    } else {
        cart.push({ id: productId, quantity: 1 });
    }

    saveCart();
    renderCart();
    showToast(`${product.name} added to your cart.`);
}

function changeQuantity(productId, change) {
    const item = cart.find(entry => entry.id === productId);
    if (!item) return;

    item.quantity += change;

    if (item.quantity <= 0) {
        cart = cart.filter(entry => entry.id !== productId);
    } else if (item.quantity > 99) {
        item.quantity = 99;
        showToast("Maximum quantity reached.");
    }

    saveCart();
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
    showToast("Product removed from your cart.");
}

function getCartQuantity() {
    return cart.reduce((total, item) => total + item.quantity, 0);
}

function getCartSubtotal() {
    return cart.reduce((total, item) => {
        const product = products.find(entry => entry.id === item.id);
        return total + (product ? product.price * item.quantity : 0);
    }, 0);
}

function renderCart() {
    cartCount.textContent = getCartQuantity();

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="cart-empty">
                <h3>Your cart is empty.</h3>
                <p style="margin-top:10px;">
                    Explore the collection to find your next upgrade.
                </p>
            </div>`;
    } else {
        cartItems.innerHTML = cart.map(item => {
            const product = products.find(entry => entry.id === item.id);
            if (!product) return "";

            return `
                <div class="cart-item">
                    <div>
                        <h3 class="cart-item-name">${product.name}</h3>
                        <p class="cart-item-price">${formatPrice(product.price)} each</p>
                        <div class="cart-item-actions">
                            <button class="quantity-button"
                                data-decrease="${product.id}"
                                aria-label="Decrease ${product.name} quantity">−</button>
                            <span class="quantity-number">${item.quantity}</span>
                            <button class="quantity-button"
                                data-increase="${product.id}"
                                aria-label="Increase ${product.name} quantity">+</button>
                            <button class="remove-button"
                                data-remove="${product.id}">REMOVE</button>
                        </div>
                    </div>
                    <span class="cart-item-total">
                        ${formatPrice(product.price * item.quantity)}
                    </span>
                </div>`;
        }).join("");
    }

    cartTotal.textContent = formatPrice(getCartSubtotal());
    checkoutButton.disabled = cart.length === 0;
}

function openCart() {
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("open");
    cartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
    closeCartButton.focus();
}

function closeCart() {
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("open");
    cartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
    cartButton.focus();
}

function openProductModal(productId) {
    const product = products.find(item => item.id === productId);
    if (!product) return;

    productModal.dataset.productId = String(productId);

    productModalImage.onerror = () => {
        productModalImage.onerror = null;
        productModalImage.src = getProductImage(product);
    };

    productModalImage.src = product.image;
    productModalImage.alt = product.name;
    productModalCategory.textContent = product.categoryLabel;
    productModalTitle.textContent = product.name;
    productModalDescription.textContent = product.description;
    productModalPrice.textContent = formatPrice(product.price);
    productModalButton.disabled = false;
    productModalButton.textContent = "ADD TO CART";

    productModal.classList.add("open");
    productModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    closeProductModalButton.focus();
}

function closeProductModal() {
    productModal.classList.remove("open");
    productModal.setAttribute("aria-hidden", "true");
    delete productModal.dataset.productId;
    document.body.classList.remove("modal-open");
}

async function submitOrder(event) {
    event.preventDefault();

    if (cart.length === 0) {
        showToast("Your cart is empty.");
        return;
    }

    const formData = new FormData(checkoutForm);

    if (String(formData.get("website") || "").trim() !== "") {
        checkoutStatus.textContent = "Unable to submit this order.";
        return;
    }

    const customer = {
        name: String(formData.get("name") || "").trim(),
        email: String(formData.get("email") || "").trim(),
        phone: String(formData.get("phone") || "").trim(),
        address: String(formData.get("address") || "").trim()
    };

    if (!customer.name || !customer.email || !customer.phone || !customer.address) {
        checkoutStatus.textContent = "Please complete all required fields.";
        return;
    }

    const originalButtonContent = checkoutButton.innerHTML;
    checkoutButton.disabled = true;
    checkoutButton.textContent = "SENDING ORDER...";
    checkoutStatus.textContent = "Submitting your order request...";

    try {
        const response = await fetch(ORDER_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                customer,
                items: cart.map(item => ({
                    id: Number(item.id),
                    quantity: Number(item.quantity)
                }))
            })
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || result.success !== true) {
            throw new Error(result.error || "The order could not be submitted. Please try again.");
        }

        cart = [];
        saveCart();
        renderCart();
        checkoutForm.reset();

        checkoutStatus.textContent =
            "Order request submitted! NEXUS BIKE will contact you to confirm shipping and payment.";

        showToast("Order request submitted successfully.");
    } catch (error) {
        console.error("NEXUS BIKE: Order submission failed.", error);

        checkoutStatus.textContent =
            "We couldn't send your request. Please try again or contact NEXUS BIKE directly.";

        showToast(error instanceof Error ? error.message : "Order submission failed.");
    } finally {
        checkoutButton.innerHTML = originalButtonContent;
        renderCart();
    }
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}
