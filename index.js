"use strict";

// Import our existing Burger Shot backend.
const { processReward } = require("./backend/backend");

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
exports.handler = async (event) => {

  // Only accept POST requests.
  const method = event?.requestContext?.http?.method;

  if (method !== "POST") {
    return makeResponse(405, {
      success: false,
      message: "Only POST requests are allowed."
    });
  }

  // Make sure a request body was provided.
  if (typeof event.body !== "string" || !event.body.trim()) {
    return makeResponse(400, {
      success: false,
      message: "Request body is required."
    });
  }

  // Convert the JSON string into JavaScript data.
  let reward;

  try {
    reward = JSON.parse(event.body);
  } catch (error) {
    return makeResponse(400, {
      success: false,
      message: "Invalid JSON request."
    });
  }

  // Use the existing backend to validate the reward.
  try {
    const result = processReward(reward);

    // Approved = 200, rejected = 400.
    return makeResponse(result.success ? 200 : 400, result);

  } catch (error) {
    return makeResponse(500, {
      success: false,
      message: "An unexpected server error occurred."
    });
  }
};