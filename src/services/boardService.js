/* eslint-disable no-useless-catch */
/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */

import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'

const createNew = async (reqBody) => {
  try {
    const newBoard = {
      ...reqBody,
      slug: slugify(reqBody.title)
    }

    // Gọi tới Model để xử lí lưu bản ghi newBoard vào Database
    const createdBoard = await boardModel.createNew(newBoard)

    // Lấy bản ghi board sau khi gọi (tùy dự án có cần bước này hay không)
    const getNewBoard = await boardModel.findOneById(createdBoard.insertedId) //insertedId là ObjectId của board mình vừa gọi
    // console.log(getNewBoard)

    // Làm thêm các xử lí logic khác với các Collection khác tùy đặc thù dự án
    // Bắn email, notification về cho admin khi có 1 board mới được tạo...vv

    // Phải có return
    return getNewBoard
  } catch (error) { throw error }
}

export const boardService = {
  createNew
}