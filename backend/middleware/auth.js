import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cinevault_super_secret_jwt_key_2026');
      req.user = await User.findById(decoded.id).select('-password');
      return next();
    } catch {
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }
  return res.status(401).json({ message: 'Not authorized, token missing' });
};

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Access denied: Admin permissions required' });
};
