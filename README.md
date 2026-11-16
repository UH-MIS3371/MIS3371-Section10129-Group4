# mis3371-loyalty-rewards-system

SYSTEM NAME: Burger Shot Restaurant Loyalty Rewards

TEAM MEMBERS:
Clyde Orehuela
Satya Dwiputranto
Mackenzie Williams
Evan Flett
Hailey Do
Andrea Esparza

The Burger Shot Rewards System allows customers to redeem loyalty points for selected restaurant items. Customers enter their email, choose a reward category and menu item, select a future pickup date and time, and submit their request.

The system automatically determines the item's official price and calculates the required reward points. If the customer has enough demo points and all information is valid, the transaction is saved in DynamoDB.

Customers receive a confirmation number and can use the View Reward Status feature to retrieve their saved transaction.

The application uses HTML, CSS, JavaScript, AWS Amplify, API Gateway, AWS Lambda, and DynamoDB.

Current limitations: The system uses a fixed demo balance of 100 points. It does not deduct points from actual customer accounts or notify restaurant employees about pickup requests.
