// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';


const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>" -> just the token part

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach the logged-in student to the request (without password)
    req.student = await Student.findById(decoded.id).select('-password');

    if (!req.student) {
      return res.status(401).json({ message: 'Not authorized, student not found' });
    }

    next(); // token is valid, continue to the actual route
  } catch (error) {
    res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export default protect;