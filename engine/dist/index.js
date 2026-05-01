"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runPipeline = runPipeline;
const scraper_1 = require("./scraper");
async function runPipeline() {
    const data = await (0, scraper_1.scrapeOpportunities)();
    return data.slice(0, 50);
}
