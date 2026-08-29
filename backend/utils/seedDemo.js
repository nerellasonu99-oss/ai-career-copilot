const User = require('../models/User');

const DEMO_USER = {
  name: 'Level 2 Evaluator',
  email: 'judges@neuralarchitects.dev',
  password: 'JudgeDemo1'
};

const seedDemoUser = async () => {
  const existing = await User.findOne({ email: DEMO_USER.email });
  if (existing) {
    console.log(`Demo login ready: ${DEMO_USER.email} / ${DEMO_USER.password}`);
    return;
  }

  await User.create(DEMO_USER);
  console.log(`Demo account created: ${DEMO_USER.email} / ${DEMO_USER.password}`);
};

module.exports = { seedDemoUser, DEMO_USER };
