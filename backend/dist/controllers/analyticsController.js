"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDataMiningInsights = void 0;
const dataMiningService_js_1 = require("../services/dataMiningService.js");
const response_js_1 = require("../utils/response.js");
const getDataMiningInsights = async (_req, res, next) => {
    try {
        const insights = await dataMiningService_js_1.DataMiningService.generateInsights();
        (0, response_js_1.sendResponse)(res, 200, true, 'Data mining insights generated', insights);
    }
    catch (error) {
        next(error);
    }
};
exports.getDataMiningInsights = getDataMiningInsights;
