import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    phone:   { type: String, required: true, unique: true, trim: true },
    upiId:   { type: String, required: true, unique: true, lowercase: true, trim: true },
    pinHash: { type: String, required: true },
    balance: { type: Number, required: true, default: 5000, min: 0 },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('pinHash')) return;
  this.pinHash = await bcryptjs.hash(this.pinHash, 10);
});

userSchema.methods.verifyPin = function (pin) {
  return bcryptjs.compare(String(pin), this.pinHash);
};

userSchema.methods.toPublic = function () {
  return {
    _id:     this._id,
    name:    this.name,
    phone:   this.phone,
    upiId:   this.upiId,
    balance: this.balance,
  };
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;


