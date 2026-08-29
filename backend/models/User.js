const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const roadmapItemSchema = new mongoose.Schema(
  {
    id: String,
    skillId: String,
    skillName: String,
    courseTitle: String,
    provider: String,
    url: String,
    type: String,
    hours: Number,
    done: { type: Boolean, default: false }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    selectedRoleId: {
      type: String,
      default: ''
    },
    skillRatings: {
      type: Object,
      default: {}
    },
    extraSkills: {
      type: [String],
      default: []
    },
    roadmap: {
      type: [roadmapItemSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
