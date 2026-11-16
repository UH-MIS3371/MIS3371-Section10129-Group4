
"use strict";

// =====================================================
// BURGER SHOT REWARDS SYSTEM - FRONTEND
// =====================================================
// One point covers $0.10; rewards must cover the full price.
// This classroom demo uses a fixed 100-point balance.
// Customers choose a menu item and a future pickup time.

const POINT_VALUE = 0.10;
const CUSTOMER_POINTS = 100;

const API_URL =
    "https://3ds4bq9hjb.execute-api.us-east-1.amazonaws.com/api/rewards";

// Frontend menu for displaying choices and estimating points.
// The backend independently checks the official prices.
const MENU_ITEMS = {
    meals: {
        cheeseburger: { name: "Cheeseburger", price: 4 },
        hamburger: { name: "Hamburger", price: 3 },
        fries: { name: "Fries", price: 2 }
    },
    drink: {
        soda: { name: "Soda", price: 2 },
        shake: { name: "Shake", price: 3 }
    },
    merch: {
        tshirt: { name: "T-Shirt", price: 20 }
    }
};

// =====================================================
// FIND FORM ELEMENTS
// =====================================================

const form = document.querySelector("#rewardForm");
const emailInput = document.querySelector("#customerId");
const pickupDateTimeInput = document.querySelector("#pickupDateTime");
const categoryInput = document.querySelector("#category");
const rewardItemInput = document.querySelector("#rewardItem");
const commentsInput = document.querySelector("#comments");
const receiptInput = document.querySelector("#receiptAttached");
const submitRewardButton = document.querySelector("#submitRewardButton");

const availablePoints = document.querySelector("#availablePoints");
const selectedPrice = document.querySelector("#selectedPrice");
const rewardMessage = document.querySelector("#rewardMessage");

// Confirmation and saved-transaction lookup elements.
const confirmationPanel = document.querySelector("#confirmationPanel");
const confirmationNumber = document.querySelector("#confirmationNumber");
const statusLookupForm = document.querySelector("#statusLookupForm");
const statusTransactionIdInput = document.querySelector("#statusTransactionId");
const statusMessage = document.querySelector("#statusMessage");
const statusResult = document.querySelector("#statusResult");

const viewedTransactionId = document.querySelector("#viewedTransactionId");
const viewedStatus = document.querySelector("#viewedStatus");
const viewedItem = document.querySelector("#viewedItem");
const viewedPrice = document.querySelector("#viewedPrice");
const viewedPickup = document.querySelector("#viewedPickup");
const viewedSubmittedAt = document.querySelector("#viewedSubmittedAt");
const viewedPoints = document.querySelector("#viewedPoints");

// Let JavaScript show our own validation messages.
form.noValidate = true;

// Display the demo balance.
availablePoints.textContent = CUSTOMER_POINTS;

// =====================================================
// PICKUP DATE AND TIME
// =====================================================

// Format a date for an HTML datetime-local field.
function formatLocalDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hour}:${minute}`;
}

// The earliest selectable pickup time is the next minute.
function updatePickupMinimum() {
    const nextMinute = new Date(
        (Math.floor(Date.now() / 60000) + 1) * 60000
    );

    pickupDateTimeInput.min = formatLocalDateTime(nextMinute);
}

// Display stored UTC timestamps in the viewer's local time.
function displayDateTime(isoString) {
    if (!isoString) return "Not recorded";

    const date = new Date(isoString);

    return Number.isNaN(date.getTime())
        ? "Unavailable"
        : date.toLocaleString();
}

updatePickupMinimum();

pickupDateTimeInput.addEventListener(
    "focus",
    updatePickupMinimum
);

// =====================================================
// MENU DROPDOWNS AND POINT CALCULATIONS
// =====================================================

// Find the selected Burger Shot item.
function getSelectedItem() {
    const category = categoryInput.value;
    const itemId = rewardItemInput.value;

    if (!Object.prototype.hasOwnProperty.call(
        MENU_ITEMS, category
    )) {
        return null;
    }

    return Object.prototype.hasOwnProperty.call(
        MENU_ITEMS[category], itemId
    )
        ? MENU_ITEMS[category][itemId]
        : null;
}

// Change the items whenever the customer changes category.
function updateItemChoices() {
    rewardItemInput.innerHTML =
        '<option value="">Choose an item</option>';

    const category = categoryInput.value;

    const items = Object.prototype.hasOwnProperty.call(
        MENU_ITEMS, category
    )
        ? MENU_ITEMS[category]
        : null;

    rewardItemInput.disabled = !items;

    if (items) {
        for (const [itemId, item] of Object.entries(items)) {
            const option = document.createElement("option");

            option.value = itemId;
            option.textContent =
                `${item.name} - $${item.price.toFixed(2)}`;

            rewardItemInput.appendChild(option);
        }
    }

    // Clear the previous item price and eligibility message.
    selectedPrice.textContent = "";
    rewardMessage.textContent = "";
}

// Show the price and required points for the selected item.
function updateRewardMessage() {
    const item = getSelectedItem();

    if (!item) {
        selectedPrice.textContent = "";
        rewardMessage.textContent = "";
        return;
    }

    const priceCents = Math.round(item.price * 100);
    const pointsRequired =
        priceCents / (POINT_VALUE * 100);

    selectedPrice.textContent =
        `Selected Item: ${item.name} | ` +
        `Price: $${item.price.toFixed(2)} | ` +
        `Points Required: ${pointsRequired}`;

    // Check whether the customer has enough points.
    if (pointsRequired > CUSTOMER_POINTS) {
        rewardMessage.textContent =
            `NOT ENOUGH POINTS: You need ${pointsRequired} ` +
            `points, but you only have ${CUSTOMER_POINTS}.`;
    } else {
        rewardMessage.textContent =
            `ENOUGH POINTS: You can redeem ${item.name} ` +
            `using ${pointsRequired} points. ` +
            `Final price: $0.00`;
    }
}

// Connect the dropdowns to JavaScript.
categoryInput.addEventListener("change", updateItemChoices);
rewardItemInput.addEventListener("change", updateRewardMessage);

// Set up the dropdown when the page first loads.
updateItemChoices();

// =====================================================
// VALIDATE, SUBMIT, AND SAVE A REWARD
// =====================================================

async function handleDemoSubmit(event) {
    event.preventDefault();

    // Hide previous confirmation and lookup results.
    confirmationPanel.hidden = true;
    statusResult.hidden = true;
    statusMessage.textContent = "";

    // Refresh the earliest allowed pickup time.
    updatePickupMinimum();

    // Collect customer information.
    const customerId = emailInput.value.trim();
    const pickupLocal = pickupDateTimeInput.value;
    const category = categoryInput.value;
    const rewardItem = rewardItemInput.value;
    const selectedItem = getSelectedItem();
    const comments = commentsInput.value.trim();

    const errors = [];

    // =============================================
    // VALIDATE EMAIL
    // =============================================

    if (!customerId) {
        errors.push("Email address is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerId)) {
        errors.push("Enter a valid email address.");
    }

    // =============================================
    // VALIDATE PICKUP DATE AND TIME
    // =============================================

    // datetime-local has no timezone.
    // Interpret it in the browser's local time and
    // convert it to UTC before sending it to AWS.

    let pickupAt = null;

    if (!pickupLocal) {
        errors.push("Pickup date and time are required.");
    } else {
        const pickupDate = new Date(pickupLocal);

        if (Number.isNaN(pickupDate.getTime())) {
            errors.push("Enter a valid pickup date and time.");
        } else if (
            pickupDate.getTime() <= Date.now() ||
            !pickupDateTimeInput.checkValidity()
        ) {
            errors.push(
                "Pickup date and time must be in the future."
            );
        } else {
            pickupAt = pickupDate.toISOString();
        }
    }

    // =============================================
    // VALIDATE CATEGORY AND ITEM
    // =============================================

    if (!Object.prototype.hasOwnProperty.call(
        MENU_ITEMS, category
    )) {
        errors.push("Choose a valid reward category.");
    }

    if (!rewardItem || !selectedItem) {
        errors.push("Choose a valid menu item.");
    }

    // =============================================
    // VALIDATE COMMENTS
    // =============================================

    if (!comments) {
        errors.push("Comments / Review is required.");
    }

    // Reject incomplete information.
    if (errors.length > 0) {
        rewardMessage.textContent =
            "REJECTED: " + errors.join(" ");

        return;
    }

    // =============================================
    // PREPARE DATA FOR AWS
    // =============================================

    // The browser does NOT submit an item price.
    // Lambda gets the official price from backend.js.
    const rewardData = {
        customerId,
        pickupAt,
        category,
        rewardItem,
        comments,
        receiptAttached: receiptInput.checked
    };

    // Prevent double-clicking during submission.
    submitRewardButton.disabled = true;

    try {
        rewardMessage.textContent = "Submitting reward...";

        // Send the reward to API Gateway.
        const response = await fetch(API_URL, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(rewardData)
        });

        const result = await response.json();

        // =============================================
        // APPROVED AND SAVED TRANSACTION
        // =============================================

        // Only show a confirmation after a successful
        // DynamoDB write.
        if (
            response.ok &&
            result.success === true &&
            result.persisted === true &&
            result.transactionId
        ) {

            // Clear the reward form after a successful save.
            form.reset();
            updateItemChoices();
            updatePickupMinimum();

            rewardMessage.textContent =
                "APPROVED: " + result.message +
                " Points required: " + result.pointsRequired;

            // Show the saved confirmation number.
            confirmationNumber.textContent =
                result.transactionId;

            confirmationPanel.hidden = false;

            // Auto-fill the View Status form.
            statusTransactionIdInput.value =
                result.transactionId;

        } else if (result.success === true) {

            // Validation passed, but saving was not confirmed.
            rewardMessage.textContent =
                "ERROR: Reward was not confirmed as saved.";

        } else {

            // Display validation or server errors.
            rewardMessage.textContent =
                (response.status >= 500
                    ? "ERROR: "
                    : "REJECTED: ") +
                (result.message ||
                    "Reward request was not completed.");
        }

    } catch (error) {

        rewardMessage.textContent =
            "ERROR: Could not connect to the rewards service.";

        console.error(error);

    } finally {

        // Allow another submission after the request finishes.
        submitRewardButton.disabled = false;
    }
}

// Submit when the customer clicks Submit Request.
form.addEventListener("submit", handleDemoSubmit);

// =====================================================
// VIEW SAVED TRANSACTION STATUS
// =====================================================

async function handleStatusLookup(event) {
    event.preventDefault();

    // Hide the previously retrieved transaction.
    statusResult.hidden = true;

    const transactionId =
        statusTransactionIdInput.value.trim();

    if (!transactionId) {
        statusMessage.textContent =
            "Please enter a confirmation number.";

        return;
    }

    try {
        statusMessage.textContent =
            "Searching for transaction...";

        // Retrieve the saved transaction from API Gateway.
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(transactionId)}`,
            {
                method: "GET"
            }
        );

        const result = await response.json();

        if (
            !response.ok ||
            result.success !== true ||
            !result.transaction
        ) {
            statusMessage.textContent =
                result.message || "Transaction not found.";

            return;
        }

        // Read the saved transaction returned by DynamoDB.
        const transaction = result.transaction;

        // =============================================
        // DISPLAY SAVED INFORMATION
        // =============================================

        viewedTransactionId.textContent =
            transaction.transactionId;

        viewedStatus.textContent =
            transaction.status || "Unavailable";

        viewedItem.textContent =
            transaction.itemName || "Not recorded";

        viewedPrice.textContent =
            typeof transaction.itemPrice === "number"
                ? `$${transaction.itemPrice.toFixed(2)}`
                : "Not recorded";

        viewedPickup.textContent =
            displayDateTime(transaction.pickupAt);

        viewedSubmittedAt.textContent =
            displayDateTime(transaction.submittedAt);

        viewedPoints.textContent =
            transaction.pointsRequired ?? "Unavailable";

        statusResult.hidden = false;

        statusMessage.textContent =
            "Transaction found successfully.";

    } catch (error) {

        statusMessage.textContent =
            "ERROR: Could not retrieve transaction.";

        console.error(error);
    }
}

// Run the lookup when the customer clicks View Status.
statusLookupForm.addEventListener(
    "submit",
    handleStatusLookup
);
