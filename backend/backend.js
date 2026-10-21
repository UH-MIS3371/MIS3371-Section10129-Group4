"use strict";

// MIS 3371 Week 8 - trusted local rules for a burger chain loyalty program.
// Earn 1 point per $1 spent; redeem each point for $0.10.
// Week 8 is local logic only: no form connection, database, or point deduction.

const POINTS_PER_DOLLAR = 1;
const POINT_VALUE = 0.10;
const CUSTOMER_POINTS = 100; // Demo balance, not a real customer account
let demoSequence = 0;

function fail(message) {
  return { success: false, message };
}

// Separate earning calculation for testing the new earning rule.
// This does not save a purchase or add points to a customer account.
function calculateEarnedPoints(amountSpent) {
  if (amountSpent === "" || amountSpent === null || amountSpent === undefined) {
    return fail("Purchase amount is required.");
  }
  const amount = Number(amountSpent);
  if (!Number.isFinite(amount) || amount <= 0) {
    return fail("Purchase amount must be greater than $0.");
  }
  const cents = Math.round(amount * 100);
  if (Math.abs(amount * 100 - cents) > 0.000001) {
    return fail("Purchase amount must be in whole cents.");
  }
  return {
    success: true,
    amountSpent: cents / 100,
    pointsEarned: (cents * POINTS_PER_DOLLAR) / 100
  };
}

function processReward(reward) {
  if (!reward || typeof reward !== "object" || Array.isArray(reward)) {
    return fail("Reward transaction data is required.");
  }

  const customerId = String(reward.customerId || "").trim();
  const claimDate = String(reward.claimDate || "").trim();
  const category = String(reward.category || "").trim();
  const comments = String(reward.comments || "").trim();

  if (!customerId) {
    return fail("Email address is required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerId)) {
    return fail("Enter a valid email address.");
  }
  if (!claimDate) return fail("Claim date is required.");
  if (!["drink", "meals", "merch", "other"].includes(category)) {
    return fail("Choose a valid reward category.");
  }
  if (!comments) return fail("Comments / Review is required.");
  if (reward.itemPrice === "" || reward.itemPrice === undefined || reward.itemPrice === null) {
    return fail("Item price is required.");
  }
  const itemPrice = Number(reward.itemPrice);
  if (!Number.isFinite(itemPrice) || itemPrice <= 0) {
    return fail("Item price must be greater than $0.");
  }

  const priceCents = Math.round(itemPrice * 100);
  if (Math.abs(itemPrice * 100 - priceCents) > 0.000001) {
    return fail("Item price must be in whole cents.");
  }

  // Each point is worth 10 cents; full redemption must cover every cent.
  const pointsRequired = priceCents / (100 * POINT_VALUE);
  if (pointsRequired > CUSTOMER_POINTS) {
    return fail(`Not enough points. Need ${pointsRequired}, have ${CUSTOMER_POINTS}.`);
  }

  demoSequence += 1;
  return {
    success: true,
    status: "Validated",
    transactionId: `RWD-${Date.now()}-${demoSequence}`,
    submittedAt: new Date().toISOString(),
    customerId,
    pointsRequired,
    finalPrice: 0,
    remainingPointsIfRedeemed: Number((CUSTOMER_POINTS - pointsRequired).toFixed(2)),
    message: "Reward is eligible. Full item price is covered."
  };
}

module.exports = { processReward, calculateEarnedPoints };
