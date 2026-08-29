import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    
    // Auto-create default admin account on first login if not present
    if (!user && (email === 'admin@cinevault.com' || email === 'admin') && (password === 'admin123' || password === 'admin')) {
      user = new User({ username: 'Admin', email: 'admin@cinevault.com', password: 'admin123', role: 'admin' });
      await user.save();
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'cinevault_super_secret_jwt_key_2026',
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    res.json(req.user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
