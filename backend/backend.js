
"use strict";

// MIS 3371 - Burger Shot Rewards System
// Business logic shared by local tests and AWS Lambda.
//
// One reward point is worth $0.10.
// A reward must cover the entire selected item's price.
// This demo uses a fixed 100-point balance.
// Points are not actually deducted from customer accounts.

const POINTS_PER_DOLLAR = 1;
const POINT_VALUE = 0.10;
const CUSTOMER_POINTS = 100;

let demoSequence = 0;

// =====================================================
// OFFICIAL BURGER SHOT MENU
// =====================================================

// Official menu prices live on the server.
// Never trust a price supplied by the browser.

const MENU_ITEMS = {
    meals: {
        cheeseburger: {
            name: "Cheeseburger",
            price: 4
        },
        hamburger: {
            name: "Hamburger",
            price: 3
        },
        fries: {
            name: "Fries",
            price: 2
        }
    },

    drink: {
        soda: {
            name: "Soda",
            price: 2
        },
        shake: {
            name: "Shake",
            price: 3
        }
    },

    merch: {
        tshirt: {
            name: "T-Shirt",
            price: 20
        }
    }
};

// =====================================================
// REJECTION HELPER
// =====================================================

// Return a consistent failure response.
function fail(message) {
    return {
        success: false,
        message
    };
}

// =====================================================
// CALCULATE EARNED POINTS
// =====================================================

// Calculate points earned on a separate purchase.
// This feature does not credit points to a real account.

function calculateEarnedPoints(amountSpent) {

    if (
        amountSpent === "" ||
        amountSpent === null ||
        amountSpent === undefined
    ) {
        return fail("Purchase amount is required.");
    }

    const amount = Number(amountSpent);

    if (!Number.isFinite(amount) || amount <= 0) {
        return fail(
            "Purchase amount must be greater than $0."
        );
    }

    const cents = Math.round(amount * 100);

    if (
        Math.abs(amount * 100 - cents) > 0.000001
    ) {
        return fail(
            "Purchase amount must be in whole cents."
        );
    }

    return {
        success: true,
        amountSpent: cents / 100,
        pointsEarned:
            (cents * POINTS_PER_DOLLAR) / 100
    };
}

// =====================================================
// PROCESS A REWARD REQUEST
// =====================================================

function processReward(reward) {

    // Make sure the request contains an object.
    if (
        !reward ||
        typeof reward !== "object" ||
        Array.isArray(reward)
    ) {
        return fail(
            "Reward transaction data is required."
        );
    }

    // Read the submitted customer information.
    const customerId =
        String(reward.customerId || "").trim();

    const pickupAt =
        String(reward.pickupAt || "").trim();

    const category =
        String(reward.category || "").trim();

    const rewardItem =
        String(reward.rewardItem || "").trim();

    const comments =
        String(reward.comments || "").trim();

    // =================================================
    // VALIDATE CUSTOMER EMAIL
    // =================================================

    if (!customerId) {
        return fail("Email address is required.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerId)) {
        return fail("Enter a valid email address.");
    }

    // =================================================
    // VALIDATE PICKUP DATE AND TIME
    // =================================================

    // The frontend sends a UTC timestamp such as:
    // 2026-11-14T18:30:00.000Z
    //
    // Comparing UTC timestamps avoids differences
    // between the customer's timezone and AWS Lambda.

    if (!pickupAt) {
        return fail(
            "Pickup date and time are required."
        );
    }

    const pickupTimestamp = Date.parse(pickupAt);

    // Require a valid UTC ISO timestamp.
    if (
        !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(
            pickupAt
        ) ||
        !Number.isFinite(pickupTimestamp) ||
        new Date(pickupTimestamp).toISOString() !== pickupAt
    ) {
        return fail(
            "Enter a valid pickup date and time."
        );
    }

    // Reject dates or times that have already passed.
    if (pickupTimestamp <= Date.now()) {
        return fail(
            "Pickup date and time must be in the future."
        );
    }

    // =================================================
    // VALIDATE CATEGORY
    // =================================================

    if (
        !Object.prototype.hasOwnProperty.call(
            MENU_ITEMS,
            category
        )
    ) {
        return fail(
            "Choose a valid reward category."
        );
    }

    // =================================================
    // VALIDATE MENU ITEM
    // =================================================

    if (
        !Object.prototype.hasOwnProperty.call(
            MENU_ITEMS[category],
            rewardItem
        )
    ) {
        return fail(
            "Choose a valid menu item."
        );
    }

    // =================================================
    // VALIDATE COMMENTS
    // =================================================

    if (!comments) {
        return fail(
            "Comments / Review is required."
        );
    }

    // =================================================
    // GET OFFICIAL ITEM PRICE
    // =================================================

    const selectedItem =
        MENU_ITEMS[category][rewardItem];

    // Reject attempts to override an official price.
    // New frontend requests do not send itemPrice.
    if (
        Object.prototype.hasOwnProperty.call(
            reward,
            "itemPrice"
        ) &&
        Number(reward.itemPrice) !== selectedItem.price
    ) {
        return fail(
            "Item price does not match the official menu."
        );
    }

    // =================================================
    // CALCULATE REQUIRED POINTS
    // =================================================

    // Work in cents for accurate currency calculations.
    const priceCents =
        Math.round(selectedItem.price * 100);

    // Each point covers 10 cents.
    const pointsRequired =
        priceCents / (100 * POINT_VALUE);

    // Reject if the customer does not have enough points.
    if (pointsRequired > CUSTOMER_POINTS) {
        return fail(
            `Not enough points. Need ${pointsRequired}, ` +
            `have ${CUSTOMER_POINTS}.`
        );
    }

    // =================================================
    // APPROVED REWARD
    // =================================================

    // This ID is for local testing.
    // AWS Lambda creates the final DynamoDB transaction ID.
    demoSequence += 1;

    return {
        success: true,

        status: "Validated",

        transactionId:
            `RWD-${Date.now()}-${demoSequence}`,

        submittedAt:
            new Date().toISOString(),

        // Customer information.
        customerId,

        // Requested pickup time.
        pickupAt,

        // Official menu details.
        category,
        rewardItem,
        itemName: selectedItem.name,
        itemPrice: priceCents / 100,

        // Submitted comments and receipt checkbox.
        comments,

        receiptAttached:
            reward.receiptAttached === true,

        // Reward calculations.
        pointsRequired,

        finalPrice: 0,

        remainingPointsIfRedeemed:
            Number(
                (CUSTOMER_POINTS - pointsRequired).toFixed(2)
            ),

        message:
            "Reward is eligible. Full item price is covered."
    };
}

// =====================================================
// EXPORT FUNCTIONS
// =====================================================

// AWS Lambda and local tests can use these functions.
module.exports = {
    processReward,
    calculateEarnedPoints
};
