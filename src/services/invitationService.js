import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { userModel } from '~/models/userModel'
import { boardModel } from '~/models/boardModel'
import { invitationModel } from '~/models/invitationModel'
import { INVITATION_TYPES, BOARD_INVITATION_STATUS, BOARD_ALLOW_STATUS } from '~/utils/constants'
import { pickUser } from '~/utils/formatters'


const createNewBoardInvitation = async (reqBody, inviterId) => {
  try {
    // Người đi mời: chính là người đang request, nên chúng ta tìm theo id lấy từ token
    const inviter = await userModel.findOneById(inviterId)

    // Người được mời: lấy theo email nhận từ phía FE
    const invitee = await userModel.findOneByEmail(reqBody.inviteeEmail)

    // Tìm luôn cái board ra để lấy data xử lý
    const board = await boardModel.findOneById(reqBody.boardId)

    // Nếu không tồn tại 1 trong 3 thì cứ thẳng tay reject
    if (!invitee || !inviter || !board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Inviter, Invitee or Board not found!')
    }
    // Nếu invitee đã là thành viên của board rồi thì thông báo về FE là đã là thành viên rồi còn đâu
    const allUserIdsString = [...board.ownerIds, ...board.memberIds].map(_id => _id.toString())
    // console.log('allUserIdsString', allUserIdsString)
    // console.log('invitee._id', invitee._id.toString())
    if (allUserIdsString.includes(invitee._id.toString())) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Invitee is a member of this board already!')
    }

    // Kiểm tra xem inviter này là owner hay member để xác định lúc đầu trườn isAllow là true hay false (tính năng owners xét duyệt lời mời của members)
    let newInvitationData
    const ownerIdsString = [...board.ownerIds].map(_id => _id.toString())
    if (ownerIdsString.includes(inviter._id.toString())) {
      newInvitationData = {
        inviterId,
        inviteeId: invitee._id.toString(), // chuyển từ ObjectId về String vì sang bên Model có check lại data ở hàm create
        type: INVITATION_TYPES.BOARD_INVITATION,
        boardInvitation: {
          boardId: board._id.toString(),
          status: BOARD_INVITATION_STATUS.PENDING // Default ban đầu trạng thái sẽ là Pending
        },
        isAllow: BOARD_ALLOW_STATUS.ALLOW
      }
    } else {
      newInvitationData = {
        inviterId,
        inviteeId: invitee._id.toString(),
        type: INVITATION_TYPES.BOARD_INVITATION,
        boardInvitation: {
          boardId: board._id.toString(),
          status: BOARD_INVITATION_STATUS.PENDING
        },
        isAllow: BOARD_ALLOW_STATUS.NOTALLOW
      }
    }

    // Gọi sang Model để lưu vào DB
    const createdInvitation = await invitationModel.createNewBoardInvitation(newInvitationData)
    const getInvitation = await invitationModel.findOneById(createdInvitation.insertedId)

    // Ngoài thông tin của cái board invitation mới tạo thì trả về đủ cả luôn board, inviter, invitee cho FE thoải mái xử lý.
    const resInvitation = {
      ...getInvitation,
      board,
      inviter: pickUser(inviter),
      invitee: pickUser(invitee)
    }
    return resInvitation
  } catch (error) { throw error }
}

const getInvitations = async (userId) => {
  try {
    // Đây ban đầu là mình đang lấy tất cả invitation của 1 user
    const getInvitations = await invitationModel.findByUser(userId)

    // Vì các dữ liệu inviter, invitee và board là đang ở giá trị mảng 1 phần tử nếu lấy ra được nên chúng ta biến đổi nó về Json Object trước khi trả về cho phía FE
    // const resInvitations = getInvitations.map(i => {
    //   return {
    //     ...i,
    //     inviter: i.inviter[0] || {},
    //     invitee: i.invitee[0] || {},
    //     board: i.board[0] || {}
    //   }
    // })
    const resInvitations = getInvitations.map(i => ({
      ...i,
      inviter: i.inviter[0] || {},
      invitee: i.invitee[0] || {},
      board: i.board[0] || {}
    }))

    return resInvitations
  } catch (error) { throw error }
}

const getMemberInvitations = async (reqBody) => {
  // lấy các invitations của board ở trạng thái pendding
  const invitations = await invitationModel.findInvitationsByBoardId(reqBody.boardId)
  const resInvitations = invitations?.map(i => ({
    ...i,
    inviter: i.inviter[0] || {},
    invitee: i.invitee[0] || {},
    board: i.board[0] || {}
  }))

  // resInvitations lúc này chứa các lời mời của cả owner và member, giờ lọc ra chỉ lấy các lời mời mà inviter là member thôi
  // đầu tiên là query ra cái board hiện tại để lấy ra memberIds
  const board = await boardModel.findOneById(reqBody.boardId)
  const memberIdsString = board?.memberIds?.map(_id => _id.toString())
  const finalInvitations = resInvitations.filter(invitation => memberIdsString.includes(invitation.inviterId.toString()))

  return finalInvitations
}

// Hàm invitee xác nhận lời mời
const updateBoardInvitation = async (userId, invitationId, status) => {
  try {
    // Tìm bản ghi invitation trong model
    const getInvitation = await invitationModel.findOneById(invitationId)
    if (!getInvitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found!')

    // Sau khi có getInvitation rồi thì lấy full thông tin của board
    const boardId = getInvitation.boardInvitation.boardId
    const getBoard = await boardModel.findOneById(boardId)
    if (!getBoard) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    const boardOwnerAndMemberIds = [...getBoard.ownerIds, ...getBoard.memberIds].toString()

    let updatedInvitation
    if (status === BOARD_INVITATION_STATUS.ACCEPTED && boardOwnerAndMemberIds.includes(userId)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'You are already a member of this board.')
    }
    // Tạo dữ liệu để update bản ghi Invitation
    const updateData = {
      boardInvitation: {
        ...getInvitation.boardInvitation,
        status: status // status là ACCEPTED hoặc REJECTED do FE gửi lên
      }
    }
    // Bước 1: Cập nhật status trong bản ghi Invitation
    updatedInvitation = await invitationModel.update(invitationId, updateData)
    // Bước 2: Nếu trường hợp Accept một lời mời thành công, thì cần phải thêm thông tin của thằng user (userId) vào bản ghi memberIds trong collection board.
    if (updatedInvitation.boardInvitation.status === BOARD_INVITATION_STATUS.ACCEPTED) {
      await boardModel.pushMemberIds(boardId, userId)
    }

    return updatedInvitation
  } catch (error) { throw error }
}

// Hàm owner xét duyệt lời mời tham gia board của member
const updateAllowInvitationAPI = async (userId, invitationId, status) => {
  try {
    // Tìm bản ghi invitation trong model
    const getInvitation = await invitationModel.findOneById(invitationId)
    if (!getInvitation) throw new ApiError(StatusCodes.NOT_FOUND, 'Invitation not found!')

    // Sau khi có getInvitation rồi thì lấy full thông tin của board
    const boardId = getInvitation.boardInvitation.boardId
    const getBoard = await boardModel.findOneById(boardId)
    if (!getBoard) throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')

    // Trường hợp owner xét duyệt lời mời tham gia board của member
    // Tạo dữ liệu để update bản ghi Invitation
    const updateData = {
      isAllow: status
    }
    // Bước 1: Cập nhật isAllow trong bản ghi Invitation
    const updatedInvitation = await invitationModel.update(invitationId, updateData)

    return updatedInvitation
  } catch (error) { throw error }
}

export const invitationService = {
  createNewBoardInvitation,
  getInvitations,
  updateBoardInvitation,
  getMemberInvitations,
  updateAllowInvitationAPI
}
