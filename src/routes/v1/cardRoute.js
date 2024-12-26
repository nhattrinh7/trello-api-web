import express from 'express'
import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddlware'

const Router = express.Router()

Router.route('/')
  .post(authMiddleware.isAuthorized, cardValidation.createNew, cardController.createNew)

Router.route('/:id')
  .put(
    authMiddleware.isAuthorized,
    multerUploadMiddleware.uploadCardFields,
    cardValidation.update,
    cardController.update)
  .delete(authMiddleware.isAuthorized, cardValidation.deleteItem, cardController.deleteItem)

Router.route('/:id/cover')
  .delete(authMiddleware.isAuthorized, cardValidation.deleteCardCover, cardController.deleteCardCover)

export const cardRoute = Router