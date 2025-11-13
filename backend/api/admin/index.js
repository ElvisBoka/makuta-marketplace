import { prisma } from '../../../lib/prisma.js';
import { auth, adminAuth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authResult = await auth(req, res);
  if (authResult) return authResult;

  const adminResult = adminAuth(req, res);
  if (adminResult) return adminResult;

  const path = req.url;

  if (req.method === 'GET' && path === '/api/admin/stats') {
    return await getAdminStats(req, res);
  } else if (req.method === 'GET' && path === '/api/admin/listings') {
    return await getAdminListings(req, res);
  } else if (req.method === 'PATCH' && path.startsWith('/api/admin/listings/') && path.includes('/status')) {
    const id = path.split('/')[4];
    return await updateListingStatus(req, res, id);
  } else if (req.method === 'GET' && path === '/api/admin/users') {
    return await getAdminUsers(req, res);
  } else if (req.method === 'PATCH' && path.startsWith('/api/admin/users/') && path.includes('/verify')) {
    const id = path.split('/')[4];
    return await verifyUser(req, res, id);
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found'
    });
  }
}

async function getAdminStats(req, res) {
  try {
    const [
      totalUsers,
      totalListings,
      pendingListings,
      totalPayments,
      recentUsers,
      recentListings
    ] = await Promise.all([
      prisma.user.count(),
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'PENDING' } }),
      prisma.payment.count({ where: { status: 'COMPLETED' } }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      prisma.listing.findMany({
        where: { status: 'PENDING' },
        take: 10,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              phone: true
            }
          },
          category: true
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    res.json({
      status: 'success',
      data: {
        stats: {
          totalUsers,
          totalListings,
          pendingListings,
          totalPayments
        },
        recentUsers,
        pendingListings: recentListings
      }
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getAdminListings(req, res) {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (status) where.status = status;

    const listings = await prisma.listing.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            isVerified: true
          }
        },
        category: true,
        _count: {
          select: {
            reviews: true,
            favorites: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.listing.count({ where });

    res.json({
      status: 'success',
      data: {
        listings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin listings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function updateListingStatus(req, res, id) {
  try {
    const { status, reason } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status'
      });
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // In production, send notification to user about status change
    console.log(`Listing ${id} ${status.toLowerCase()} by admin ${req.user.id}`);

    res.json({
      status: 'success',
      message: `Listing ${status.toLowerCase()} successfully`,
      data: { listing }
    });
  } catch (error) {
    console.error('Update listing status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getAdminUsers(req, res) {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    const where = {};
    if (role) where.role = role;

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        isVerified: true,
        isActive: true,
        province: true,
        city: true,
        createdAt: true,
        _count: {
          select: {
            listings: true,
            reviews: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.user.count({ where });

    res.json({
      status: 'success',
      data: {
        users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function verifyUser(req, res, id) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { isVerified: true },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        isVerified: true
      }
    });

    res.json({
      status: 'success',
      message: 'User verified successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}