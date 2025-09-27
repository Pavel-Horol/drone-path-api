import express from 'express';
import AuthController from '../controllers/auth.controller.js';
import AuthMiddleware from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/profile', AuthMiddleware.authenticate, AuthController.getProfile);

export default router;
