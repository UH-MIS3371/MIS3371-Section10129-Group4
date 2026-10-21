
// Business rules:
// 1 point covers $0.10 of the item price.
// Rewards must cover the full item price.
// Fractional points are allowed.
// Partial discounts and cash back are not allowed.


const MINIMUM_PRICE = 0;
const POINT_VALUE = 0.10;
const CUSTOMER_POINTS = 100;

const form = document.querySelector('#rewardForm');
const emailInput = document.querySelector('#customerId');
const claimDateInput = document.querySelector('#claimDate');
const categoryInput = document.querySelector('#category');
const itemPriceInput = document.querySelector('#itemPrice');
const commentsInput = document.querySelector('#comments');

const availablePoints = document.querySelector('#availablePoints');
const rewardMessage = document.querySelector('#rewardMessage');

// Let JavaScript display specific validation messages.
form.noValidate = true;

// Display the demo balance.
availablePoints.textContent = CUSTOMER_POINTS;

// Check that reward points cover the entire item price.
function applyReward(price, points) {
    const priceCents = Math.round(price * 100);
    const rewardCents = Math.round(points * POINT_VALUE * 100);
    const finalPriceCents = priceCents - rewardCents;

    return finalPriceCents >= MINIMUM_PRICE &&
           finalPriceCents === 0;
}

// Display live reward eligibility.
function updateRewardMessage(submitted = false) {
    if (itemPriceInput.value === '') {
        rewardMessage.textContent = '';
        return;
    }

    if (!itemPriceInput.checkValidity()) {
        rewardMessage.textContent =
            'Enter a valid item price greater than $0.';
        return;
    }

    const itemPrice = Number(itemPriceInput.value);
    const priceCents = Math.round(itemPrice * 100);

    // 10 points per $1; fractional points are allowed.
    const pointsRequired = priceCents / 10;

    if (CUSTOMER_POINTS < pointsRequired) {
        const status = submitted
            ? 'REJECTED'
            : 'NOT ENOUGH POINTS';

        rewardMessage.textContent =
            `${status}: You need ${pointsRequired} points, ` +
            `but you only have ${CUSTOMER_POINTS}.`;
        return;
    }

    if (applyReward(itemPrice, pointsRequired)) {
        const status = submitted
            ? 'APPROVED'
            : 'ENOUGH POINTS';

        rewardMessage.textContent =
            `${status}: You can redeem this item using ` +
            `${pointsRequired} points. Final price: $0.00`;
    }
}

// Validate all required fields on submission.
function handleDemoSubmit(event) {
    event.preventDefault();

    const email = emailInput.value.trim();
    const claimDate = claimDateInput.value;
    const category = categoryInput.value;
    const comments = commentsInput.value.trim();

    const errors = [];

    if (!email) {
        errors.push('Email address is required.');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Enter a valid email address.');
    }

    if (!claimDate) {
        errors.push('Claim date is required.');
    }

    if (!category) {
        errors.push('Choose a reward category.');
    }

    if (itemPriceInput.value === '') {
        errors.push('Item price is required.');
    } else if (!itemPriceInput.checkValidity()) {
        errors.push('Enter a valid item price greater than $0.');
    }

    if (!comments) {
        errors.push('Comments / Review is required.');
    }

    if (errors.length > 0) {
        rewardMessage.textContent =
            'REJECTED: ' + errors.join(' ');
        return;
    }

    updateRewardMessage(true);

    console.log('Demo only. No points deducted or saved.');
}

// Update the points message while typing the price.
itemPriceInput.addEventListener('input', function () {
    updateRewardMessage();
});

// Check all required information when submitting.
form.addEventListener('submit', handleDemoSubmit);
