import NodeCache from 'node-cache';
import { logger } from '../logger/logger';

// Создаем экземпляр кэша
// stdTTL: время жизни по умолчанию (в секундах)
// checkperiod: интервал проверки истекших ключей (в секундах)
const cache = new NodeCache({
  stdTTL: 600, // 10 минут
  checkperiod: 120, // 2 минуты
});

export class CacheService {
  // Получить значение из кэша
  static get<T>(key: string): T | undefined {
    try {
      const value = cache.get<T>(key);
      if (value) {
        logger.debug(`Cache hit for key: ${key}`);
      } else {
        logger.debug(`Cache miss for key: ${key}`);
      }
      return value;
    } catch (error) {
      logger.error('Cache get error:', error);
      return undefined;
    }
  }

  // Сохранить значение в кэш
  static set<T>(key: string, value: T, ttl?: number): boolean {
    try {
      const success = ttl ? cache.set(key, value, ttl) : cache.set(key, value);
      if (success) {
        logger.debug(`Cache set for key: ${key}, TTL: ${ttl || 'default'}`);
      }
      return success;
    } catch (error) {
      logger.error('Cache set error:', error);
      return false;
    }
  }

  // Удалить значение из кэша
  static del(key: string): number {
    try {
      const deleted = cache.del(key);
      logger.debug(`Cache delete for key: ${key}, deleted: ${deleted}`);
      return deleted;
    } catch (error) {
      logger.error('Cache delete error:', error);
      return 0;
    }
  }

  // Очистить весь кэш
  static flush(): void {
    try {
      cache.flushAll();
      logger.info('Cache flushed');
    } catch (error) {
      logger.error('Cache flush error:', error);
    }
  }

  // Получить статистику кэша
  static getStats() {
    return cache.getStats();
  }

  // Проверить существование ключа
  static has(key: string): boolean {
    return cache.has(key);
  }

  // Получить все ключи
  static keys(): string[] {
    return cache.keys();
  }
}

// Логирование событий кэша
cache.on('set', (key, value) => {
  logger.debug(`Cache event: SET ${key}`);
});

cache.on('del', (key, value) => {
  logger.debug(`Cache event: DELETE ${key}`);
});

cache.on('expired', (key, value) => {
  logger.debug(`Cache event: EXPIRED ${key}`);
});

export default CacheService;
