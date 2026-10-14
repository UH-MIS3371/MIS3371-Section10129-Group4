"use strict";

// Run from the root of the project: node backend/test-backend.js
const { processReward, calculateEarnedPoints } = require("./backend");

const baseReward = {
  customerId: "C001",
  claimDate: "2026-10-14",
  category: "drink",
  itemPrice: 10,
  comments: "Great coffee!",
  receiptAttached: false
};

// 2 valid, 2 invalid, 2 boundary cases, plus an extra fractional-price case.
const redemptionTests = [
  { name: "Valid $5 item", reward: { ...baseReward, itemPrice: 5 }, expectedSuccess: true, expectedPoints: 50 },
  { name: "Valid $9.99 item", reward: { ...baseReward, itemPrice: 9.99 }, expectedSuccess: true, expectedPoints: 99.9 },
  { name: "Invalid missing customer ID", reward: { ...baseReward, customerId: "" }, expectedSuccess: false },
  { name: "Invalid zero price", reward: { ...baseReward, itemPrice: 0 }, expectedSuccess: false },
  { name: "Boundary exactly $10", reward: { ...baseReward, itemPrice: 10 }, expectedSuccess: true, expectedPoints: 100 },
  { name: "Boundary $10.01", reward: { ...baseReward, itemPrice: 10.01 }, expectedSuccess: false },
  { name: "Extra: fractional $7.55", reward: { ...baseReward, itemPrice: 7.55 }, expectedSuccess: true, expectedPoints: 75.5 }
];

let passed = 0;
let total = 0;

for (const test of redemptionTests) {
  const result = processReward(test.reward);
  const correctStatus = result.success === test.expectedSuccess;
  const correctPoints = test.expectedPoints === undefined ||
    (result.success && Math.abs(result.pointsRequired - test.expectedPoints) < 0.000001);
  const ok = correctStatus && correctPoints;
  passed += Number(ok);
  total += 1;
  console.log(`${ok ? "PASS" : "FAIL"} | ${test.name} | expected=${test.expectedSuccess}` +
              ` actual=${result.success} | ${result.message}` +
              (result.success ? ` | required points=${result.pointsRequired}` : ""));
}

// Also test the earning calculation, which is not connected to purchases yet.
const earningTests = [
  { amount: 1, expectedPoints: 1 },
  { amount: 10, expectedPoints: 10 },
  { amount: 100, expectedPoints: 100 },
  { amount: 15.50, expectedPoints: 15.5 }
];

for (const test of earningTests) {
  const result = calculateEarnedPoints(test.amount);
  const ok = result.success && Math.abs(result.pointsEarned - test.expectedPoints) < 0.000001;
  passed += Number(ok);
  total += 1;
  console.log(`${ok ? "PASS" : "FAIL"} | Earn points on $${test.amount.toFixed(2)}` +
              ` | expected=${test.expectedPoints} actual=${result.pointsEarned}`);
}

console.log(`\n${passed}/${total} tests passed.`);
if (passed !== total) process.exitCode = 1;
