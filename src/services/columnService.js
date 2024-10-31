import { columnModel } from '~/models/columnModel'
import { boardModel } from '~/models/boardModel'

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

export const columnService = {
  createNew
}