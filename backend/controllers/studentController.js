// controllers/studentController.js
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import Student from '../models/Student.js';
import sendEmail from '../utils/sendEmail.js';
import jwt from 'jsonwebtoken';

export const signupStudent = async (req, res) => {
  try {
    const { nameAadhar, rollNo, email, college, department, course, yearOfStudy, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // hash the password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newStudent = new Student({
      nameAadhar,
      rollNo,
      email,
      college,
      department,
      course,
      yearOfStudy,
      password: hashedPassword
    });

    const savedStudent = await newStudent.save();
    res.status(201).json(savedStudent);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const loginStudent = async (req, res) => {
  try {
    const { username, password } = req.body;

    // "username" here is really the roll number
    const student = await Student.findOne({ rollNo: username });

    if (!student) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, student.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    // create a token containing the student's id
    const token = jwt.sign(
      { id: student._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' } // token stays valid for 7 days
    );

    res.status(200).json({
      message: 'Login successful',
       token,
      student: {
        id: student._id,
        nameAadhar: student.nameAadhar,
        rollNo: student.rollNo,
        email: student.email,
        college: student.college,
        department: student.department,
        course: student.course,
        yearOfStudy: student.yearOfStudy,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const student = await Student.findOne({ email });

    if (!student) {
      return res.status(400).json({ message: 'No student found with that email' });
    }

    // generate a random token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // save token and expiry (15 minutes from now) to the student's record
    student.resetPasswordToken = resetToken;
    student.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await student.save();
    // build the reset link (this will point to your Next.js frontend page)
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;

    const message = `You requested a password reset. Click this link to reset your password: ${resetLink}\n\nThis link expires in 15 minutes. If you did not request this, please ignore this email.`;

    await sendEmail(student.email, 'Password Reset - Grievance Portal', message);

    res.status(200).json({ message: 'Reset link sent to your email' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // find student with this token AND check it hasn't expired
    const student = await Student.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // $gt means "greater than" i.e. still in the future
    });

    if (!student) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }
    // hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    student.password = hashedPassword;
    student.resetPasswordToken = undefined; // clear the token so it can't be reused
    student.resetPasswordExpires = undefined;
    await student.save();

    res.status(200).json({ message: 'Password reset successful' });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getMe = async (req, res) => {
  // req.student was attached by the protect middleware
  res.status(200).json(req.student);
};