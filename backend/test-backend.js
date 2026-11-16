
"use strict";

// MIS 3371 - Burger Shot Backend Tests
// Run from the project root:
// node backend/test-backend.js

const {
    processReward,
    calculateEarnedPoints
} = require("./backend");

// =====================================================
// TEST INFORMATION
// =====================================================

// Generate future and past pickup times automatically.
// This keeps the tests working on different dates.

const futurePickup =
    new Date(Date.now() + 60 * 60 * 1000).toISOString();

const pastPickup =
    new Date(Date.now() - 60 * 60 * 1000).toISOString();

const baseReward = {
    customerId: "customer@example.com",
    pickupAt: futurePickup,
    category: "meals",
    rewardItem: "cheeseburger",
    comments: "Great burgers!",
    receiptAttached: false
};

// =====================================================
// REDEMPTION TEST CASES
// =====================================================

const redemptionTests = [

    {
        name: "Valid cheeseburger, 40 points",
        reward: { ...baseReward },
        ok: true,
        points: 40
    },

    {
        name: "Valid hamburger, 30 points",
        reward: {
            ...baseReward,
            rewardItem: "hamburger"
        },
        ok: true,
        points: 30
    },

    {
        name: "Valid fries, 20 points",
        reward: {
            ...baseReward,
            rewardItem: "fries"
        },
        ok: true,
        points: 20
    },

    {
        name: "Valid soda, 20 points",
        reward: {
            ...baseReward,
            category: "drink",
            rewardItem: "soda"
        },
        ok: true,
        points: 20
    },

    {
        name: "Valid shake, 30 points",
        reward: {
            ...baseReward,
            category: "drink",
            rewardItem: "shake"
        },
        ok: true,
        points: 30
    },

    {
        name: "T-shirt needs 200 points",
        reward: {
            ...baseReward,
            category: "merch",
            rewardItem: "tshirt"
        },
        ok: false
    },

    {
        name: "Missing email",
        reward: {
            ...baseReward,
            customerId: ""
        },
        ok: false
    },

    {
        name: "Invalid email",
        reward: {
            ...baseReward,
            customerId: "not-an-email"
        },
        ok: false
    },

    {
        name: "Missing pickup",
        reward: {
            ...baseReward,
            pickupAt: ""
        },
        ok: false
    },

    {
        name: "Past pickup",
        reward: {
            ...baseReward,
            pickupAt: pastPickup
        },
        ok: false
    },

    {
        name: "Bad pickup format",
        reward: {
            ...baseReward,
            pickupAt: "tomorrow"
        },
        ok: false
    },

    {
        name: "Unknown item",
        reward: {
            ...baseReward,
            rewardItem: "pizza"
        },
        ok: false
    },

    {
        name: "Unknown category",
        reward: {
            ...baseReward,
            category: "other"
        },
        ok: false
    },

    {
        name: "Missing comments",
        reward: {
            ...baseReward,
            comments: ""
        },
        ok: false
    },

    {
        name: "Price manipulation",
        reward: {
            ...baseReward,
            itemPrice: 0.01
        },
        ok: false
    }
];

// =====================================================
// RUN REDEMPTION TESTS
// =====================================================

let passed = 0;
let total = 0;

for (const test of redemptionTests) {

    const result = processReward(test.reward);

    const matchesSuccess =
        result.success === test.ok;

    const matchesPoints =
        test.points === undefined ||
        (
            result.success &&
            result.pointsRequired === test.points
        );

    const good =
        matchesSuccess && matchesPoints;

    passed += Number(good);
    total += 1;

    console.log(
        `${good ? "PASS" : "FAIL"} | ${test.name}`
    );
}

// =====================================================
// TEST EARNED POINTS
// =====================================================

// Keep the existing earn-points calculation tested.
for (const amount of [1, 10, 100, 15.5]) {

    const result = calculateEarnedPoints(amount);

    const good =
        result.success &&
        result.pointsEarned === amount;

    passed += Number(good);
    total += 1;

    console.log(
        `${good ? "PASS" : "FAIL"} | Earn ${amount} points`
    );
}

// =====================================================
// FINAL RESULTS
// =====================================================

console.log(`\n${passed}/${total} tests passed.`);

if (passed !== total) {
    process.exitCode = 1;
}
