import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';
import { User, IUserDocument } from '../models/User.js';

export interface AuthRequest extends Request {
  user?: IUserDocument;
}

interface JwtPayload {
  id: string;
  email: string;
}

export const authenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Authentication failed. No token provided.', 401)
      );
    }

    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(
        new AppError('The user belonging to this token no longer exists.', 401)
      );
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Invalid or expired authentication token', 401));
  }
};
