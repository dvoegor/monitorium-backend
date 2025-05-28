/**
 * Custom application error interface
 */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}
