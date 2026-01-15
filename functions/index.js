/**
 * Firebase Cloud Functions Entry Point
 * Exports all function handlers for DiscipleMe
 */

const { geminiProxy } = require('./gemini-proxy');
const { initializePayment } = require('./paystack-init');
const { paystackWebhook } = require('./paystack-webhook');

// Export all functions
exports.geminiProxy = geminiProxy;
exports.initializePayment = initializePayment;
exports.paystackWebhook = paystackWebhook;
