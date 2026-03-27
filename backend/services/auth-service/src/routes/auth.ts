import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../prisma';

const router = Router();
const saltRounds = 10;
const getJwtSecret = () => process.env.JWT_SECRET || 'your_super_secret_key';
const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || '1h';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required.' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
    });

    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, getJwtSecret(), {
      expiresIn: getJwtExpiresIn() as any,
    });

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/refresh-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing token' });
    }
    const token = authHeader.split(' ')[1];
    
    // In a real app we would decode without verification or use a specific refresh token.
    // For this scope, verify it with ignoreExpiration: true to allow expired tokens to be refreshed:
    const payload = jwt.verify(token, getJwtSecret(), { ignoreExpiration: true }) as any;
    
    const newToken = jwt.sign({ userId: payload.userId, role: payload.role }, getJwtSecret(), {
      expiresIn: getJwtExpiresIn() as any,
    });
    
    return res.json({ token: newToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// Assuming an authGuard middleware intercepts this, but since auth service didn't have one initially,
// we just decode the token manually for the profile endpoint.
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Missing token' });
    }
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, getJwtSecret()) as any;
    
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(401).json({ message: 'Unauthorized' });
  }
});

export default router;
