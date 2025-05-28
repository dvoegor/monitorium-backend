import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  email: z.string().email('Invalid email format').optional(),
});

export class UserController {
  // Получить всех пользователей (только для админов)
  static async getAllUsers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const users = await UserService.getAllUsers();

      res.json({
        message: 'Users retrieved successfully',
        data: { users },
      });
    } catch (error) {
      next(error);
    }
  }

  // Получить пользователя по ID
  static async getUserById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const user = await UserService.findUserById(id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        message: 'User retrieved successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Обновить пользователя
  static async updateUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const validatedData = updateUserSchema.parse(req.body);

      // Проверяем, что пользователь может редактировать только себя (если не админ)
      if (req.user?.role !== 'ADMIN' && req.user?.id !== id) {
        res.status(403).json({ error: 'You can only update your own profile' });
        return;
      }

      const user = await UserService.updateUser(id, validatedData);

      res.json({
        message: 'User updated successfully',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  }

  // Удалить пользователя (только для админов)
  static async deleteUser(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Проверяем, что пользователь не удаляет сам себя
      if (req.user?.id === id) {
        res.status(400).json({ error: 'You cannot delete your own account' });
        return;
      }

      await UserService.deleteUser(id);

      res.json({
        message: 'User deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
