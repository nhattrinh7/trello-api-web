import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'
import { DEFAULT_PAGE, DEFAULT_ITEMS_PER_PAGE } from '~/utils/constants'
import { columnService } from './columnService'
import { userModel } from '~/models/userModel'


const createNew = async (userId, reqBody) => {
  try {
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Gọi tới Model để xử lí lưu bản ghi newBoard vào Database
    const createdBoard = await boardModel.createNew(userId, newBoard)

    // Lấy bản ghi board sau khi gọi (tùy dự án có cần bước này hay không)
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId) //insertedId là ObjectId của board mình vừa gọi

    // Làm thêm các xử lí logic khác với các Collection khác tùy đặc thù dự án
    // Bắn email, notification về cho admin khi có 1 board mới được tạo...vv

    // Phải có return
    return getNewBoard
  } catch (error) { throw error }
}

const getDetails = async (userId, boardId) => {
  try {
    const board = await boardModel.getDetails(userId, boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    }
    // lấy được dữ liệu rồi thì EMBEDED cards vào trong COLUMN
    // dữ liệu cards đang cùng cấp với columns, đang không embeded như ở FE nên giờ embed cards vào trong columns
    // Bước 1:
    const resBoard = cloneDeep(board)

    //Bước 2: Cần toString(vì nếu ko toString thì là đang so sánh 2 cái ObjectId với nhau thì ko so được)
    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(card => card.columnId.equals(column._id))
      // column.cards = resBoard.cards.filter(card => card.columnId.toString() === column._id.toString())
    })

    // Bước 3: embeb xong rồi thì xóa cards thừa (cái mà song song với columns)
    delete resBoard.cards

    // Phải có return
    return resBoard
  } catch (error) { throw error }
}

const update = async (boardId, userId, reqBody) => {
  try {
    // nếu có appointeeEmail tức là hàm update chạy đúng trường hợp Appoint user thì mới chạy đoạn code sau:
    if (reqBody.appointeeEmail !== undefined) {
      const board = await boardModel.findOneById(boardId)
      const userIds = board.ownerIds.concat(board.memberIds).map(_id => _id.toString())

      // Lấy ra thông tin của user mà mình Appoint, mục đích để lấy _id của user đó
      const appointedUser = await userModel.findOneByEmail(reqBody.appointeeEmail)
      if (!appointedUser) return { result: 'This user is not a Trello user yet!' }

      if (!userIds.includes(appointedUser._id.toString())) {
        // thông báo cho là người này chưa là thành viên của Board
        return { result: 'User is not in this board yet!' }
      } else {
        // chạy vào đây tức đã là thành viên của board rồi
        let role
        const ownerIdsStringArray = board.ownerIds.map(_id => _id.toString())
        ownerIdsStringArray.includes(appointedUser._id.toString()) ? role = 'owner' : role = 'member'

        if (reqBody.appointType === role) {
          // thông báo user này đang là owner hoặc member rồi
          return { result: `User is already a ${role}!` }

        } else if (role === 'owner') {
          // nếu đang là owner thì chuyển thành member
          boardModel.pullOwnerIds(boardId, appointedUser._id)
          boardModel.pushMemberIds(boardId, appointedUser._id)
          return { result: 'Successfully, User is a member now!' }

        } else {
          // nếu đang là member thì chuyển thành owner
          boardModel.pullMemberIds(boardId, appointedUser._id)
          boardModel.pushOwnerIds(boardId, appointedUser._id)
          return { result: 'Successfully, User is a owner now!' }
        }
      }
    }

    // NormalLeaveBoard & DefaultOwnerLeaveBoard
    if (reqBody.leaveMessage || reqBody.specifiedUserId) {
      // console.log(reqBody.leaveMessage)
      const board = await boardModel.findOneById(boardId)
      const ownerIdsString = board.ownerIds.map(_id => _id.toString())

      // User muốn rời board rời board -  mấy dòng này dùng chung
      let role
      ownerIdsString.includes(userId) ? role = 'owner' : role = 'member'
      if (role === 'owner') {
        boardModel.pullOwnerIds(boardId, userId)
      } else {
        boardModel.pullMemberIds(boardId, userId)
      }

      // Còn đây là trường hợp DefaultOwner rời board thì:
      if (reqBody.specifiedUserId) {
        // xóa DefaultOwner mới đang là member thì xóa _id khỏi memberIds và thêm vào ownerIds
        // đang là owner thì giữ nguyên
        let role
        ownerIdsString.includes(reqBody.specifiedUserId) ? role = 'owner' : role = 'member'
        if (role === 'member') {
          boardModel.pullMemberIds(boardId, reqBody.specifiedUserId)
          boardModel.pushOwnerIds(boardId, reqBody.specifiedUserId)
        }
        // Cho user được chỉ định làm DefaultOwner mới
        boardModel.update(boardId, { defaultOwnerId: reqBody.specifiedUserId })
      }
      return { result: 'Leave board successfully!' }
    }

    // Kick user ra khỏi board
    if (reqBody.kickUserId) {
      const board = await boardModel.findOneById(boardId)
      const ownerIdsString = board.ownerIds.map(_id => _id.toString())
      let role
      ownerIdsString.includes(reqBody.kickUserId) ? role = 'owner' : role = 'member'
      if (role === 'member') {
        await boardModel.pullMemberIds(boardId, reqBody.kickUserId)
      } else {
        await boardModel.pullOwnerIds(boardId, reqBody.kickUserId)
      }

      // sau khi update xong thì get về board đã được cập nhật rồi ở component set lại board với dữ liệu mới
      // nếu ko sẽ bị quay tròn Loading board...
      const newBoard = await boardModel.findOneById(boardId)
      return newBoard
    }

    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    const updatedBoard = await boardModel.update(boardId, updateData)

    return updatedBoard
  } catch (error) { throw error }
}

const moveCardToDifferentColumn = async (reqBody) => {
  try {
    // 1. Xóa id của Card đã kéo ra khỏi cardOrderIds của Column ban đầu
    await columnModel.update(reqBody.prevColumnId, {
      cardOrderIds: reqBody.prevCardOrderIds,
      updatedAt: Date.now()
    })
    // 2. Thêm id của Card đã kéo vào cardOrderIds của Column đích
    await columnModel.update(reqBody.nextColumnId, {
      cardOrderIds: reqBody.nextCardOrderIds,
      updatedAt: Date.now()
    })
    // 3. Cập nhật columnId của Card đã kéo bằng id của Column đích
    await cardModel.update(reqBody.currentCardId, {
      columnId: reqBody.nextColumnId
    })

    return { updateResult: 'Successfully!' }
  } catch (error) { throw error }
}

const getBoards = async (userId, page, itemsPerPage, queryFilters) => {
  try {
    // Nếu không tồn tại page hoặc itemsPerPage từ phía FE thì BE sẽ cần phải luôn gán giá trị mặc định
    if (!page) page = DEFAULT_PAGE
    if (!itemsPerPage) itemsPerPage = DEFAULT_ITEMS_PER_PAGE

    const results = await boardModel.getBoards(
      userId,
      parseInt(page, 10), // đẩy lên dạng string nên phải chuyển sang dạng số
      parseInt(itemsPerPage, 10),
      queryFilters
    )

    return results
  } catch (error) { throw error }
}

const deleteBoard = async (boardId) => {
  try {
    const targetBoard = await boardModel.findOneById(boardId)

    if (!targetBoard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!: boardService ~ deleteBoard')
    }
    // Xóa Board
    await boardModel.deleteOneById(boardId)

    // Xóa toàn bộ Card
    targetBoard.columnOrderIds.forEach(columnId => {
      columnService.deleteColumnAndCards(String(columnId))
    })

    // Xóa toàn bộ Column của Board
    await columnModel.deleteManyByBoardId(boardId)


    return { deleteResult: 'Board and its content had been deleted successfully!' } // dòng này hiển thị ra cho người dùng
  } catch (error) { throw error }
}

export const boardService = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  getBoards,
  deleteBoard
}