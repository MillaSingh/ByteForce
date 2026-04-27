const otpStore = new Map(); // In-memory OTP storage (demo only - expires in 30min)

exports.sendOTP = async (req, res) => {
  try {
    const { email, firstName } = req.body;

    if (!email || !firstName) {
      return res.status(400).json({ error: 'Email and name required' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP with expiry (30 min)
    otpStore.set(email, {
      otp,
      firstName,
      expires: Date.now() + 30 * 60 * 1000
    });

    // Email sending now frontend responsibility via EmailJS
    res.json({
      success: true,
      message: 'OTP generated successfully - send via EmailJS',
      otp,
      firstName
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to generate OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const stored = otpStore.get(email);

    if (!stored) {
      return res.status(400).json({ error: 'No OTP found for this email' });
    }

    if (Date.now() > stored.expires) {
      otpStore.delete(email);
      return res.status(400).json({ error: 'OTP expired' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    // Verified - cleanup
    otpStore.delete(email);

    res.json({ success: true, message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
};