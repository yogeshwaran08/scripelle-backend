import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyRefreshToken,
  generateResetToken,
  generateResetTokenExpiry,
  isResetTokenValid
} from '../utils/auth.utils';
import {
  RegisterRequest,
  LoginRequest,
  AuthRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '../types/auth.types';
import { catchAsync } from '../utils/httpWrapper';
import { EmailService } from '../services/email.service';
import passport from '../utils/passport';

export async function register(req: Request<{}, {}, RegisterRequest>, res: Response) {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      res.status(400).json({ error: 'Email, password, firstName, and lastName are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({ error: 'User with this email already exists' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        plan: 'free'
      }
    });

    const { accessToken, refreshToken } = generateTokens(newUser.id, newUser.email);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        plan: newUser.plan,
        availableCredits: newUser.availableCredits,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


export async function login(req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isPasswordValid = await comparePassword(password, user.password || "");

    if (!isPasswordValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return access token and user info
    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        availableCredits: user.availableCredits,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Refresh access token using refresh token from cookie
 * POST /auth/refresh
 */
export async function refreshToken(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
        availableCredits: true
      }
    });

    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.email);

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return new access token
    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        availableCredits: user.availableCredits,
      },
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
}

/**
 * Logout user by clearing refresh token cookie
 * POST /auth/logout
 */
export async function logout(req: Request, res: Response): Promise<void> {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get current user info (protected route example)
 * GET /auth/me
 */
export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
        availableCredits: true,
        createdAt: true
      }
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        plan: user.plan,
        availableCredits: user.availableCredits,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}


export const googleSignin = catchAsync(async (req, res) => {
  passport.authenticate("google", { scope: ["profile", "email"] })(req, res);
});

export async function googleCallbackHandler(req: Request, res: Response) {
  try {
    const user = req.user as any;
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL}/login?error=OAuthFailed`);
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.email);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(`${process.env.CLIENT_URL}/oauth-success?token=${accessToken}`);
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=OAuthInternalError`);
  }
}

/**
 * Send password reset email
 * POST /auth/forgot-password
 */
export async function forgotPassword(req: Request<{}, {}, ForgotPasswordRequest>, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If the email exists in our system, you will receive a password reset link shortly.'
      });
    }

    const resetToken = generateResetToken();
    const resetTokenExpiry = generateResetTokenExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    try {
      await EmailService.sendPasswordResetEmail(user.email, resetToken);

      return res.status(200).json({
        success: true,
        message: 'If the email exists in our system, you will receive a password reset link shortly.',
      });
    } catch (emailError) {
      console.error('Error sending reset email:', emailError);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return res.status(500).json({
        success: false,
        error: 'Failed to send reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Reset password using reset token
 * POST /auth/reset-password
 */
export async function resetPassword(req: Request<{}, {}, ResetPasswordRequest>, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ error: 'Reset token and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
      },
    });

    if (!user || !user.resetTokenExpiry) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    if (!isResetTokenValid(user.resetTokenExpiry)) {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return res.status(400).json({ success: false, error: 'Reset token has expired. Please request a new password reset.' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}