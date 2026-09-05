import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import { sendResponse } from '../utils/response.js';

export const registerUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await AuthService.register(req.body);
    sendResponse(res, 201, true, 'User registered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await AuthService.login(req.body);
    sendResponse(res, 200, true, 'User logged in successfully', result);
  } catch (error) {
    next(error);
  }
};
