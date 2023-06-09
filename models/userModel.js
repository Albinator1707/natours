import mongoose from 'mongoose';
import isEmail from 'validator/lib/isEmail.js';
import isStrongPassword from 'validator/lib/isStrongPassword.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
	name: {
		type: String,
		required: [true, 'User must have a name'],
	},
	email: {
		type: String,
		required: [true, 'User must have an email'],
		lowercase: true,
		validate: [isEmail, 'Incorrect email'],
		unique: true,
	},
	photo: {
		type: String,
		default: 'default.jpg',
	},
	role: {
		type: String,
		enum: ['user', 'guide', 'lead-guide', 'admin'],
		default: 'user',
	},
	password: {
		type: String,
		required: [true, 'User must have a password'],
		select: false,
	},
	passwordConfirm: {
		type: String,
		required: [true, 'Please confirm your password'],
		validate: {
			validator: function (el) {
				return el === this.password;
			},
			message: 'Password are not the same',
		},
	},
	passwordChangedAt: Date,
	passwordResetToken: String,
	passwordResetExpires: Date,
	active: {
		type: Boolean,
		default: true,
		select: false,
	},
});

userSchema.pre('save', async function (next) {
	if (!this.isModified('password')) return next();
	this.password = await bcrypt.hash(this.password, 12);

	this.passwordConfirm = undefined;
	next();
});

userSchema.pre('save', function (next) {
	if (!this.isModified('password') || this.isNew) return next();

	this.passwordChangedAt = Date.now() - 1000;
	next();
});

userSchema.pre(/^find/g, function (next) {
	this.find({ active: { $ne: false } });
	next();
});

userSchema.methods.correctPassword = function (candidatePassword, userPassword) {
	return bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
	let changedTimestamp;
	if (this.passwordChangedAt) {
		changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
	}
	return JWTTimestamp < changedTimestamp;
};

userSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');

	this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

	this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

	return resetToken;
};

const User = mongoose.model('User', userSchema);

export default User;
