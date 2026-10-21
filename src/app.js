
// Business rules:
// 1 point covers $0.10 of the item price.
// Rewards must cover the full item price.
// Fractional points are allowed.
// Partial discounts and cash back are not allowed.

const MINIMUM_PRICE = 0;
const POINT_VALUE = 0.10;
const CUSTOMER_POINTS = 100;

const form = document.querySelector('#rewardForm');
const itemPriceInput = document.querySelector('#itemPrice');
const availablePoints = document.querySelector('#availablePoints');
const rewardMessage = document.querySelector('#rewardMessage');

// Display available points.
availablePoints.textContent = CUSTOMER_POINTS;

function applyReward(price, points) {
    const priceCents = Math.round(price * 100);
    const rewardCents = Math.round(points * POINT_VALUE * 100);
    const finalPriceCents = priceCents - rewardCents;

    return finalPriceCents >= MINIMUM_PRICE &&
        finalPriceCents === 0;
}

function updateRewardMessage(submitted = false) {

    // No message if the item price is blank.
    if (itemPriceInput.value === '') {
        rewardMessage.textContent = '';
        return;
    }

    // Check that the item price is valid.
    if (!itemPriceInput.checkValidity()) {
        rewardMessage.textContent = 'Enter a valid item price.';
        return;
    }

    const itemPrice = Number(itemPriceInput.value);
    const pointsRequired = itemPrice / POINT_VALUE;

    // Customer does not have enough points.
    if (CUSTOMER_POINTS < pointsRequired) {
        const status = submitted ? 'REJECTED' : 'NOT ENOUGH POINTS';

        rewardMessage.textContent =
            `${status}: You need ${pointsRequired} points, ` +
            `but you only have ${CUSTOMER_POINTS}.`;
        return;
    }

    // Customer has enough points.
    if (applyReward(itemPrice, pointsRequired)) {
        const status = submitted ? 'APPROVED' : 'ENOUGH POINTS';

        rewardMessage.textContent =
            `${status}: You can redeem this item using ` +
            `${pointsRequired} points. Final price: $0.00`;
    }
}

function handleDemoSubmit(event) {
    event.preventDefault();

    // Display the final approval or rejection.
    updateRewardMessage(true);

    console.log('Demo only. No points deducted or saved.');
}

// Update automatically as the price changes.
itemPriceInput.addEventListener('input', function () {
    updateRewardMessage();
});

// Check again when the customer submits.
form.addEventListener('submit', handleDemoSubmit);
