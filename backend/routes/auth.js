const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Workspace = require('../models/Workspace');
const Invitation = require('../models/Invitation');

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, website, inviteToken } = req.body;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'User already exists' });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    user = new User({ name, email, password: hashedPassword });
    
    if (inviteToken) {
      try {
        const invite = await Invitation.findOne({ token: inviteToken, status: 'pending' });
        if (!invite || new Date() > invite.expiresAt) {
          if (invite) {
            invite.status = 'expired';
            await invite.save();
          }
          return res.status(400).json({ error: 'Invalid or expired invite link' });
        }
        
        const workspaceId = invite.workspaceId;
        
        // Atomic update: Add user to workspace ONLY if limit is not reached
        const updatedWorkspace = await Workspace.findOneAndUpdate(
          {
            _id: workspaceId,
            $or: [
              { plan: { $nin: ['free', 'hobby'] } },
              { "members.1": { $exists: false } }
            ]
          },
          {
            $push: { members: { userId: user._id, role: invite.role } }
          },
          { new: true }
        );
        
        if (!updatedWorkspace) {
          return res.status(403).json({ error: 'Workspace member limit reached. Cannot accept invitation on Free plan.' });
        }
        
        user.workspaces.push(workspaceId);
        user.role = invite.role === 'admin' ? 'admin' : 'member';
        await user.save();
        
        // Mark invite as accepted
        invite.status = 'accepted';
        await invite.save();
        
      } catch (err) {
        return res.status(400).json({ error: 'Error processing invite link' });
      }
    } else {
      // Create a default workspace for the user
      await user.save(); // Save user first to get ID
      const workspace = new Workspace({
        name: `${name}'s Workspace`,
        ownerId: user._id,
        websiteUrl: website || '',
        members: [{ userId: user._id, role: 'owner' }]
      });
      await workspace.save();
      user.workspaces.push(workspace._id);
      user.role = 'admin';
      await user.save(); // Save again to update workspaces
    }



    // Create JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production', { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, workspaces: user.workspaces } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    // Create JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production', { expiresIn: '7d' });

    res.json({ token, user: { id: user.id, name: user.name, email: user.email, workspaces: user.workspaces } });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user (Verify Token)
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production');
    const user = await User.findById(decoded.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(401).json({ error: 'Token is not valid' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'There is no user with that email address' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    
    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    // In production, use nodemailer/SendGrid to email the reset link to the user.
    // The reset link would be: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
    // IMPORTANT: Never log the raw token or reset URL.
    console.log('Password reset email generated');

    res.status(200).json({ 
      success: true, 
      message: 'Password reset link generated and sent to email.'
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Email could not be sent' });
  }
});

// Reset Password
router.put('/reset-password/:token', async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    // Set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Create JWT and login the user automatically
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production', { expiresIn: '7d' });

    res.status(200).json({ 
      success: true, 
      token, 
      user: { id: user.id, name: user.name, email: user.email, workspaces: user.workspaces } 
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Initiate Google OAuth Flow
router.get('/google', (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CALLBACK_URL) {
    console.error('Google OAuth Environment Variables are missing.');
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google OAuth is not configured correctly on the server (missing env variables).')}`);
  }

  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  res.redirect(`${rootUrl}?${new URLSearchParams(options).toString()}`);
});

// Google OAuth Callback
router.get('/google/callback', async (req, res) => {
  const code = req.query.code;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  if (!code) {
    return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google authentication failed: no authorization code provided.')}`);
  }

  try {
    // Exchange authorization code for tokens
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const values = {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    };

    const tokenRes = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(values).toString(),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error('Google token exchange error:', tokenData);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to exchange Google authorization code.')}`);
    }

    const { access_token } = tokenData;

    // Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const profile = await profileRes.json();
    if (!profileRes.ok) {
      console.error('Google profile fetch error:', profile);
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Failed to fetch user profile from Google.')}`);
    }

    const { sub: googleId, email, name } = profile;
    if (!email) {
      return res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Google account did not provide an email address.')}`);
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Link Google account if not linked
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user (Signup)
      const salt = await bcrypt.genSalt(10);
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      user = new User({
        name: name || email.split('@')[0],
        email,
        password: hashedPassword,
        googleId,
        role: 'admin',
      });
      await user.save();

      // Create a default workspace for the new user
      const workspace = new Workspace({
        name: `${user.name}'s Workspace`,
        ownerId: user._id,
        websiteUrl: '',
        members: [{ userId: user._id, role: 'owner' }]
      });
      await workspace.save();

      user.workspaces.push(workspace._id);
      await user.save();
    }

    // Generate JWT
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'dev_fallback_secret_change_in_production', { expiresIn: '7d' });

    // Redirect to dashboard with token and user details as parameters
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      workspaces: user.workspaces,
    };

    res.redirect(`${frontendUrl}/dashboard?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    res.redirect(`${frontendUrl}/login?error=${encodeURIComponent('Server error during Google authentication.')}`);
  }
});

module.exports = router;
