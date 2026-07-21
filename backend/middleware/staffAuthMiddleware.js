// middleware/staffAuthMiddleware.js
import jwt from 'jsonwebtoken';
import Staff from '../models/Staff.js';

const protectStaff = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>" -> just the token part

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach the logged-in staff member to the request (without password)
    req.staff = await Staff.findById(decoded.id).select('-password');

    if (!req.staff) {
      return res.status(401).json({ message: 'Not authorized, staff not found' });
    }

    next(); // token is valid, continue to the actual route
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export default protectStaff;