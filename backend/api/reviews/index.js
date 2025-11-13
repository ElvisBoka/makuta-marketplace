import { prisma } from '../../../lib/prisma.js';
import { auth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url;

  if (req.method === 'POST' && path === '/api/reviews') {
    const authResult = await auth(req, res);
    if (authResult) return authResult;
    return await createReview(req, res);
  } else if (req.method === 'GET' && path.startsWith('/api/reviews/listing/')) {
    const listingId = path.split('/')[4];
    return await getListingReviews(req, res, listingId);
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found'
    });
  }
}

async function createReview(req, res) {
  try {
    const { listingId, rating, comment, serviceQuality, communication, timeliness } = req.body;

    // Check if listing exists and user hasn't already reviewed it
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: { reviews: true }
    });

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    const existingReview = listing.reviews.find(review => review.reviewerId === req.user.id);
    if (existingReview) {
      return res.status(400).json({
        status: 'error',
        message: 'You have already reviewed this listing'
      });
    }

    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment,
        serviceQuality: parseInt(serviceQuality),
        communication: parseInt(communication),
        timeliness: parseInt(timeliness),
        reviewerId: req.user.id,
        listingId,
        userId: listing.userId
      },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Review submitted successfully',
      data: { review }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getListingReviews(req, res, listingId) {
  try {
    const { page = 1, limit = 10 } = req.query;

    const reviews = await prisma.review.findMany({
      where: { listingId },
      include: {
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.review.count({ where: { listingId } });

    // Calculate average ratings
    const averageRatings = await prisma.review.aggregate({
      where: { listingId },
      _avg: {
        rating: true,
        serviceQuality: true,
        communication: true,
        timeliness: true
      }
    });

    res.json({
      status: 'success',
      data: {
        reviews,
        averageRatings: averageRatings._avg,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}