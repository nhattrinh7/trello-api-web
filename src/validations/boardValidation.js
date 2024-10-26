import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'
import { BOARD_TYPES } from '~/utils/constants'

const createNew = async (req, res, next) => {
  /**
   * Note: mặc định không cần custom message phía BE làm gì vì để FE tự validate và custom phía FE cho đẹp
   * BE chỉ cần validate đảm bảo dữ liệu chuẩn xác và trả về message mặc định từ thư viện là được
   *** QUAN TRỌNG: việc validate dữ liệu ở BE là BẮT BUỘC vì đây là điểm cuối lưu dữ liệu vào database, dữ liệu sai
   * cái thì dở hơi
   * Và thông thường trong thực tế, điều tốt nhất cho hệ thống là hãy luôn validate dữ liệu ở cả BE và FE
   */
  const correctCondition = Joi.object({
    title: Joi.string().required().min(3).max(50).trim().strict().messages({ //trim() phải đi kèm strict() mới trim được
      'any.required': 'Title is required',
      'string.empty': 'Title is not allowed to be empty ',
      'string.min': 'Title min 3 chars',
      'string.max': 'Title max 50 chars',
      'string.trim': 'Title must not have leading and trailing whitespaces'
    }),
    description: Joi.string().required().min(3).max(256).trim().strict(),
    type: Joi.string().valid(...Object.values(BOARD_TYPES)).required() // sau này khi người dùng đẩy lên, cho người dùng chọn public hoặc private
  })

  try {
    // console.log(req.body)
    await correctCondition.validateAsync(req.body, { abortEarly: false }) // để nếu có nhiều lỗi thì sẽ trả về tất cả, không trả về chỉ 1 cái 1
    next()

  } catch (error) {
    const errorMessage = new Error(error).message
    const customError = new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errorMessage)
    next(customError)
  }
}

export const boardValidation = {
  createNew
}