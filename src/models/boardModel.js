import Joi from 'joi'
import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { BOARD_TYPES } from '~/utils/constants'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'

// Define Collection (name & schema)
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().required().min(3).max(50).trim().strict(),
  slug: Joi.string().required().min(3).trim().strict(),
  description: Joi.string().required().min(3).max(256).trim().strict(),
  type: Joi.string().valid(...Object.values(BOARD_TYPES)).required(),

  // Lưu ý các item trong mảng columnOrderIds là ObjectId nên cần thêm pattern cho chuẩn nhé
  columnOrderIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null), // chứa thời gian của lần update gần nhất
  _destroy: Joi.boolean().default(false)
})

// chỉ định các field không cho phép cập nhật trong hàm update
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

// validateBeforeCreate chỉ sử dụng trong Model thôi (createNew)
const validateBeforeCreate = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validData = await validateBeforeCreate(data)
    const createdBoard = await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(validData)

    return createdBoard
  } catch (error) { throw new Error(error) }
}

// insert xong có thể cần hàm này để trả dữ liệu của board vừa insert về client
// chỉ lấy dữ liệu board mà thôi, ko lấy dữ liệu Columns và Cards
const findOneById = async (id) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({
      _id: new ObjectId(String(id))
    })
    return result
  } catch (error) { throw new Error(error) }
}

// query tổng hợp để lấy toàn bộ các Columns và Cards thuộc Board
const getDetails = async (id) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      { $match: {
        _id: new ObjectId(String(id)),
        _destroy: false
      } },
      { $lookup: {
        from: columnModel.COLUMN_COLLECTION_NAME,
        localField: '_id',
        foreignField: 'boardId',
        as: 'columns'
      } },
      { $lookup: {
        from: cardModel.CARD_COLLECTION_NAME,
        localField: '_id',
        foreignField: 'boardId',
        as: 'cards'
      } }
    ]).toArray() // Aggregate trả về dữ liệu, toArray() để biến nó thành dạng mảng
    // console.log(result)
    return result[0] || null // nếu có dữ liệu thì là phần tử đầu tiên của mảng (ở đây ta chỉ lấy 1 cái board) vì ObjectId của board là unique
    // để null thay vì object rỗng {} để nếu ObjectId của Board được truyền vào không đúng, ở Service cái if(!board) vẫn bắt được, {} thì ko bắt được
  } catch (error) { throw new Error(error) }
}

// nhiệm vụ của function này là push 1 giá trị columnId vào cuối mảng columnOrderIds
const pushColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(column.boardId)) }, // <filter>
      { $push: { columnOrderIds: new ObjectId(String(column._id)) } }, // <update>
      { returnDocument: 'after' } // <options>
    )

    return result
  } catch (error) { throw new Error(error) }
}

// lấy 1 phần tử columnId ra từ columnOrderIds
const pullColumnOrderIds = async (column) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(column.boardId)) },
      { $pull: { columnOrderIds: new ObjectId(String(column._id)) } },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) { throw new Error(error) }
}

const update = async (boardId, updateData) => {
  try {
    Object.keys(updateData).forEach(fieldName => {
      if (INVALID_UPDATE_FIELDS.includes(fieldName)) {
        delete updateData[fieldName]
      }
    })

    // Những dữ liệu lien quan ObjectId thì biến đổi ở đây
    if (updateData.columnOrderIds) {
      updateData.columnOrderIds = updateData.columnOrderIds.map(_id => (new ObjectId(String(_id))))
    }

    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(boardId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) { throw new Error(error) }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumnOrderIds,
  update,
  pullColumnOrderIds
}