"use strict";

// MIS 3371 - Week 11
// Burger Shot Rewards System
// This file connects AWS Lambda, API Gateway, and DynamoDB.

// Import our existing Burger Shot backend.
const { processReward } = require("./backend/backend");

// Generate unique transaction IDs for saved rewards.
const { randomUUID } = require("node:crypto");

// Import the AWS DynamoDB tools.
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand
} = require("@aws-sdk/lib-dynamodb");

// Get our DynamoDB table name from Lambda settings.
const TABLE_NAME = process.env.TABLE_NAME;

// Connect to DynamoDB using our existing AWS permissions.
const dynamo = DynamoDBDocumentClient.from(
    new DynamoDBClient({})
);

// Create a response that AWS API Gateway can understand.
function makeResponse(statusCode, result) {
    return {
        statusCode,
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(result)
    };
}

// AWS Lambda starts here.
exports.handler = async (event = {}) => {

    // Find out whether the request is POST or GET.
    const method = event?.requestContext?.http?.method;

    // Make sure our DynamoDB table is configured.
    if (!TABLE_NAME) {
        return makeResponse(500, {
            success: false,
            message: "Database configuration error.",
            persisted: false
        });
    }

    // =========================================
    // GET - Retrieve a saved reward transaction.
    // =========================================

    if (method === "GET") {

        // Get the transaction ID from the API URL.
        const transactionId =
            event.pathParameters?.transactionId;

        // Make sure a transaction ID was provided.
        if (typeof transactionId !== "string" ||
            !transactionId.trim()) {

            return makeResponse(400, {
                success: false,
                message: "A transaction ID is required."
            });
        }

        try {

            // Search DynamoDB for the transaction ID.
            const response = await dynamo.send(
                new GetCommand({
                    TableName: TABLE_NAME,
                    Key: {
                        transactionId: transactionId.trim()
                    }
                })
            );

            // Return 404 if the transaction does not exist.
            if (!response.Item) {
                return makeResponse(404, {
                    success: false,
                    message: "Transaction not found."
                });
            }

            // Return the saved transaction to the website.
            return makeResponse(200, {
                success: true,
                message: "Transaction retrieved successfully.",
                transaction: response.Item
            });

        } catch (error) {

            // Handle errors when reading from DynamoDB.
            console.error("DynamoDB read error:", error);

            return makeResponse(500, {
                success: false,
                message: "Unable to retrieve transaction."
            });
        }
    }

    // =========================================
    // POST - Process and save a new reward.
    // =========================================

    // Only accept POST requests for new rewards.
    if (method !== "POST") {
        return makeResponse(405, {
            success: false,
            message: "Only POST and GET requests are allowed."
        });
    }

    // Make sure a request body was provided.
    if (typeof event.body !== "string" ||
        !event.body.trim()) {

        return makeResponse(400, {
            success: false,
            message: "Request body is required.",
            persisted: false
        });
    }

    // Convert the JSON string into JavaScript data.
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

    // Use the existing backend to validate the reward.
    // Our original business rules stay in backend.js.
    let result;

    try {
        result = processReward(reward);

    } catch (error) {

        // Handle unexpected errors from the backend.
        console.error("Backend error:", error);

        return makeResponse(500, {
            success: false,
            message: "An unexpected server error occurred.",
            persisted: false
        });
    }

    // Rejected = 400.
    // Do not save transactions that fail validation.
    if (!result.success) {
        return makeResponse(400, {
            ...result,
            persisted: false
        });
    }

    // =========================================
    // Save the approved reward to DynamoDB.
    // =========================================

    // Create an official transaction record.
    // The transaction ID and timestamp come from Lambda,
    // not from information submitted by the customer.
    const record = {
        transactionId: `RWD-${randomUUID()}`,
        submittedAt: new Date().toISOString(),

        // Information from the validated reward.
        customerId: result.customerId,
        claimDate: String(reward.claimDate).trim(),
        category: String(reward.category).trim(),
        itemPrice: Number(reward.itemPrice),
        comments: String(reward.comments).trim(),
        receiptAttached: reward.receiptAttached === true,

        // Results from our existing backend.
        status: result.status,
        pointsRequired: result.pointsRequired,
        finalPrice: result.finalPrice,
        remainingPointsIfRedeemed:
            result.remainingPointsIfRedeemed
    };

    try {

        // PutCommand saves the transaction to DynamoDB.
        await dynamo.send(
            new PutCommand({
                TableName: TABLE_NAME,
                Item: record,

                // Prevent overwriting an existing transaction.
                ConditionExpression:
                    "attribute_not_exists(transactionId)"
            })
        );

        // Approved and saved = 200.
        // persisted: true confirms the database write worked.
        return makeResponse(200, {
            ...result,
            transactionId: record.transactionId,
            submittedAt: record.submittedAt,
            persisted: true
        });

    } catch (error) {

        // Handle problems saving to DynamoDB.
        console.error("DynamoDB save error:", error);

        return makeResponse(500, {
            success: false,
            message: "Unable to save reward transaction.",
            persisted: false
        });
    }
};