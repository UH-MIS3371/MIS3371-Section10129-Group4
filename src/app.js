/*const MINIMUM_PRICE = 0;

// Example transaction values for testing.
let itemPrice = 15;
let rewardAmount = 10;

function applyReward(price, reward) {
    const finalPrice = price - reward;
    return finalPrice >= MINIMUM_PRICE;

}

const rewardAllowed = applyReward(itemPrice, rewardAmount);

console.log('Item price: ', itemPrice);
console.log('Reward amount: ', rewardAmount);
console.log('Is reward allowed? ', rewardAllowed);

if (rewardAllowed) {
    console.log('Reward can be applied.');
} else {
    console.log('Reward cannot be applied. Final price would be below minimum.');
}

// Try changing rewardAmount to 10.99, 15, and 20. */

// Business Rule:
// Rewards cannot reduce the final price below $0

const MINIMUM_PRICE = 0;
const POINT_VALUE = 1;
const CUSTOMER_POINTS = 100; // Example customer points for testing

const form = document.querySelector('#rewardForm');
const itemPriceInput = document.querySelector('#itemPrice');
const availablePoints = document.querySelector('#availablePoints');
const rewardMessage = document.querySelector('#rewardMessage');

// showing sample balance when the webpage loads
availablePoints.textContent = CUSTOMER_POINTS;

function applyReward(price, points) {
    // Convert to cents for an accurate money comparison.
    const priceCents = Math.round(price * 100);
    const rewardCents = Math.round(points * POINT_VALUE * 100);
    const finalPriceCents = priceCents - rewardCents;

    return finalPriceCents >= MINIMUM_PRICE &&
           finalPriceCents === 0;
}

function updateRewardMessage() {
    if (itemPriceInput.value === '') {
        rewardMessage.textContent = '';
        return;
    }

    if (!itemPriceInput.checkValidity()) {
        rewardMessage.textContent = 'Enter a valid item price.';
        return;
    }

    const itemPrice = Number(itemPriceInput.value);
    const pointsRequired = itemPrice / POINT_VALUE;

    if (CUSTOMER_POINTS < pointsRequired) {
        rewardMessage.textContent =
            `Reward cannot be applied. You need ${pointsRequired} points, ` +
            `but you have ${CUSTOMER_POINTS}.`;
        return;
    }

    if (applyReward(itemPrice, pointsRequired)) {
        rewardMessage.textContent =
            `Reward can be applied using ${pointsRequired} points. ` +
            'Your item is free! Final price: $0.00';
    } else {
        rewardMessage.textContent =
            'Reward must cover the exact item price. ' +
            'Partial discounts and cash back are not allowed.';
    }
}

function handleDemoSubmit(event) {
    event.preventDefault();
    updateRewardMessage();

    console.log('Demo only. No transaction saved or points deducted.');
}

form.addEventListener('submit', handleDemoSubmit);