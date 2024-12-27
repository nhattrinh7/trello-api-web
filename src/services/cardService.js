import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'


const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }
    const createdCard = await cardModel.createNew(newCard)
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    // Làm thêm các xử lí logic khác với các Collection khác tùy đặc thù dự án
    // Bắn email, notification về cho admin khi có 1 card mới được tạo...vv

    if (getNewCard) {
      // cập nhật mảng cardOrderIds trong columns
      await columnModel.pushCardOrderIds(getNewCard)
    }

    return getNewCard
  } catch (error) { throw error }
}

const update = async (cardId, reqBody, cardCoverFile, cardAttachments, userInfo) => {
  try {
    const updateData = {
      ...reqBody,
      updatedAt: Date.now()
    }

    let updatedCard = {}

    if (cardCoverFile) {
      // dùng multer là upload.fields nên nó trả ra 1 object chứa 1 mảng, trong mảng là các dữ liệu đẩy lên, ko như upload.single
      // là trả về 1 object của 1 file thôi, với uploadCardCover thì cái mình cần là 1 object cơ bản thôi, nên nếu ko biến đổi sẽ lỗi
      const firstValue = Object.values(cardCoverFile)[0]
      const cardCoverObject = firstValue[0]

      const uploadResult = await CloudinaryProvider.streamUpload(cardCoverObject.buffer, 'card-covers')
      updatedCard = await cardModel.update(cardId, { cover: uploadResult.secure_url })

    } else if (cardAttachments) {
      // Khi có file attachments đính kèm
      const attachments = cardAttachments.attachments
      const attachmentsArray = []
      for (const file of attachments) {
        const uploadResult = await CloudinaryProvider.streamUploadAttachments(file.buffer, 'card-attachments')
        attachmentsArray.push({
          url: uploadResult.secure_url,
          name: file.originalname,
          mimetype: file.mimetype
        })
      }
      updatedCard = await cardModel.unshiftNewAttachments(cardId, attachmentsArray)

    } else if (updateData.commentToAdd) {
      // Tạo dữ liệu comment để thêm vào Database, cần bổ sung thêm những field cần thiết
      const commentData = {
        ...updateData.commentToAdd,
        commentedAt: Date.now(),
        userId: userInfo._id,
        userEmail: userInfo.email
      }
      updatedCard = await cardModel.unshiftNewComment(cardId, commentData) // unshift là đẩy vào đầu của mảng, comment mới đẩy vào đầu luôn và sẽ được hiển thị trên đầu
    } else if (updateData.incomingMemberInfo) {
      // Trường hợp ADD hoặc REMOVE thành viên ra khỏi Card
      // console.log(updateData.incomingMemberInfo)
      updatedCard = await cardModel.updateMembers(cardId, updateData.incomingMemberInfo)
    } else if (updateData.attachmentUrl) {
      // Trường hợp xóa 1 attachment khỏi card
      updatedCard = await cardModel.pullOneAttachment(cardId, updateData.attachmentUrl)
    } else {
      // Các trường hợp update chung như title, description
      updatedCard = await cardModel.update(cardId, updateData)
    }

    return updatedCard
  } catch (error) { throw error }
}

const deleteItem = async (cardId) => {
  try {
    const targetCard = await cardModel.findOneById(cardId)
    if (!targetCard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!: cardService ~ deleteItem')
    }
    // Xóa Card trong collection cards
    await cardModel.deleteOneById(cardId)

    // Xóa cardId trong cardOrderIds của column chứa nó
    await columnModel.pullCardOrderIds(targetCard)

    return { deleteResult: 'Card had been deleted successfully!' } // dòng này hiển thị ra cho người dùng
  } catch (error) { throw error }
}

const deleteCardCover = async (cardId) => {
  try {
    const targetCard = await cardModel.findOneById(cardId)
    if (!targetCard) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Card not found!: cardService ~ deleteItem')
    }
    await cardModel.update(cardId, { cover: null })

    return { deleteResult: 'Card cover had been deleted successfully!' }
  } catch (error) { throw error }
}

export const cardService = {
  createNew,
  update,
  deleteItem,
  deleteCardCover
}