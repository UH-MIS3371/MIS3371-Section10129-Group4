# MIS 3371 – Burger Shot Backend Testing

## Purpose

The purpose of backend testing is to make sure the Burger Shot Rewards System correctly validates customer information, menu selections, pickup dates and times, and reward points before approving a transaction.

The tests were completed using Node.js and the `backend/test-backend.js` file.

## Test Results

| Test Case | Expected Result |
|---|---|
| Valid cheeseburger ($4) | PASS – Requires 40 points |
| Valid hamburger ($3) | PASS – Requires 30 points |
| Valid fries ($2) | PASS – Requires 20 points |
| Valid soda ($2) | PASS – Requires 20 points |
| Valid shake ($3) | PASS – Requires 30 points |
| T-shirt ($20) | PASS – Rejected because it requires 200 points |
| Missing email | PASS – Rejected |
| Invalid email | PASS – Rejected |
| Missing pickup date/time | PASS – Rejected |
| Past pickup date/time | PASS – Rejected |
| Invalid pickup format | PASS – Rejected |
| Invalid menu item | PASS – Rejected |
| Invalid category | PASS – Rejected |
| Missing comments | PASS – Rejected |
| Incorrect item price | PASS – Rejected |
| Earn points on $1 | PASS – Calculates 1 point |
| Earn points on $10 | PASS – Calculates 10 points |
| Earn points on $100 | PASS – Calculates 100 points |
| Earn points on $15.50 | PASS – Calculates 15.5 points |

**Local test summary:** 19 test cases. Record the final passed count from the VS Code terminal.

The earned-points tests check a separate calculation function. The current deployed reward system does not add earned points to individual customer accounts.

## AWS Lambda Integration Test

A successful AWS Lambda test was completed on November 16, 2026.

- **Item:** Cheeseburger
- **Item Price:** $4.00
- **Points Required:** 40
- **Pickup Time:** November 20, 2026, at 19:00 UTC
- **Status Code:** 200
- **Transaction Status:** Validated
- **Persisted:** true

The Lambda response included a unique transaction ID, confirming that the approved reward was saved to DynamoDB.

## Conclusion

The backend tests check that valid reward requests are approved and invalid requests are rejected. They also verify that menu prices are determined by the system and that customers cannot choose pickup times in the past.

The AWS integration test also confirmed that an approved transaction could be saved successfully.

## Testing Evidence

Attach screenshots showing:

1. VS Code terminal with the backend test results.
2. AWS Lambda successful test response showing `statusCode: 200` and `persisted: true`.