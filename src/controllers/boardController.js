import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const createNew = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const createdBoard = await boardService.createNew(userId, req.body)

    // Có kết quả thì trả về phía Client
    res.status(StatusCodes.CREATED).json(createdBoard)
  } catch (error) {
    // Những file nào liên kết với Controller mà sảy ra lỗi, chỉ cần throw lỗi, lỗi tập trung ở Controller để đẩy sang Middleware xử lí lỗi
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    const boardId = req.params.id //đặt tên cho rõ ràng tí thôi :))
    const board = await boardService.getDetails(userId, boardId)

    res.status(StatusCodes.OK).json(board)
  } catch (error) { next(error) }
}

const update = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const userId = req.jwtDecoded._id
    // console.log(req.params.id)
    const updatedBoard = await boardService.update(boardId, userId, req.body)

    res.status(StatusCodes.OK).json(updatedBoard)
  } catch (error) { next(error) }
}

const moveCardToDifferentColumn = async (req, res, next) => {
  try {
    const result = await boardService.moveCardToDifferentColumn(req.body)

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const getBoards = async (req, res, next) => {
  try {
    const userId = req.jwtDecoded._id
    // page và itemsPerPage được truyền vào trong query url từ phía FE nên BE sẽ lấy thông qua req.query
    // có trường hợp cho phép FE ko đẩy lên 2 giá trị này, bên Service sẽ phải có giá trị mặc định
    const { page, itemsPerPage, q } = req.query
    const queryFilters = q
    // console.log(queryFilters)

    // const results = await boardService.getBoards(userId, page, itemsPerPage)
    const results = await boardService.getBoards(userId, page, itemsPerPage, queryFilters)

    res.status(StatusCodes.OK).json(results)
  } catch (error) { next(error) }
}

const deleteBoard = async (req, res, next) => {
  try {
    const boardId = req.params.id
    const result = await boardService.deleteBoard(boardId)

    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

export const boardController = {
  createNew,
  getDetails,
  update,
  moveCardToDifferentColumn,
  getBoards,
  deleteBoard
}