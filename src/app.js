
// Business rules:
// 1 point covers $0.10 of the item price.
// Rewards must cover the full item price.
// Fractional points are allowed.
// Partial discounts and cash back are not allowed.


const MINIMUM_PRICE = 0;
const POINT_VALUE = 0.10;
const CUSTOMER_POINTS = 100;
const API_URL =
    "https://3ds4bq9hjb.execute-api.us-east-1.amazonaws.com/api/rewards";

const form = document.querySelector('#rewardForm');
const emailInput = document.querySelector('#customerId');
const claimDateInput = document.querySelector('#claimDate');
const categoryInput = document.querySelector('#category');
const itemPriceInput = document.querySelector('#itemPrice');
const commentsInput = document.querySelector('#comments');

const availablePoints = document.querySelector('#availablePoints');
const rewardMessage = document.querySelector('#rewardMessage');

 // Confirmation number elements.
const confirmationPanel = document.querySelector('#confirmationPanel');
const confirmationNumber = document.querySelector('#confirmationNumber');

// View Status form elements.
const statusLookupForm = document.querySelector('#statusLookupForm');
const statusTransactionIdInput = document.querySelector('#statusTransactionId');
const statusMessage = document.querySelector('#statusMessage');
const statusResult = document.querySelector('#statusResult');

// Display saved transaction information.
const viewedTransactionId = document.querySelector('#viewedTransactionId');
const viewedStatus = document.querySelector('#viewedStatus');
const viewedSubmittedAt = document.querySelector('#viewedSubmittedAt');
const viewedPoints = document.querySelector('#viewedPoints');

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
async function handleDemoSubmit(event) {
    event.preventDefault();

    // Hide old confirmation and lookup results before a new submission.
    confirmationPanel.hidden = true;
    statusResult.hidden = true;
    statusMessage.textContent = '';

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


    // Collect the reward information from the form.
    const rewardData = {
        customerId: email,
        claimDate: claimDate,
        category: category,
        itemPrice: Number(itemPriceInput.value),
        comments: comments,
        receiptAttached: document.querySelector('#receiptAttached').checked
    };

    // Send the reward request to AWS.    
    
    try {
        rewardMessage.textContent = 'Submitting reward...';

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(rewardData)
        });

        const result = await response.json();

        // Display the response from our backend.
        // Only confirm a reward after DynamoDB saves it.
        if (response.ok && result.success === true &&
            result.persisted === true && result.transactionId) {

            rewardMessage.textContent =
                'APPROVED: ' + result.message +
                ' Points required: ' + result.pointsRequired;

            // Show the confirmation number from DynamoDB.
            confirmationNumber.textContent = result.transactionId;
            confirmationPanel.hidden = false;

            // Automatically fill the View Status field.
            statusTransactionIdInput.value = result.transactionId;

        } else if (result.success === true) {

            // The reward was validated but saving was not confirmed.
            rewardMessage.textContent =
                'ERROR: Reward was not confirmed as saved.';

        } else {

            // Display rejection or server error messages.
            rewardMessage.textContent =
                (response.status >= 500 ? 'ERROR: ' : 'REJECTED: ') +
                (result.message || 'Reward request was not completed.');
        }

    } catch (error) {
        rewardMessage.textContent =
            'ERROR: Could not connect to the rewards service.';
        console.error(error);
    }
}

// Update the points message while typing the price.
itemPriceInput.addEventListener('input', function () {
    updateRewardMessage();
});

// Check all required information when submitting.
form.addEventListener('submit', handleDemoSubmit);

// Retrieve a previously saved reward from DynamoDB.
async function handleStatusLookup(event) {
    event.preventDefault();

    // Get the confirmation number entered by the customer.
    const transactionId = statusTransactionIdInput.value.trim();

    // Hide previous lookup results.
    statusResult.hidden = true;

    if (!transactionId) {
        statusMessage.textContent =
            'Please enter a confirmation number.';
        return;
    }

    try {
        statusMessage.textContent = 'Searching for transaction...';

        // Send a GET request to API Gateway.
        const response = await fetch(
            `${API_URL}/${encodeURIComponent(transactionId)}`,
            {
                method: 'GET'
            }
        );

        const result = await response.json();

        // Check whether DynamoDB found the transaction.
        if (!response.ok || result.success !== true ||
            !result.transaction) {

            statusMessage.textContent =
                result.message || 'Transaction not found.';
            return;
        }

        // Get the saved transaction information.
        const transaction = result.transaction;

        // Display the information returned from DynamoDB.
        viewedTransactionId.textContent =
            transaction.transactionId;

        viewedStatus.textContent =
            transaction.status || 'Unavailable';

        viewedSubmittedAt.textContent =
            transaction.submittedAt || 'Unavailable';

        viewedPoints.textContent =
            transaction.pointsRequired ?? 'Unavailable';

        // Show the saved transaction details.
        statusResult.hidden = false;
        statusMessage.textContent =
            'Transaction found successfully.';

    } catch (error) {

        // Handle connection or server problems.
        statusMessage.textContent =
            'ERROR: Could not retrieve transaction.';

        console.error(error);
    }
}

// Run the lookup when the customer clicks View Status.
statusLookupForm.addEventListener('submit', handleStatusLookup);
