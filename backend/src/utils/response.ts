import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export const sendResponse = <T>(
  res: Response,
  statusCode: number,
  success: boolean,
  message: string,
  data?: T
): Response => {
  return res.status(statusCode).json({
    success,
    message,
    ...(data !== undefined && { data }),
  });
};
