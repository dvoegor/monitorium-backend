import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Публичные роуты
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/oauth', AuthController.oauthLogin);
router.post('/forgot-password', AuthController.requestPasswordReset);

// Защищенные роуты
router.get('/profile', authenticateToken, AuthController.getProfile);
router.put('/profile', authenticateToken, AuthController.updateProfile);
router.put(
  '/change-password',
  authenticateToken,
  AuthController.changePassword
);
router.post('/verify', authenticateToken, AuthController.verifyUser);

// Публичные данные
router.get('/representatives', AuthController.getRepresentatives);

export { router as authRoutes };
