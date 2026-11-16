
"use strict";

// MIS 3371 - Burger Shot Rewards System (AWS Lambda)
//
// POST: Validate and save a reward to DynamoDB.
// GET: Retrieve a saved reward using its transaction ID.

// =====================================================
// IMPORTS
// =====================================================

// Import our Burger Shot backend rules.
const { processReward } = require("./backend/backend");

// Generate official transaction IDs.
const { randomUUID } = require("node:crypto");

// Import AWS DynamoDB tools.
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand
} = require("@aws-sdk/lib-dynamodb");

// =====================================================
// DYNAMODB CONFIGURATION
// =====================================================

// Existing DynamoDB table.
// Primary key: transactionId (String).
const TABLE_NAME = process.env.TABLE_NAME;

const dynamo = DynamoDBDocumentClient.from(
    new DynamoDBClient({})
);

// =====================================================
// API RESPONSE HELPER
// =====================================================

function makeResponse(statusCode, result) {
    return {
        statusCode,

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(result)
    };
}

// =====================================================
// AWS LAMBDA HANDLER
// =====================================================

exports.handler = async (event = {}) => {

    // Read the HTTP method from API Gateway.
    const method =
        event?.requestContext?.http?.method;

    // Make sure the database table is configured.
    if (!TABLE_NAME) {
        return makeResponse(500, {
            success: false,
            message: "Database configuration error.",
            persisted: false
        });
    }

    // =================================================
    // GET - RETRIEVE A SAVED TRANSACTION
    // =================================================

    if (method === "GET") {

        // Get the transaction ID from the URL.
        const transactionId =
            event.pathParameters?.transactionId;

        if (
            typeof transactionId !== "string" ||
            !transactionId.trim()
        ) {
            return makeResponse(400, {
                success: false,
                message: "A transaction ID is required."
            });
        }

        try {

            // Search DynamoDB using the transaction ID.
            const response = await dynamo.send(
                new GetCommand({
                    TableName: TABLE_NAME,

                    Key: {
                        transactionId:
                            transactionId.trim()
                    }
                })
            );

            // Return 404 if the transaction was not found.
            if (!response.Item) {
                return makeResponse(404, {
                    success: false,
                    message: "Transaction not found."
                });
            }

            // Return the stored transaction information.
            return makeResponse(200, {
                success: true,

                message:
                    "Transaction retrieved successfully.",

                transaction: response.Item
            });

        } catch (error) {

            console.error(
                "DynamoDB read error:",
                error
            );

            return makeResponse(500, {
                success: false,
                message: "Unable to retrieve transaction."
            });
        }
    }

    // =================================================
    // POST - SUBMIT A NEW REWARD
    // =================================================

    // Reject unsupported methods.
    if (method !== "POST") {
        return makeResponse(405, {
            success: false,

            message:
                "Only POST and GET requests are allowed."
        });
    }

    // Make sure the customer submitted data.
    if (
        typeof event.body !== "string" ||
        !event.body.trim()
    ) {
        return makeResponse(400, {
            success: false,
            message: "Request body is required.",
            persisted: false
        });
    }

    // =================================================
    // PARSE THE REQUEST BODY
    // =================================================

    let reward;

    try {
        reward = JSON.parse(event.body);

    } catch (error) {

        return makeResponse(400, {
            success: false,
            message: "Invalid JSON request.",
            persisted: false
        });
    }

    // =================================================
    // VALIDATE USING BACKEND RULES
    // =================================================

    // The backend verifies:
    // - Customer email
    // - Future pickup time
    // - Valid category and menu item
    // - Official item price
    // - Required reward points

    let result;

    try {
        result = processReward(reward);

    } catch (error) {

        console.error(
            "Backend error:",
            error
        );

        return makeResponse(500, {
            success: false,

            message:
                "An unexpected server error occurred.",

            persisted: false
        });
    }

    // Do not save invalid or rejected transactions.
    if (!result.success) {
        return makeResponse(400, {
            ...result,
            persisted: false
        });
    }

    // =================================================
    // PREPARE DYNAMODB TRANSACTION
    // =================================================

    // Use only the validated information from backend.js.
    // Lambda generates the official transaction ID and time.

    const record = {

        transactionId:
            `RWD-${randomUUID()}`,

        submittedAt:
            new Date().toISOString(),

        // Customer information.
        customerId:
            result.customerId,

        // Requested pickup date and time.
        pickupAt:
            result.pickupAt,

        // Official Burger Shot menu information.
        category:
            result.category,

        rewardItem:
            result.rewardItem,

        itemName:
            result.itemName,

        itemPrice:
            result.itemPrice,

        // Additional customer information.
        comments:
            result.comments,

        receiptAttached:
            result.receiptAttached,

        // Validated reward results.
        status:
            result.status,

        pointsRequired:
            result.pointsRequired,

        finalPrice:
            result.finalPrice,

        remainingPointsIfRedeemed:
            result.remainingPointsIfRedeemed
    };

    // =================================================
    // SAVE TO DYNAMODB
    // =================================================

    try {

        // Save the approved transaction.
        await dynamo.send(
            new PutCommand({

                TableName: TABLE_NAME,

                Item: record,

                // Prevent overwriting an existing ID.
                ConditionExpression:
                    "attribute_not_exists(transactionId)"
            })
        );

        // =================================================
        // RETURN SAVED CONFIRMATION
        // =================================================

        // persisted: true means the database write succeeded.
        return makeResponse(200, {

            ...result,

            transactionId:
                record.transactionId,

            submittedAt:
                record.submittedAt,

            persisted: true
        });

    } catch (error) {

        console.error(
            "DynamoDB save error:",
            error
        );

        return makeResponse(500, {
            success: false,

            message:
                "Unable to save reward transaction.",

            persisted: false
        });
    }
};
