import jwt from 'jsonwebtoken';
import { User, IUser, BloodGroup } from '../models/User.js';
import { config } from '../config/env.js';
import { AppError } from '../utils/appError.js';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone: string;
  bloodGroup: BloodGroup;
  isDonor?: boolean;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
  };
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  /** Generate JWT token */
  public static generateToken(id: string, email: string): string {
    return jwt.sign({ id, email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as any,
    });
  }

  /** Register new user */
  public static async register(data: RegisterDTO) {
    const cleanEmail = data.email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw new AppError('An account with this email already exists', 400);
    }

    const user = await User.create({
      name: data.name.trim(),
      email: cleanEmail,
      password: data.password,
      phone: data.phone.trim(),
      bloodGroup: data.bloodGroup,
      isDonor: data.isDonor !== undefined ? data.isDonor : true,
      location: data.location || { address: '', latitude: 0, longitude: 0 },
    });

    const token = this.generateToken(user._id.toString(), user.email);

    // Omit password from output
    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, token };
  }

  /** Login user */
  public static async login(data: LoginDTO) {
    if (!data.email || !data.password) {
      throw new AppError('Please provide email and password', 400);
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail }).select(
      '+password'
    );

    if (!user || !(await user.comparePassword(data.password))) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = this.generateToken(user._id.toString(), user.email);

    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, token };
  }
}
