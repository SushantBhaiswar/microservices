const mongoose = require("mongoose");
// const { toJSON } = require("./plugins");
const SchemaNames = require("../config/schemaNames.js");
const DBEnums = require("../config/database.enums.js");

const logSchema = mongoose.Schema(
  {
    // Core tracking fields
    traceId: { type: String, required: true, index: true },
    spanId: { type: String, required: true, index: true },
    parentSpanId: { type: String, index: true },
    // level: { type: String, enum: log.level },

    // Service information
    service: {
      type: String,
      required: true,
      enum: DBEnums.Logs.SchemaNames,
    },

    // // Operation details
    // operationType: {
    //   type: String,
    //   enum: log.operationTypes,
    // },

    status: {
      type: String,
      enum: DBEnums.Logs.Status,
    },

    // Request specific data
    method: String,
    path: String,

    // authenticated user info
    userId: { type: mongoose.SchemaTypes.ObjectId },
    deviceInfo: { type: mongoose.SchemaTypes.ObjectId },

    // Detailed information

    input: { type: mongoose.Schema.Types.Mixed, default: {} },
    output: { type: mongoose.Schema.Types.Mixed, default: {} },
    error: { type: mongoose.Schema.Types.Mixed, default: {} },
    duration: Number,

    // Additional context
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
// logSchema.plugin(toJSON);

/**
 * @typedef Token
 */
const Log = mongoose.model(SchemaNames.LOG, logSchema);

module.exports = Log;

// ✅ What is operationType?
// ✨ It defines what kind of action is being logged.
// Think of it like a category of operations the service is performing.

// Examples:
// operationType	Meaning
// "CREATE_USER"	API or internal method to register a user
// "LOGIN"	Authentication
// "UPLOAD_FILE"	File service
// "GET_ORDER"	Reading order details
// "SEND_EMAIL"	Email service action
// "PROCESS_PAYMENT"	Payment gateway triggered

// You define these based on your business logic. So you can filter logs by operation type and see things like:

// “How long do all CREATE_USER operations take?”
// “What errors happened in UPLOAD_FILE operations?”

// 💡 Implementation Tip:
// Instead of hardcoding strings everywhere, define constants in a shared file:

// js
// Copy
// Edit
// const operationTypes = {
//   CREATE_USER: 'CREATE_USER',
//   LOGIN: 'LOGIN',
//   UPLOAD_FILE: 'UPLOAD_FILE',
//   ...
// };
// Then in your schema:

// js
// Copy
// Edit
// operationType: { type: String, enum: Object.values(operationTypes) }
// 🟡 What is status?
// This describes how the operation ended:

// status	Meaning
// "SUCCESS"	Operation finished as expected
// "FAILURE"	Operation encountered an error
// "TIMEOUT"	Operation took too long
// "RETRY"	Operation failed but was retried
// "SKIPPED"	Operation was skipped due to some rule

// Define this based on your logging logic or error-handling middleware.
