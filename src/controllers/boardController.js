import { StatusCodes } from 'http-status-codes'
import { boardService } from '~/services/boardService'

const createNew = async (req, res, next) => {
  try {
    // Điều hướng dữ liệu sang tầng Service
    const createdBoard = await boardService.createNew(req.body)
    // Có kết quả thì trả về phía Client
    res.status(StatusCodes.CREATED).json(createdBoard)

  } catch (error) {
    // Những file nào liên kết với Controller mà sảy ra lỗi, chỉ cần throw lỗi, lỗi tập trung ở Controller để đẩy sang Middleware xử lí lỗi
    next(error)
  }
}

const getDetails = async (req, res, next) => {
  try {
    const boardId = req.params.id //đặt tên cho rõ ràng tí thôi :))
    // sau học Advanced sẽ có thêm userId để chỉ lấy board thuộc về user đó thôi blabla...
    const board = await boardService.getDetails(boardId)
    res.status(StatusCodes.OK).json(board)

  } catch (error) {
    // Những file nào liên kết với Controller mà sảy ra lỗi, chỉ cần throw lỗi, lỗi tập trung ở Controller để đẩy sang Middleware xử lí lỗi
    next(error)
  }
}

export const boardController = {
  createNew,
  getDetails
}