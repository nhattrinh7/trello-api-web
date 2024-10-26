import { slugify } from '~/utils/formatters'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { cloneDeep } from 'lodash'

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

const getDetails = async (boardId) => {
  try {
    const board = await boardModel.getDetails(boardId)
    if (!board) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Board not found!')
    }

    // tùy mục đích cần cloneDeep hay không, trong trường hợp này ko muốn ảnh hưởng đến dữ liệu ban đầu
    // dữ liệu cards đang cùng cấp với columns, không embeded như FE nên giờ embed cards vào trong columns
    // Bước 1:
    const resBoard = cloneDeep(board)

    //Bước 2: Cần toString(vì nếu ko toString thì là đang so sánh 2 cái ObjectId với nhau thì ko so được)
    resBoard.columns.forEach(column => {
      column.cards = resBoard.cards.filter(card => card.columnId.equals(column._id)) // cách này ko cần toString thì MongoDB support equals (equals của MongoDB còn toString là của Javascript)
      // column.cards = resBoard.cards.filter(card => card.columnId.toString() === column._id.toString())
    })

    // Bước 3: embeb xong rồi thì xóa cards thừa (cái mà song song với columns)
    delete resBoard.cards

    // Phải có return
    return resBoard
  } catch (error) { throw error }
}

export const boardService = {
  createNew,
  getDetails
}