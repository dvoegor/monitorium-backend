import { RequestUser } from './auth.types';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
