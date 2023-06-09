import express from 'express';

import {
	forgotPassword,
	login,
	logout,
	protect,
	resetPassword,
	restrictTo,
	signUp,
	updatePassword,
} from '../controller/authController.js';
import {
	deleteMe,
	deleteUser,
	getAllUsers,
	getMe,
	getUser,
	updateMe,
	updateUser,
	uploadUserPhoto,
	resizeUserPhoto,
} from '../controller/userController.js';

const userRouter = express.Router();

userRouter.post('/signup', signUp);
userRouter.get('/logout', logout);
userRouter.post('/login', login);

userRouter.post('/forgotPassword', forgotPassword);
userRouter.patch('/resetPassword/:token', resetPassword);

userRouter.use(protect);

userRouter.patch('/updateMyPassword', updatePassword);

userRouter.get('/me', getMe);
userRouter.patch('/updateMe', uploadUserPhoto, resizeUserPhoto, updateMe);
userRouter.delete('/deleteMe', deleteMe);

userRouter.use(restrictTo('admin'));

userRouter.route('/').get(getAllUsers);
userRouter.route('/:id').delete(deleteUser).patch(updateUser).get(getUser);

export default userRouter;
