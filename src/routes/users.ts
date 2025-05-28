import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Все роуты требуют аутентификации
router.use(authenticateToken);

// Получить всех пользователей (только админы)
router.get('/', requireAdmin, UserController.getAllUsers);

// Получить пользователя по ID
router.get('/:id', UserController.getUserById);

// Обновить пользователя
router.put('/:id', UserController.updateUser);

// Удалить пользователя (только админы)
router.delete('/:id', requireAdmin, UserController.deleteUser);

export { router as userRoutes };
