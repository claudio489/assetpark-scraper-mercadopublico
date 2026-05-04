"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkCapacity = exports.rankOpportunities = exports.getBestExecutor = exports.analyzeOpportunity = exports.normalizeOpportunity = exports.EXECUTORS = void 0;
// ==========================================
// DECISION ENGINE v5.1 — Export central
// Capa adicional sobre v5.0 (no invasiva)
// ==========================================
__exportStar(require("./types"), exports);
var executors_1 = require("./executors");
Object.defineProperty(exports, "EXECUTORS", { enumerable: true, get: function () { return executors_1.EXECUTORS; } });
var normalizer_1 = require("./normalizer");
Object.defineProperty(exports, "normalizeOpportunity", { enumerable: true, get: function () { return normalizer_1.normalizeOpportunity; } });
var engine_1 = require("./engine");
Object.defineProperty(exports, "analyzeOpportunity", { enumerable: true, get: function () { return engine_1.analyzeOpportunity; } });
var matcher_1 = require("./matcher");
Object.defineProperty(exports, "getBestExecutor", { enumerable: true, get: function () { return matcher_1.getBestExecutor; } });
Object.defineProperty(exports, "rankOpportunities", { enumerable: true, get: function () { return matcher_1.rankOpportunities; } });
Object.defineProperty(exports, "checkCapacity", { enumerable: true, get: function () { return matcher_1.checkCapacity; } });
