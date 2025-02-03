const { User } = require('../Models/model.user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Import bcrypt


const JWT_SECRET = 'ecotrader';

// Function to generate a random 6-digit OTP
// const generateOTP = () => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

// Function to send OTP via emai

exports.userSignup = async (req, res) => {
    try {
      const { email, password, walletAddress, name, phone, city } = req.body;
      const lowerCaseEmail = email.toLowerCase();
      let user = await User.findOne({ email: lowerCaseEmail });
      if (user) {
        return res.status(400).json({ error: 'User already exists' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10); // Salt rounds = 10
      user = new User({
        _id: walletAddress,  
        email: lowerCaseEmail,
        password: hashedPassword,
        walletAddress: walletAddress,
        name,
        phone,
        city,
      });
      await user.save();
      await sendEmailMiddleware([
        lowerCaseEmail,
        'Education Point Account Created',
        'Welcome to Education Point Naini, ' + name,
      ]);
  
      return res.status(200).json({ message: 'User created successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

// exports.userOtp = async (req, res) => {
//   try {
//     const { email } = req.body;
//     // Convert email to lowercase
//     const lowerCaseEmail = email.toLowerCase();
//     // Find user by email
//     const user = await User.findOne({ email: lowerCaseEmail });
//     if (!user) {
//       return res.status(400).json({ error: 'User not found' });
//     }
//     // Generate OTP
//     const otp = generateOTP();
//     user.otp = otp;
//     await user.save();
//     await sendEmailMiddleware([lowerCaseEmail, 'Education Point Login OTP', 'Your OTP for one-time login in Education Point Naini is: ' + otp]);
//     res.status(200).json({ message: 'OTP sent successfully' });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// };

exports.userLogin = async (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Validate credentials (as shown in earlier code)
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
  
      // Generate tokens
      const accessToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ userId: user._id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
      // Return tokens to the frontend
      return res.status(200).json({
        message: 'Login successful',
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };



exports.verify = async (req, res) => {
    try {
      // Get verification token from cookie
      const verificationToken = req.cookies.verificationToken;
      if (!verificationToken) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const decoded = jwt.verify(verificationToken, JWT_SECRET);
      if (decoded.userId) {
        const user = await User.findById(decoded.userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        // Add user role and data to response
        return res.status(200).json({ role: 'user', user: user });
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  exports.getUsers = async (req, res) => {
    try {
      // Check if user already exists
      // const r = await verify(req, res);
      // if (r !== 1) {
      //   return res.status(401).json({message:'Unauthorized'});
      // }
      let user = await User.find();
      return res.status(200).json({data:user});
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };

  exports.getUserInfo = async (req, res) => {
    try {
      // Check if user already exists
      // const r = await verify(req, res);
      // if (r !== 1) {
      //   return res.status(401).json({message:'Unauthorized'});
      // }
      let user = await User.findById(req.body);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };


exports.deleteUser = async (req, res) => {
  try {
    const r = await verifyAdmin(req, res);
    if (r !== 1) {
      return res.status(401).json({message:'Unauthorized'});
    }
      const { id } = req.params;

      // Check if admin exists
      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      // Delete user
      await user.remove();

      return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal server error' });
  }
};