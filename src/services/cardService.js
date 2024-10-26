import { cardModel } from '~/models/cardModel'

const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }
    const createdCard = await cardModel.createNew(newCard)
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    // Làm thêm các xử lí logic khác với các Collection khác tùy đặc thù dự án
    // Bắn email, notification về cho admin khi có 1 card mới được tạo...vv

    return getNewCard
  } catch (error) { throw error }
}

export const cardService = {
  createNew
}