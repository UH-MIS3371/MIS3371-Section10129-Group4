PASS | Valid $5 item | expected=true actual=true | Reward is eligible. Full item price is covered. | required points=50
PASS | Valid $9.99 item | expected=true actual=true | Reward is eligible. Full item price is covered. | required points=99.9
PASS | Invalid missing email | expected=false actual=false | Email address is required.
PASS | Invalid email format | expected=false actual=false | Enter a valid email address.
PASS | Invalid zero price | expected=false actual=false | Item price must be greater than $0.
PASS | Boundary exactly $10 | expected=true actual=true | Reward is eligible. Full item price is covered. | required points=100
PASS | Boundary $10.01 | expected=false actual=false | Not enough points. Need 100.1, have 100.
PASS | Extra: fractional $7.55 | expected=true actual=true | Reward is eligible. Full item price is covered. | required points=75.5
PASS | Earn points on $1.00 | expected=1 actual=1
PASS | Earn points on $10.00 | expected=10 actual=10
PASS | Earn points on $100.00 | expected=100 actual=100
PASS | Earn points on $15.50 | expected=15.5 actual=15.5

12/12 tests passed.