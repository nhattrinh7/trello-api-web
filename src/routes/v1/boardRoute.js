
import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/boardValidation'
import { boardController } from '~/controllers/boardController'

const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({ message: 'Note: API get list board' })
  })
  .post(boardValidation.createNew, boardController.createNew)

Router.route('/:id') //trong boardRoute thì là board Id
  // không phải lúc nào cũng cần chạy qua Validation
  .get(boardController.getDetails)
  .put()

export const boardRoute = Router