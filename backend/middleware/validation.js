import validator from 'validator';

export const registerValidation = (req, res, next) => {
  const { email, phone, password, firstName, lastName } = req.body;

  if (!email && !phone) {
    return res.status(400).json({
      status: 'error',
      message: 'Email or phone number is required'
    });
  }

  if (email && !validator.isEmail(email)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid email format'
    });
  }

  if (!phone || !validator.isMobilePhone(phone, 'any')) {
    return res.status(400).json({
      status: 'error',
      message: 'Valid phone number is required'
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      status: 'error',
      message: 'Password must be at least 6 characters long'
    });
  }

  if (!firstName || !lastName) {
    return res.status(400).json({
      status: 'error',
      message: 'First name and last name are required'
    });
  }

  next();
};

export const loginValidation = (req, res, next) => {
  const { email, phone, password } = req.body;

  if (!email && !phone) {
    return res.status(400).json({
      status: 'error',
      message: 'Email or phone number is required'
    });
  }

  if (!password) {
    return res.status(400).json({
      status: 'error',
      message: 'Password is required'
    });
  }

  next();
};