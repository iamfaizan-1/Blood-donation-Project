import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { DataMiningService } from '../services/dataMiningService.js';
import { sendResponse } from '../utils/response.js';

export const getDataMiningInsights = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const insights = await DataMiningService.generateInsights();
    sendResponse(res, 200, true, 'Data mining insights generated', insights);
  } catch (error) {
    next(error);
  }
};
