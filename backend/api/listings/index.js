import { prisma } from '../../../lib/prisma.js';
import { auth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apply auth middleware for protected routes
  if (req.method !== 'GET') {
    const authResult = await auth(req, res);
    if (authResult) return authResult; // If auth returns a response, stop here
  }

  const { query } = req;
  const path = req.url;

  if (req.method === 'GET' && path === '/api/listings') {
    return await getListings(req, res, query);
  } else if (req.method === 'GET' && path.startsWith('/api/listings/')) {
    const id = path.split('/')[3];
    return await getListing(req, res, id);
  } else if (req.method === 'POST' && path === '/api/listings') {
    return await createListing(req, res);
  } else if (req.method === 'PUT' && path.startsWith('/api/listings/')) {
    const id = path.split('/')[3];
    return await updateListing(req, res, id);
  } else if (req.method === 'DELETE' && path.startsWith('/api/listings/')) {
    const id = path.split('/')[3];
    return await deleteListing(req, res, id);
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found'
    });
  }
}

async function getListings(req, res, query) {
  try {
    const {
      category,
      search,
      province,
      city,
      minPrice,
      maxPrice,
      type,
      featured,
      limit = 20,
      page = 1
    } = query;

    const where = {
      status: 'APPROVED'
    };

    if (category) {
      const categoryRecord = await prisma.category.findFirst({
        where: { slug: category }
      });
      if (categoryRecord) {
        where.categoryId = categoryRecord.id;
      }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (province) where.province = province;
    if (city) where.city = city;
    if (type) where.type = type;
    if (featured === 'true') where.isFeatured = true;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const listings = await prisma.listing.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isVerified: true
          }
        },
        category: true,
        reviews: true,
        _count: {
          select: {
            favorites: true,
            reviews: true
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
    console.error('Get listings error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getListing(req, res, id) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            isVerified: true,
            province: true,
            city: true,
            createdAt: true
          }
        },
        category: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            favorites: true,
            reviews: true
          }
        }
      }
    });

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    // Increment view count
    await prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } }
    });

    res.json({
      status: 'success',
      data: { listing }
    });
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function createListing(req, res) {
  try {
    const {
      title,
      description,
      price,
      currency,
      categoryId,
      type,
      province,
      city,
      commune,
      exactLocation,
      contactPhone,
      contactEmail,
      images
    } = req.body;

    // Check if category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid category'
      });
    }

    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        currency,
        categoryId,
        type,
        province,
        city,
        commune,
        exactLocation,
        contactPhone,
        contactEmail,
        images: images || [],
        userId: req.user.id,
        expireAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
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
    });

    res.status(201).json({
      status: 'success',
      message: 'Listing created successfully',
      data: { listing }
    });
  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function updateListing(req, res, id) {
  try {
    const updateData = req.body;

    // Check if listing exists and user owns it
    const existingListing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!existingListing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    if (existingListing.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this listing'
      });
    }

    const listing = await prisma.listing.update({
      where: { id },
      data: updateData,
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
    });

    res.json({
      status: 'success',
      message: 'Listing updated successfully',
      data: { listing }
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function deleteListing(req, res, id) {
  try {
    const listing = await prisma.listing.findUnique({
      where: { id }
    });

    if (!listing) {
      return res.status(404).json({
        status: 'error',
        message: 'Listing not found'
      });
    }

    if (listing.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this listing'
      });
    }

    await prisma.listing.delete({
      where: { id }
    });

    res.json({
      status: 'success',
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}