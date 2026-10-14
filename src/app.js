// Business rules:
// 1 point covers $0.10 of the item price.
// Rewards must cover the full item price.
// Fractional points are allowed.
// Partial discounts and cash back are not allowed.

const MINIMUM_PRICE = 0;
const POINT_VALUE = 0.10;
const CUSTOMER_POINTS = 100; // Sample balance for testing

const form = document.querySelector('#rewardForm');
const itemPriceInput = document.querySelector('#itemPrice');
const availablePoints = document.querySelector('#availablePoints');
const rewardMessage = document.querySelector('#rewardMessage');

// Display the sample balance when the page loads.
availablePoints.textContent = CUSTOMER_POINTS;

function applyReward(price, points) {
    // Compare whole cents to avoid decimal precision errors.
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

// Clear the previous result when the price changes.
itemPriceInput.addEventListener('input', function () {
    rewardMessage.textContent = '';
});

form.addEventListener('submit', handleDemoSubmit);