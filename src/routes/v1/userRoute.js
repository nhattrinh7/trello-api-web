import express from 'express'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddlware'


const Router = express.Router()

Router.route('/forget_password')
  .put(userValidation.resetPassword, userController.resetPassword)

Router.route('/create_new_password')
  .put(userValidation.createNewPassword, userController.createNewPassword)

Router.route('/register')
  .post(userValidation.createNew, userController.createNew)

Router.route('/verify')
  .put(userValidation.verifyAccount, userController.verifyAccount)

Router.route('/login')
  .post(userValidation.login, userController.login)

Router.route('/logout')
  .delete(userController.logout)

Router.route('/refresh_token')
  .get(userController.refreshToken)

Router.route('/update')
  .put(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.uploadSingleAvatar,
    userValidation.update,
    userController.update)

export const userRoute = Router