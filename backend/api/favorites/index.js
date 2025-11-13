import { prisma } from '../../../lib/prisma.js';
import { auth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authResult = await auth(req, res);
  if (authResult) return authResult;

  const path = req.url;

  if (req.method === 'POST' && path === '/api/favorites') {
    return await addFavorite(req, res);
  } else if (req.method === 'DELETE' && path.startsWith('/api/favorites/')) {
    const listingId = path.split('/')[3];
    return await removeFavorite(req, res, listingId);
  } else if (req.method === 'GET' && path === '/api/favorites') {
    return await getFavorites(req, res);
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found'
    });
  }
}

async function addFavorite(req, res) {
  try {
    const { listingId } = req.body;

    const listing = await prisma.listing.findUnique({
      where: { id: listingId }
    });

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_listingId: {
          userId: req.user.id,
          listingId
        }
      }
    });

    if (existingFavorite) {
      return res.status(400).json({
        status: 'error',
        message: 'Listing already in favorites'
      });
    }

    const favorite = await prisma.favorite.create({
      data: {
        userId: req.user.id,
        listingId
      },
      include: {
        listing: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                isVerified: true
              }
            },
            category: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Added to favorites',
      data: { favorite }
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function removeFavorite(req, res, listingId) {
  try {
    await prisma.favorite.delete({
      where: {
        userId_listingId: {
          userId: req.user.id,
          listingId
        }
      }
    });

    res.json({
      status: 'success',
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getFavorites(req, res) {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
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
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      status: 'success',
      data: { favorites }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}