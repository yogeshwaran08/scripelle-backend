import { Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth.utils';
import { AuthRequest } from '../types/auth.types';


export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; 

    if (!token) {
      res.status(401).json({ error: 'Access token required' });
      return;
    }
    console.log(token)
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
  res.status(403).json({ error: 'Invalid or expired token' });
  }
}


export function optionalAuthentication(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }
  } catch (error) {
    // Token invalid but continue anyway
  }
  next();
}
