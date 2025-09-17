# Slot Game API Documentation

This document outlines the API endpoints for the Vue Slot Game backend.

---

## Endpoint: `POST /api/spin`

This is the primary endpoint for gameplay. It simulates a single paid spin, including all resulting cascades and feature triggers.

### Request

The request body must be a JSON object containing the total bet for the spin.

-   **Method:** `POST`
-   **URL:** `/api/spin`
-   **Headers:**
    -   `Content-Type: application/json`
-   **Body:**

    ```json
    {
      "totalBet": 25
    }
    ```

    | Field      | Type    | Required | Description                               |
    | :--------- | :------ | :------- | :---------------------------------------- |
    | `totalBet` | Number  | Yes      | The total amount wagered for the spin. This should be divisible by the number of paylines (25). |

---

### Success Response (200 OK)

The response will be a JSON object detailing the complete outcome of the spin and all subsequent events (cascades, feature triggers).

-   **Content-Type:** `application/json`
-   **Body Example:**

    ```json
    {
      "initialGrid": [
        ["cherry", "lemon", "plum"],
        ["cherry", "wild", "orange"],
        ["cherry", "melon", "bar"],
        ["plum", "seven", "bell"],
        ["orange", "bar", "seven"]
      ],
      "totalWinnings": 18,
      "finalBalance": 1003,
      "cascadeSteps": [
        {
          "step": 0,
          "grid": [
            ["cherry", "lemon", "plum"],
            ["cherry", "wild", "orange"],
            ["cherry", "melon", "bar"],
            ["plum", "seven", "bell"],
            ["orange", "bar", "seven"]
          ],
          "wins": [
            {
              "paylineIndex": 0,
              "symbol": "cherry",
              "matchCount": 3,
              "payout": 5
            }
          ],
          "winningsThisStep": 5,
          "multiplier": 1
        },
        {
          "step": 1,
          "grid": [
            ["bar", "lemon", "plum"],
            ["bell", "wild", "orange"],
            ["seven", "melon", "bar"],
            ["plum", "seven", "bell"],
            ["orange", "bar", "seven"]
          ],
          "wins": [
             {
              "paylineIndex": 15,
              "symbol": "bar",
              "matchCount": 3,
              "payout": 40
            }
          ],
          "winningsThisStep": 8,
          "multiplier": 2
        }
      ],
      "scatterWin": 0,
      "freeSpins": {
        "triggered": false,
        "spinCount": 0
      }
    }
    ```

### Response Body Details

| Field             | Type    | Description                                                                                             |
| :---------------- | :------ | :------------------------------------------------------------------------------------------------------ |
| `initialGrid`     | Array   | A 5x3 array of strings representing the grid *before* any cascades.                                     |
| `totalWinnings`   | Number  | The total amount won from this spin, including all cascades and scatter payouts.                        |
| `finalBalance`    | Number  | The player's balance *after* the spin (bet deducted and winnings added).                                |
| `cascadeSteps`    | Array   | An array of objects, where each object details a single step of the cascade (the initial spin is step 0). |
| `scatterWin`      | Number  | Winnings from scatter symbols. This is separate from payline wins.                                      |
| `freeSpins`       | Object  | An object detailing if the free spins feature was triggered.                                            |
| `freeSpins.triggered` | Boolean | `true` if 3+ scatters landed, otherwise `false`.                                                     |
| `freeSpins.spinCount` | Number  | The number of free spins awarded (e.g., 10, 15, or 20).                                               |

---

### Error Response (400 Bad Request)

If the request is invalid (e.g., missing `totalBet`, invalid bet amount), the server will respond with an error.

-   **Body Example:**

    ```json
    {
      "error": "Invalid totalBet provided. It must be a positive number."
    }
    ```
