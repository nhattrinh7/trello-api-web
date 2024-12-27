import { StatusCodes } from 'http-status-codes'
import { cardService } from '~/services/cardService'

const createNew = async (req, res, next) => {
  try {
    const createdCard = await cardService.createNew(req.body)
    res.status(StatusCodes.CREATED).json(createdCard)

  } catch (error) { next(error) }
}

const update = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const userInfo = req.jwtDecoded
    let cardCoverFile
    let cardAttachments
    // Trường hợp Join/leave chỉ có req.body, không có req.files, cần if ở đây để tránh ko đụng đến req.files mà lại chạy
    // cái đám code firstKey ở trong chúng nó tác động đến req.files thì cái req.body cũng sẽ bị tác động ảnh hưởng thành ra lỗi
    if (req.files !== undefined) {
      const firstKey = Object.keys(req.files)[0]
      if (firstKey === 'cardCover') {
        cardCoverFile = req.files
      }
      else if (firstKey === 'attachments') {
        cardAttachments = req.files
      }
    }
    const updatedCard = await cardService.update(cardId, req.body, cardCoverFile, cardAttachments, userInfo)

    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) { next(error) }
}

const deleteItem = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const deletedCard = cardService.deleteItem(cardId)

    res.status(StatusCodes.OK).json(deletedCard)
  } catch (error) { next(error) }
}

const deleteCardCover = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const deletedCard = cardService.deleteCardCover(cardId)

    res.status(StatusCodes.OK).json(deletedCard)
  } catch (error) { next(error) }
}

export const cardController = {
  createNew,
  update,
  deleteItem,
  deleteCardCover
}