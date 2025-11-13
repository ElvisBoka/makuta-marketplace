export default async function handler(req, res) {
  if (req.method === 'GET') {
    res.status(200).json({
      status: 'success',
      message: 'MakutaPlace API is running!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });
  } else {
    res.status(405).json({
      status: 'error',
      message: 'Method not allowed'
    });
  }
}