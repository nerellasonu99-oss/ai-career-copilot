const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile', error: error.message });
  }
});

router.put('/save', protect, async (req, res) => {
  const { selectedRoleId, skillRatings, extraSkills, roadmap } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (selectedRoleId !== undefined) user.selectedRoleId = selectedRoleId;
    if (skillRatings !== undefined) user.skillRatings = skillRatings;
    if (extraSkills !== undefined) user.extraSkills = extraSkills;
    if (roadmap !== undefined) user.roadmap = roadmap;

    await user.save();

    res.json({
      message: 'Profile saved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        selectedRoleId: user.selectedRoleId,
        skillRatings: user.skillRatings,
        extraSkills: user.extraSkills,
        roadmap: user.roadmap
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Save failed', error: error.message });
  }
});

module.exports = router;
