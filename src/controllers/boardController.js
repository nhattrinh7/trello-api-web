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

export const boardController = {
  createNew
}