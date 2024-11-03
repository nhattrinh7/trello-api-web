import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

const createNew = async (reqBody) => {
  try {
    const newColumn = {
      ...reqBody
    }
    const createdColumn = await columnModel.createNew(newColumn)
    const getNewColumn = await columnModel.findOneById(createdColumn.insertedId)

    // Làm thêm các xử lí logic khác với các Collection khác tùy đặc thù dự án
    // Bắn email, notification về cho admin khi có 1 column mới được tạo...vv

    // xử lí cấu trúc data trước khi trả dữ liệu về
    if (getNewColumn) {
      getNewColumn.cards = [] // file boardModel chỉ chứa cardOrderIds mà trong column có mảng cards chứa bản thân các Card của Column

      // cập nhật mảng columnOrderIds trong boards
      await boardModel.pushColumnOrderIds(getNewColumn)
    }

    return getNewColumn
  } catch (error) { throw error }
}

const update = async (columnId, reqBody) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }
    const updatedColumn = await columnModel.update(columnId, updateData)

    return updatedColumn
  } catch (error) { throw error }
}

const deleteItem = async (columnId) => {
  try {
    const targetColumn = await columnModel.findOneById(columnId)

    if (!targetColumn) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Column not found!: columnService ~ deleteItem')
    }
    // Xóa Column
    await columnModel.deleteOneById(columnId)

    // Xóa toàn bộ Card của Column
    await cardModel.deleteManyByColumnId(columnId)

    // Xóa columnId trong columnOrderIds trong Board, nó nhận vào column nên phải từ columnId find ra Column (làm phía trên)
    await boardModel.pullColumnOrderIds(targetColumn)

    return { deleteResult: 'Column and its Card had been deleted successfully!' } // dòng này hiển thị ra cho người dùng
  } catch (error) { throw error }
}


export const columnService = {
  createNew,
  update,
  deleteItem
}