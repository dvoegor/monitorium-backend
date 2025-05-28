import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Публичные роуты
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Защищенные роуты
router.get('/profile', authenticateToken, AuthController.getProfile);
router.post(
  '/change-password',
  authenticateToken,
  AuthController.changePassword
);

export { router as authRoutes };
