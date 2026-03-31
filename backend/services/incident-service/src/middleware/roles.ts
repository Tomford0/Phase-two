import { Request, Response, NextFunction } from 'express';

export const roles = (...allowed: string[]) => (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const role = req.user?.role;
  if (!role || !allowed.includes(role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
