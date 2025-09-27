import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { config } from '../config/index.js';

class AuthController {
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );
  }

  static async register(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Username and password are required'
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          status: 'error',
          message: 'Password must be at least 6 characters long'
        });
      }

      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({
          status: 'error',
          message: 'Username already exists'
        });
      }

      const user = new User({ username, password });
      await user.save();

      const token = AuthController.generateToken(user._id);

      return res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          status: 'error',
          message: 'Username and password are required'
        });
      }

      const user = await User.findOne({ username });
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid username or password'
        });
      }

      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid username or password'
        });
      }

      const token = AuthController.generateToken(user._id);

      return res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          token
        }
      });
    } catch (error) {
      return next(error);
    }
  }

  static async getProfile(req, res, next) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          user: user.toJSON()
        }
      });
    } catch (error) {
      return next(error);
    }
  }
}

export default AuthController;
