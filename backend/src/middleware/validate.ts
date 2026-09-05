import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

export const validateRegister = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { name, email, password, phone, bloodGroup } = req.body;

  if (!name || !email || !password || !phone || !bloodGroup) {
    return next(
      new AppError(
        'Validation failed: name, email, password, phone, and bloodGroup are required fields',
        400
      )
    );
  }

  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (!validBloodGroups.includes(bloodGroup)) {
    return next(
      new AppError(
        `Invalid bloodGroup. Allowed values: ${validBloodGroups.join(', ')}`,
        400
      )
    );
  }

  // Validate phone number format (must contain 7 to 15 digits)
  const phoneDigits = phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    return next(
      new AppError(
        'Invalid phone number: must contain between 7 and 15 digits',
        400
      )
    );
  }

  if (password.length < 6) {
    return next(
      new AppError('Password must be at least 6 characters long', 400)
    );
  }

  next();
};

export const validateLogin = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new AppError('Email and password are required', 400));
  }
  next();
};

export const validateBloodRequest = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const { patientName, bloodGroup, unitsRequired, hospitalName, contactNumber } = req.body;

  if (!patientName || !bloodGroup || !unitsRequired || !hospitalName || !contactNumber) {
    return next(
      new AppError(
        'patientName, bloodGroup, unitsRequired, hospitalName, and contactNumber are required',
        400
      )
    );
  }

  const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  if (!validBloodGroups.includes(bloodGroup)) {
    return next(
      new AppError(
        `Invalid bloodGroup. Allowed values: ${validBloodGroups.join(', ')}`,
        400
      )
    );
  }

  // Validate contact phone number format
  const contactDigits = contactNumber.replace(/\D/g, '');
  if (contactDigits.length < 7 || contactDigits.length > 15) {
    return next(
      new AppError(
        'Invalid contactNumber: must contain between 7 and 15 digits',
        400
      )
    );
  }

  if (unitsRequired < 1) {
    return next(new AppError('unitsRequired must be at least 1', 400));
  }

  next();
};
