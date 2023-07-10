import fs from 'fs';
import multer from 'multer';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import util from 'util';
import User from '../models/userModel.js';
import { AppError } from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import { deleteOne, getAll, getOne, updateOne } from './handlerFactory.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
	if (file.mimetype.startsWith('image')) {
		cb(null, true);
	} else {
		cb(new AppError('Not an image! Please uploaad only images.', 400), false);
	}
};

const upload = multer({
	storage: multerStorage,
	filter: multerFilter,
});

export const uploadUserPhoto = upload.single('photo');

export const resizeUserPhoto = async (req, res, next) => {
	if (!req.file) return next();

	req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

	await sharp(req.file.buffer)
		.resize(500, 500)
		.toFormat('jpeg')
		.jpeg({ quality: 90 })
		.toFile(`public/img/users/${req.file.filename}`);

	next();
};

export const deleteUserPhotoServer = async (photo) => {
	if (photo.startsWith('default')) return;

	const path = `${__dirname}/../public/img/users/${photo}`;
	const unlink = util.promisify(fs.unlink);

	try {
		await unlink(path);
	} catch (error) {
		console.log(error);
	}
};

const filteredObj = (obj, ...allowedFildes) => {
	const newObj = {};
	Object.keys(obj).forEach((el) => {
		if (allowedFildes.includes(el)) newObj[el] = obj[el];
	});
	return newObj;
};

export const getAllUsers = getAll(User);
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
export const getUser = getOne(User);

export const getMe = (req, res, next) => {
	req.paramas.id = req.user.id;
	next();
};

export const updateMe = catchAsync(async (req, res, next) => {
	if (req.body.password || req.body.confirmPassword)
		return next(
			new AppError(
				'This route is not for password updates. Please use /updateMyPassword',
				400
			)
		);

	const filteredBody = filteredObj(req.body, 'name', 'email');
	if (req.file) {
		filteredBody.photo = req.file.filename;
		await deleteUserPhotoServer(req.user.photo);
	}

	const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
		new: true,
		runValidators: true,
	});

	res.status(200).json({
		status: 'success',
		data: {
			user: updatedUser,
		},
	});
});

export const deleteMe = catchAsync(async (req, res, next) => {
	await User.findByIdAndUpdate(req.user.id, { active: false });

	res.status(204).json({
		status: 'success',
		data: null,
	});
});
