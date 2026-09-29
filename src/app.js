const MINIMUM_PRICE = 0;

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

// Try changing rewardAmount to 10.99, 15, and 20.