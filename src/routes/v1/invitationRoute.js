import express from 'express'
import { invitationValidation } from '~/validations/invitationValidation'
import { invitationController } from '~/controllers/invitationController'
import { authMiddleware } from '~/middlewares/authMiddleware'

const Router = express.Router()

Router.route('/board')
  .post(authMiddleware.isAuthorized,
    invitationValidation.createNewBoardInvitation,
    invitationController.createNewBoardInvitation
  )

Router.route('/boards')
  .post(authMiddleware.isAuthorized, invitationValidation.getMemberInvitations, invitationController.getMemberInvitations)

// Get invitations by User
Router.route('/')
  .get(authMiddleware.isAuthorized, invitationController.getInvitations)

// Cập nhật một bản ghi Board Invitation
Router.route('/board/:invitationId')
  .put(authMiddleware.isAuthorized, invitationController.updateBoardInvitation)

// Cập nhật xét duyệt lời mời tham gia Board của member là Allow hay not Allow
Router.route('/boards/:invitationId')
  .put(authMiddleware.isAuthorized, invitationController.updateAllowInvitationAPI)

export const invitationRoute = Router
