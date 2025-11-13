import { prisma } from '../../../lib/prisma.js';
import { auth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authResult = await auth(req, res);
  if (authResult) return authResult;

  const path = req.url;

  if (req.method === 'POST' && path === '/api/payments/initiate') {
    return await initiatePayment(req, res);
  } else if (req.method === 'GET' && path.startsWith('/api/payments/')) {
    const id = path.split('/')[3];
    return await getPayment(req, res, id);
  } else if (req.method === 'GET' && path === '/api/payments') {
    return await getUserPayments(req, res);
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found'
    });
  }
}

async function initiatePayment(req, res) {
  try {
    const {
      listingId,
      paymentType,
      amount,
      currency,
      provider,
      phoneNumber,
      description
    } = req.body;

    // For demo purposes - in production, integrate with actual mobile money APIs
    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        listingId,
        amount: parseFloat(amount),
        currency,
        paymentType,
        provider,
        phoneNumber,
        description,
        status: 'PENDING'
      }
    });

    // Simulate payment processing
    setTimeout(async () => {
      // In real implementation, this would be a webhook from the payment provider
      const randomSuccess = Math.random() > 0.2; // 80% success rate for demo

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: randomSuccess ? 'COMPLETED' : 'FAILED',
          transactionId: randomSuccess ? `TXN${Date.now()}${Math.random().toString(36).substr(2, 9)}` : null
        }
      });

      // If payment is for listing and successful, approve the listing
      if (randomSuccess && listingId && paymentType === 'LISTING_FEE') {
        await prisma.listing.update({
          where: { id: listingId },
          data: { status: 'APPROVED' }
        });
      }
    }, 3000);

    res.json({
      status: 'success',
      message: 'Payment initiated',
      data: { payment }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getPayment(req, res, id) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            title: true,
            price: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        status: 'error',
        message: 'Payment not found'
      });
    }

    if (payment.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this payment'
      });
    }

    res.json({
      status: 'success',
      data: { payment }
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getUserPayments(req, res) {
  try {
    const { page = 1, limit = 20 } = req.query;

    const payments = await prisma.payment.findMany({
      where: { userId: req.user.id },
      include: {
        listing: {
          select: {
            title: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    const total = await prisma.payment.count({
      where: { userId: req.user.id }
    });

    res.json({
      status: 'success',
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}