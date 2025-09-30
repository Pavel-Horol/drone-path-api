import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import { config } from '../config/index.js';

class AuthMiddleware {
  static async authenticate(req, res, next) {
    try {
      // Get token from header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          status: 'error',
          message: 'Access token is required'
        });
      }

      const token = authHeader.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, config.jwt.secret);

      // Get user from token
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'User no longer exists'
        });
      }

      // Add user to request object
      req.user = user;
      return next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token'
        });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          status: 'error',
          message: 'Token expired'
        });
      }
      return next(error);
    }
  }

  static authorize(..._allowedRoles) {
    return (req, res, next) => {
      // For now, we only have basic user roles
      // This can be extended later for admin roles, etc.
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }
      return next();
    };
  }

  static checkOwnership(model) {
    return async(req, res, next) => {
      try {
        const resourceId = req.params.id;
        const userId = req.user._id.toString();

        let resource;
        if (model === 'route') {
          const Route = (await import('../models/route.model.js')).default;
          resource = await Route.findById(resourceId);
        } else if (model === 'drone') {
          const Drone = (await import('../models/drone.model.js')).default;
          resource = await Drone.findById(resourceId);
        }

        if (!resource) {
          return res.status(404).json({
            status: 'error',
            message: `${model} not found`
          });
        }

        if (resource.userId && resource.userId.toString() !== userId) {
          return res.status(403).json({
            status: 'error',
            message: `You don't have permission to modify this ${model}`
          });
        }

        req.resource = resource;
        return next();
      } catch (error) {
        return next(error);
      }
    };
  }

  static optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    // If token is provided, validate it
    return AuthMiddleware.authenticate(req, res, next);
  }
}

export default AuthMiddleware;
