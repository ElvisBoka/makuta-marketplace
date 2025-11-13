import { prisma } from '../../../lib/prisma.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return await getCategories(req, res);
  } else {
    res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });
  }
}

async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      where: { parentId: null },
      include: {
        children: true,
        _count: {
          select: {
            listings: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      status: 'success',
      data: categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}