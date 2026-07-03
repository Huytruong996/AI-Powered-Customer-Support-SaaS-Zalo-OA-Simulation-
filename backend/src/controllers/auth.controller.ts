import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../utils/db';
import { AuthRequest } from '../middlewares/auth.middleware';
import { JwtPayload } from '../types/authTypes';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, name } = req.body;
    const password = String(req.body.password);

    if (!email || !req.body.password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    const existingUser = await db.user.findUnique({ where: { email } });

    console.log(req.body)
    if (existingUser) {
      res.status(400).json({ success: false, message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await db.user.create({
      data: { email, password: hashedPassword, name }
    });

    res.status(201).json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name } } });
  } catch (error) {
    res.status(500).json({ success: false, message: error });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    const password = String(req.body.password);
    const user = await db.user.findUnique({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }
    
    const payloadJWT : JwtPayload = {
      userId: user.id,
      role: user.role,
    };
    
    const accessToken = jwt.sign(
      payloadJWT,
      JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any }
    );

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });
  return res.json({
    success: true,
    message: "Logout successfully",
  });
};

export const getMe = async (req: AuthRequest, res: Response) => {
    const user = await db.user.findUnique({
    where: {
      id: req.userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  return res.json(user);
};

export const demoLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const demoEmail = 'demo@demo.com';
    let user = await db.user.findUnique({ where: { email: demoEmail } });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      user = await db.user.create({
        data: { email: demoEmail, password: hashedPassword, name: 'Demo User', role: 'ADMIN' }
      });
    }
    
    const payloadJWT: JwtPayload = {
      userId: user.id,
      role: user.role,
    };
    
    const accessToken = jwt.sign(
      payloadJWT,
      JWT_SECRET,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '1d') as any }
    );

    res.cookie("access_token", accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ success: true, data: { user: { id: user.id, email: user.email, name: user.name, role: user.role } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};