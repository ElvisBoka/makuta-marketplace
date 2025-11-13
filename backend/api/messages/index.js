import { prisma } from '../../../lib/prisma.js';
import { auth } from '../../../lib/auth.js';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authResult = await auth(req, res);
  if (authResult) return authResult;

  const path = req.url;

  if (req.method === 'POST' && path === '/api/messages') {
    return await sendMessage(req, res);
  } else if (req.method === 'GET' && path.startsWith('/api/messages/conversation/')) {
    const userId = path.split('/')[4];
    return await getConversation(req, res, userId);
  } else if (req.method === 'GET' && path === '/api/messages/conversations') {
    return await getConversations(req, res);
  } else {
    res.status(404).json({
      status: 'error',
      message: 'Endpoint not found'
    });
  }
}

async function sendMessage(req, res) {
  try {
    const { receiverId, listingId, content } = req.body;

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId }
    });

    if (!receiver) {
      return res.status(404).json({
        status: 'error',
        message: 'Receiver not found'
      });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId: req.user.id,
        receiverId,
        listingId
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        listing: {
          select: {
            title: true,
            images: true
          }
        }
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Message sent successfully',
      data: { message }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getConversation(req, res, userId) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          {
            senderId: req.user.id,
            receiverId: userId
          },
          {
            senderId: userId,
            receiverId: req.user.id
          }
        ]
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        listing: {
          select: {
            title: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: req.user.id,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({
      status: 'success',
      data: { messages }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}

async function getConversations(req, res) {
  try {
    // Get unique users that the current user has conversations with
    const conversations = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: req.user.id },
          { receiverId: req.user.id }
        ]
      },
      distinct: ['senderId', 'receiverId'],
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        listing: {
          select: {
            title: true,
            images: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format conversations to show the other user
    const formattedConversations = conversations.map(msg => {
      const otherUser = msg.senderId === req.user.id ? msg.receiver : msg.sender;
      return {
        userId: otherUser.id,
        user: otherUser,
        lastMessage: msg.content,
        lastMessageTime: msg.createdAt,
        listing: msg.listing,
        unreadCount: msg.senderId === otherUser.id && !msg.isRead ? 1 : 0
      };
    });

    res.json({
      status: 'success',
      data: { conversations: formattedConversations }
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
}