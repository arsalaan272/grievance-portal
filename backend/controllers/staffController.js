// controllers/staffController.js
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Staff from '../models/Staff.js';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

export const signupStaff = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, category, department } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // HOD doesn't need a category (they see everything) — everyone else does
    if (role !== 'HOD' && !category) {
      return res.status(400).json({ message: 'Category is required for this role' });
    }

    // hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStaff = new Staff({
      name,
      email,
      password: hashedPassword,
      role,
      category: role === 'HOD' ? undefined : category,
      department,
    });

    const savedStaff = await newStaff.save();
    // don't send the password back, even hashed
    const { password: _, ...staffWithoutPassword } = savedStaff.toObject();
    res.status(201).json(staffWithoutPassword);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;

    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, staff.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // create a token containing the staff member's id
    const token = jwt.sign(
      { id: staff._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // token stays valid for 7 days
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
        category: staff.category,
        department: staff.department,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPasswordStaff = async (req, res) => {
  try {
    const { email } = req.body;

    const staff = await Staff.findOne({ email });

    if (!staff) {
      return res.status(400).json({ message: 'No staff account found with that email' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    staff.resetPasswordToken = resetToken;
    staff.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await staff.save();

    const resetLink = `http://localhost:3000/staff/reset-password/${resetToken}`;

    const message = `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nThis link expires in 15 minutes. If you did not request this, please ignore this email.`;

    await sendEmail(staff.email, 'Password Reset - Grievance Portal (Staff)', message);

    res.status(200).json({ message: 'Reset link sent to your email' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPasswordStaff = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const staff = await Staff.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!staff) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    staff.password = hashedPassword;
    staff.resetPasswordToken = undefined;
    staff.resetPasswordExpires = undefined;
    await staff.save();

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMeStaff = async (req, res) => {
  // req.staff was attached by the protectStaff middleware
  res.status(200).json(req.staff);
};