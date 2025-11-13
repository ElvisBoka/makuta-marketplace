import { prisma } from '../../../lib/prisma.js';
import { auth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authResult = await auth(req, res);
  if (authResult) return authResult;

  const path = req.url;

  if (req.method === 'GET' && path === '/api/users/profile') {
    return await getProfile(req, res);
  } else if (req.method === 'PUT' && path === '/api/users/profile') {
    return await updateProfile(req, res);
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found'
    });
  }
}

async function getProfile(req, res) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        province: true,
        city: true,
        commune: true,
        address: true,
        idNumber: true,
        idType: true,
        nifNumber: true,
        createdAt: true
      }
    });

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function updateProfile(req, res) {
  try {
    const {
      firstName,
      lastName,
      province,
      city,
      commune,
      address
    } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        firstName,
        lastName,
        province,
        city,
        commune,
        address
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        isVerified: true,
        province: true,
        city: true,
        commune: true,
        address: true
      }
    });

    res.json({
      status: 'success',
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}