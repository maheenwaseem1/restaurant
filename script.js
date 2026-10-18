"use strict";
//  HELPER FUNCTIONS 

const $ = (selector) => document.querySelector(selector);

const $$ = (selector) => document.querySelectorAll(selector);

function getStoredData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);

        return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
        console.error("Could not read saved data:", error);
        return fallback;
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error("Could not save data:", error);
        showToast("Could not save data in this browser.");
        return false;
    }
}

function formatPrice(price) {
    return "Rs. " + Number(price).toLocaleString("en-PK");
}

function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.className = "form-message " + type;
}

function clearMessage(element) {
    if (!element) return;

    element.textContent = "";
    element.className = "form-message";
}


//  ELEMENTS 

// Authentication
const loginScreen = $("#login");
const signupScreen = $("#signup");
const restaurantApp = $("#restaurant-app");

const loginForm = $("#login-form");
const signupForm = $("#signup-form");

const loginEmail = $("#login-email");
const loginPassword = $("#login-password");

const signupName = $("#signup-name");
const signupEmail = $("#signup-email");
const signupPassword = $("#signup-password");

const loginMessage = $("#login-message");
const signupMessage = $("#signup-message");

const openSignupButton = $("#open-signup");
const openLoginButton = $("#open-login");
const logoutButton = $("#logout-button");

// Cart
const cartToggle = $("#cart-toggle");
const cartCount = $("#cart-count");
const cartDrawer = $("#cart-drawer");
const cartOverlay = $("#cart-overlay");
const closeCartButton = $("#close-cart");
const continueShoppingButton = $("#continue-shopping");

const cartItemsContainer = $("#cart-items");
const cartTotalElement = $("#cart-total");
const confirmOrderButton = $("#confirm-order");

// Order popup
const orderModal = $("#order-modal");
const closeOrderModalButton = $("#close-order-modal");
const orderReferenceElement = $("#order-reference");
const orderSummaryElement = $("#order-summary");
const orderTotalElement = $("#order-total");

// Reservation
const reservationForm = $("#reservation-form");
const bookingStatus = $("#booking-message-status");

// Toast
const toastElement = $("#toast");


//  APP DATA 

let users = getStoredData("aif_demo_users", []);
let currentUser = getStoredData("aif_demo_current_user", null);
let cart = getStoredData("aif_demo_cart", []);
let toastTimeout = null;


//  TOAST 

function showToast(message) {
    if (!toastElement) return;

    toastElement.textContent = message;
    toastElement.classList.add("show");

    clearTimeout(toastTimeout);

    toastTimeout = setTimeout(() => {
        toastElement.classList.remove("show");
    }, 2800);
}


//  SCREEN NAVIGATION 

function showScreen(screenName) {
    const showLogin = screenName === "login";
    const showSignup = screenName === "signup";
    const showWebsite = screenName === "website";

    if (loginScreen) {
        loginScreen.hidden = !showLogin;
    }

    if (signupScreen) {
        signupScreen.hidden = !showSignup;
    }

    if (restaurantApp) {
        restaurantApp.hidden = !showWebsite;
    }

    if (showLogin) {
        clearMessage(loginMessage);
        loginForm?.reset();
    }

    if (showSignup) {
        clearMessage(signupMessage);
        signupForm?.reset();
    }

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}


//  LOGIN / SIGNUP 

function normalizeEmail(email) {
    return email.trim().toLowerCase();
}

function findUser(email) {
    return users.find(
        user => normalizeEmail(user.email) === normalizeEmail(email)
    );
}

function enterWebsite(user) {
    currentUser = {
        name: user.name,
        email: normalizeEmail(user.email)
    };

    if (!saveData("aif_demo_current_user", currentUser)) {
        currentUser = null;
        return;
    }

    cart = getStoredData("aif_demo_cart", []);

    showScreen("website");
    renderCart();

    showToast("Welcome, " + user.name + "!");

    // Update the booking name when possible.
    const bookingName = $("#customer-name");

    if (bookingName && !bookingName.value) {
        bookingName.value = user.name;
    }
}


// Open signup
openSignupButton?.addEventListener("click", () => {
    showScreen("signup");
});


// Open login
openLoginButton?.addEventListener("click", () => {
    showScreen("login");
});


// Signup
signupForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = signupName.value.trim();
    const email = normalizeEmail(signupEmail.value);
    const password = signupPassword.value;

    if (name.length < 2) {
        showMessage(
            signupMessage,
            "Please enter your full name."
        );
        return;
    }

    if (!email || !signupEmail.checkValidity()) {
        showMessage(
            signupMessage,
            "Please enter a valid email address."
        );
        return;
    }

    if (password.length < 6) {
        showMessage(
            signupMessage,
            "Password must contain at least 6 characters."
        );
        return;
    }

    if (findUser(email)) {
        showMessage(
            signupMessage,
            "An account with this email already exists."
        );
        return;
    }

    const newUser = {
        name,
        email,
        password
    };

    users.push(newUser);

    if (!saveData("aif_demo_users", users)) {
        users = users.filter(user => user.email !== email);
        return;
    }

    showMessage(
        signupMessage,
        "Account created successfully! Opening your website...",
        "success"
    );

    // Automatically sign in after successful demo signup.
    setTimeout(() => {
        enterWebsite(newUser);
    }, 700);
});


// Login
loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = normalizeEmail(loginEmail.value);
    const password = loginPassword.value;

    const user = findUser(email);

    if (!user || user.password !== password) {
        showMessage(
            loginMessage,
            "Incorrect email or password. Please try again."
        );
        return;
    }

    showMessage(
        loginMessage,
        "Login successful! Welcome back.",
        "success"
    );

    setTimeout(() => {
        enterWebsite(user);
    }, 350);
});


// Logout
logoutButton?.addEventListener("click", () => {
    closeCart();

    currentUser = null;

    try {
        localStorage.removeItem("aif_demo_current_user");
    } catch (error) {
        console.error("Could not log out:", error);
    }

    showScreen("login");
    showToast("You have logged out.");
});


//  CART STORAGE 

function saveCart() {
    return saveData("aif_demo_cart", cart);
}

function getCartQuantity() {
    return cart.reduce((total, item) => {
        return total + item.quantity;
    }, 0);
}

function getCartTotal() {
    return cart.reduce((total, item) => {
        return total + item.price * item.quantity;
    }, 0);
}


//  ADD TO CART 

$$(".add-button").forEach(button => {
    button.addEventListener("click", () => {
        if (!currentUser) {
            showToast("Please sign in to add items to your cart.");
            showScreen("login");
            return;
        }

        const name = button.dataset.name;
        const price = Number(button.dataset.price);

        if (!name || !Number.isFinite(price) || price < 0) {
            showToast("This menu item has invalid details.");
            return;
        }

        const existingItem = cart.find(
            item => item.name === name
        );

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                name,
                price,
                quantity: 1
            });
        }

        if (!saveCart()) {
            cart = getStoredData("aif_demo_cart", []);
            renderCart();
            return;
        }

        renderCart();
        showToast(name + " added to your cart.");
    });
});


//  RENDER CART 

function renderCart() {
    if (!cartItemsContainer) return;

    cart = cart.filter(item => {
        return (
            item &&
            typeof item.name === "string" &&
            Number.isFinite(Number(item.price)) &&
            Number(item.price) >= 0 &&
            Number.isInteger(Number(item.quantity)) &&
            Number(item.quantity) > 0
        );
    });

    cart.forEach(item => {
        item.price = Number(item.price);
        item.quantity = Number(item.quantity);
    });

    if (cartCount) {
        cartCount.textContent = getCartQuantity();
    }

    if (cartTotalElement) {
        cartTotalElement.textContent = formatPrice(getCartTotal());
    }

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="cart-empty">
                <div>
                    <h3>Your cart is waiting.</h3>
                    <p>Add something delicious from our menu.</p>
                </div>
            </div>
        `;

        if (confirmOrderButton) {
            confirmOrderButton.disabled = true;
        }

        return;
    }

    if (confirmOrderButton) {
        confirmOrderButton.disabled = false;
    }

    cartItemsContainer.innerHTML = cart.map((item, index) => `
        <div class="cart-item">

            <div>
                <h4>${escapeHTML(item.name)}</h4>

                <p class="cart-item-price">
                    ${formatPrice(item.price * item.quantity)}
                </p>

                <div class="cart-item-controls">

                    <button
                        class="quantity-button"
                        type="button"
                        data-action="decrease"
                        data-index="${index}"
                        aria-label="Decrease ${escapeHTML(item.name)} quantity"
                    >−</button>

                    <span class="cart-quantity">
                        ${item.quantity}
                    </span>

                    <button
                        class="quantity-button"
                        type="button"
                        data-action="increase"
                        data-index="${index}"
                        aria-label="Increase ${escapeHTML(item.name)} quantity"
                    >+</button>

                </div>
            </div>

            <button
                class="remove-item"
                type="button"
                data-action="remove"
                data-index="${index}"
            >
                Remove
            </button>

        </div>
    `).join("");
}


// Escape user-controlled text before placing it into HTML.
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entities[character];
    });
}


//  CART QUANTITY BUTTONS 

cartItemsContainer?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const action = button.dataset.action;
    const index = Number(button.dataset.index);

    if (!Number.isInteger(index) || !cart[index]) {
        return;
    }

    if (action === "increase") {
        cart[index].quantity += 1;
    }

    if (action === "decrease") {
        cart[index].quantity -= 1;

        if (cart[index].quantity <= 0) {
            cart.splice(index, 1);
        }
    }

    if (action === "remove") {
        cart.splice(index, 1);
    }

    if (!saveCart()) {
        cart = getStoredData("aif_demo_cart", []);
        renderCart();
        return;
    }

    renderCart();
});


//  OPEN / CLOSE CART 

function openCart() {
    if (!currentUser) {
        showToast("Please sign in first.");
        showScreen("login");
        return;
    }

    if (cartDrawer) {
        cartDrawer.hidden = false;
    }

    if (cartOverlay) {
        cartOverlay.hidden = false;
    }

    document.body.classList.add("cart-open");
}

function closeCart() {
    if (cartDrawer) {
        cartDrawer.hidden = true;
    }

    if (cartOverlay) {
        cartOverlay.hidden = true;
    }

    document.body.classList.remove("cart-open");
}

cartToggle?.addEventListener("click", openCart);

closeCartButton?.addEventListener("click", closeCart);

continueShoppingButton?.addEventListener("click", closeCart);

cartOverlay?.addEventListener("click", closeCart);


// Close the cart with Escape.
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        closeCart();
        closeOrderModal();
    }
});


//  CONFIRM ORDER 

function generateOrderReference() {
    return "AIF-" +
        Date.now().toString().slice(-8);
}

function openOrderModal() {
    if (orderModal) {
        orderModal.hidden = false;
        document.body.classList.add("modal-open");
    }
}

function closeOrderModal() {
    if (orderModal) {
        orderModal.hidden = true;
    }

    document.body.classList.remove("modal-open");
}

confirmOrderButton?.addEventListener("click", () => {
    if (!currentUser) {
        closeCart();
        showScreen("login");
        showToast("Please sign in first.");
        return;
    }

    if (cart.length === 0) {
        showToast("Your cart is empty.");
        return;
    }

    const orderItems = cart.map(item => ({
        name: item.name,
        price: item.price,
        quantity: item.quantity
    }));

    const orderTotal = getCartTotal();
    const orderReference = generateOrderReference();

    if (orderReferenceElement) {
        orderReferenceElement.textContent = orderReference;
    }

    if (orderTotalElement) {
        orderTotalElement.textContent = formatPrice(orderTotal);
    }

    if (orderSummaryElement) {
        orderSummaryElement.innerHTML = orderItems.map(item => `
            <div class="order-summary-item">
                <span>
                    ${escapeHTML(item.name)} × ${item.quantity}
                </span>

                <strong>
                    ${formatPrice(item.price * item.quantity)}
                </strong>
            </div>
        `).join("");
    }

    // Save a local demo order history.
    const orders = getStoredData("aif_demo_orders", []);

    orders.push({
        reference: orderReference,
        customerEmail: currentUser.email,
        items: orderItems,
        total: orderTotal,
        createdAt: new Date().toISOString()
    });

    if (!saveData("aif_demo_orders", orders)) {
        return;
    }

  
    const previousCart = cart;
    cart = [];

    if (!saveCart()) {
        cart = previousCart;
        return;
    }

    renderCart();
    closeCart();
    openOrderModal();
});

closeOrderModalButton?.addEventListener("click", () => {
    closeOrderModal();
    showToast("Thank you for your order!");
});


// Close order popup by clicking outside.
orderModal?.addEventListener("click", (event) => {
    if (event.target === orderModal) {
        closeOrderModal();
    }
});


//  RESERVATION FORM 

reservationForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!reservationForm.checkValidity()) {
        reservationForm.reportValidity();
        return;
    }

    const formData = new FormData(reservationForm);

    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const date = String(formData.get("date") || "");
    const time = String(formData.get("time") || "");
    const guests = String(formData.get("guests") || "");
    const message = String(formData.get("message") || "").trim();

    if (!name || !email || !date || !time || !guests) {
        showMessage(
            bookingStatus,
            "Please complete all required fields."
        );
        return;
    }

    const selectedDate = new Date(date + "T00:00:00");
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
        showMessage(
            bookingStatus,
            "Please select today or a future date."
        );
        return;
    }

    const reservation = {
        name,
        email,
        date,
        time,
        guests: Number(guests),
        message,
        createdAt: new Date().toISOString()
    };

    const reservations = getStoredData(
        "aif_demo_reservations",
        []
    );

    reservations.push(reservation);

    if (!saveData("aif_demo_reservations", reservations)) {
        return;
    }

    showMessage(
        bookingStatus,
        "Your Reservation Request Has Been Saved.",
        "success"
    );

    reservationForm.reset();

    showToast(" Reservation saved.");
});


//  MENU NAVIGATION 

$$(".main-nav a").forEach(link => {
    link.addEventListener("click", () => {
        closeCart();
    });
});


//  FOOTER YEAR 

const currentYearElement = $("#current-year");

if (currentYearElement) {
    currentYearElement.textContent = new Date().getFullYear();
}


//  RESTORE LOGIN SESSION 

function initializeWebsite() {
    // Re-read stored data when the page starts.
    users = getStoredData("aif_demo_users", []);
    currentUser = getStoredData("aif_demo_current_user", null);
    cart = getStoredData("aif_demo_cart", []);

    if (
        currentUser &&
        typeof currentUser.email === "string" &&
        findUser(currentUser.email)
    ) {
        const user = findUser(currentUser.email);

        enterWebsite(user);
    } else {
        currentUser = null;
        showScreen("login");
    }

    renderCart();
}

initializeWebsite();

console.log("All in One Foods JavaScript loaded successfully.");
