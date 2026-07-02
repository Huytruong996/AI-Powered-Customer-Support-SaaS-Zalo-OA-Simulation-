import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken';
import { JwtPayload } from "../types/authTypes";

export interface AuthRequest extends Request<Record<string, string>, any, any, Record<string, string>> {
  userId?: string;
}

export const authMiddleware = (
    req: AuthRequest,
    res: Response,
    next: NextFunction) => {
    
    try {
        
        const accessToken = req.cookies.access_token;
        
        if (!accessToken) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const payload = jwt.verify(accessToken, process.env.JWT_SECRET as string) as JwtPayload;
        req.userId = payload.userId;
        next();
        
    }
    catch {
        return res.status(401).json({
        message: "Invalid token",
        });
    }
}