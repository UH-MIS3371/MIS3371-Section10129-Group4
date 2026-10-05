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

const form = document.querySelector('#rewardForm');
const itemPriceInput = document.querySelector('#itemPrice');
const rewardPointsInput = document.querySelector('#rewardPoints');
const rewardMessage = document.querySelector('#rewardMessage');

function applyReward(price, points) {
    const rewardValue = points * POINT_VALUE;
    const finalPrice = price - rewardValue;
    return finalPrice >= MINIMUM_PRICE;
}

function updateRewardMessage() {
    const itemPrice = Number(itemPriceInput.value);
    const rewardPoints = Number(rewardPointsInput.value);

    if (itemPriceInput.value === '' || rewardPointsInput.value === '') {
        rewardMessage.textContent = '';
        return;
    }   

    if (applyReward(itemPrice, rewardPoints)) {
        const rewardValue = rewardPoints * POINT_VALUE;
        const finalPrice = itemPrice - rewardValue;
        
        rewardMessage.textContent = `Reward can be applied. Final price: $${finalPrice.toFixed(2)}`;
    } else {
        rewardMessage.textContent = 
        'Reward cannot be applied because the final price would be below $0.';
    }
}

function handleDemoSubmit(event) {
    event.preventDefault();
    console.log('Demo submit intercepted. No server is connected yet.');
}

itemPriceInput.addEventListener('input', updateRewardMessage);
rewardPointsInput.addEventListener('input', updateRewardMessage);
form.addEventListener('submit', handleDemoSubmit);