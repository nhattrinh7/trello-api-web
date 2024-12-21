import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import bcryptjs from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { BrevoProvider } from '~/providers/BrevoProvider'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'
import { cardModel } from '~/models/cardModel'


const createNew = async (reqBody) => {
  try {

    // Kiểm tra email đã tồn tại trong hệ thống chưa
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exist!')
    }
    // Tạo data để lưu vào database
    // nếu email là 'trinhminhnhatym@gmail.com' thì lấy được nameFromEmail là 'trinhminhnhatym'
    const nameFromEmail = reqBody.email.split('@')[0]
    const newUser = {
      email: reqBody.email,
      password: bcryptjs.hashSync(reqBody.password, 8), // băm password ra không lưu kiểu plaintext, 8 là độ phức tạp, độ phức tạp càng cao băm càng lâu
      username: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }

    // Lưu thông tin User vào Database
    const createdUser = await userModel.createNew(newUser)
    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Gửi Email cho người dùng xác thực tài khoản
    const verificationLink = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = 'Trello: Please verify your email before using our services!'
    const htmlContent = `
      <h3>Here is your verification link:</h3>
      <h3>${verificationLink}</h3>
      <h3>Sincerely,<br/> - Trello Team - </h3>
    `
    // Gọi tới cái Provider gửi mail
    await BrevoProvider.sendEmail(getNewUser.email, customSubject, htmlContent)


    // return trả về dữ liệu cho Controller, không trả về hashed password và verifyToken
    return pickUser(getNewUser)
  } catch (error) {
    // console.log(error)
    throw error
  }
}

const verifyAccount = async (reqBody) => {
  try {
    // Query user trong Database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Các bước kiểm tra cần thiết
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is already active!')
    if (reqBody.token !== existUser.verifyToken) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!')
    }

    // Nếu như mọi thứ ok thì chúng ta bắt đầu update lại thông tin của thằng user để verify account
    const updateData = {
      isActive: true,
      verifyToken: null
    }
    // Thực hiện update thông tin user
    const updatedUser = await userModel.update(existUser._id, updateData)

    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const login = async (reqBody) => {
  try {
    // Query user trong Database
    const existUser = await userModel.findOneByEmail(reqBody.email)

    // Các bước kiểm tra cần thiết
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active yet!')
    if (!bcryptjs.compareSync(reqBody.password, existUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Email or Password is incorrect!')
    }

    /** Nếu mọi thứ ok thì bắt đầu tạo Tokens đăng nhập để trả về cho phía FE */
    // Tạo thông tin để đính kèm trong JWT Token: bao gồm _id và email của user
    const userInfo = { _id: existUser._id, email: existUser.email }

    // Tạo ra 2 loại token, accessToken và refreshToken để trả về cho phía FE
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      // 5 // 5 giây
      env.ACCESS_TOKEN_LIFE
    )

    const refreshToken = await JwtProvider.generateToken(
      userInfo,
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      // 15 // 15 giây
      env.REFRESH_TOKEN_LIFE
    )

    // Trả về thông tin của user kèm theo 2 cái token vừa tạo ra
    return { accessToken, refreshToken, ...pickUser(existUser) }
  } catch (error) { throw error }
}

const refreshToken = async (refreshToken) => {
  try {
    // Bước 01: Thực hiện giải mã refreshToken xem nó có hợp lệ hay là không
    const refreshTokenDecoded = await JwtProvider.verifyToken(
      refreshToken,
      env.REFRESH_TOKEN_SECRET_SIGNATURE
    )

    // Đoạn này vì chúng ta chỉ lưu những thông tin unique và cố định của user trong token rồi, vì vậy có thể lấy luôn từ decoded ra, tiết kiệm query vào DB để lấy data mới.
    const userInfo = { _id: refreshTokenDecoded._id, email: refreshTokenDecoded.email }

    // Bước 02: Tạo ra cái accessToken mới
    const accessToken = await JwtProvider.generateToken(
      userInfo,
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      // 5 // 5 giây
      env.ACCESS_TOKEN_LIFE
    )

    return { accessToken }
  } catch (error) { throw error }
}

const update = async (userId, userEmail, reqBody, userAvatarFile) => {
  try {
    // Query User và kiểm tra cho chắc chắn
    const existUser = await userModel.findOneById(userId)
    if (!existUser) throw new ApiError(StatusCodes.NOT_FOUND, 'Account not found!')
    if (!existUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your account is not active!')

    // Khởi tạo kết quả updated User ban đầu là empty
    let updatedUser = {}

    // Trường hợp change password
    if (reqBody.current_password && reqBody.new_password) {
      if (!bcryptjs.compareSync(reqBody.current_password, existUser.password)) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Your Current Password is incorrect!')
      }
      // Nếu như current_password là đúng thì chúng ta sẽ hash một cái mật khẩu mới và update lại vào DB:
      updatedUser = await userModel.update(existUser._id, {
        password: bcryptjs.hashSync(reqBody.new_password, 8)
      })
    } else if (userAvatarFile) {
      // Trường hợp upload file lên Cloud Storage, cụ thể là Cloudinary
      const uploadResult = await CloudinaryProvider.streamUpload(userAvatarFile.buffer, 'users')
      // update cả cái userAvatar trong comment của card nữa
      await cardModel.updateAvatarUserComment(userEmail, uploadResult.secure_url)

      // console.log('uploadResult: ', uploadResult)

      // Lưu lại url (secure_url) của cái file ảnh vào trong Database
      updatedUser = await userModel.update(existUser._id, { avatar: uploadResult.secure_url })
    } else {
      // Trường hợp update các thông tin chung, ví dụ như displayName
      updatedUser = await userModel.update(existUser._id, reqBody)

      // update cả displayName trong các comment cũ của user
      await cardModel.updateAvatarUserDisplayName(userEmail, reqBody.displayName)
    }

    return pickUser(updatedUser)
  } catch (error) { throw error }
}

const resetPassword = async (reqBody) => {
  try {
    // Kiểm tra email đã tồn tại trong hệ thống chưa
    const existUser = await userModel.findOneByEmail(reqBody.email)
    if (!existUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email does not exist!' )
    }

    const updateData = {
      verifyToken: uuidv4(),
      tokenExpiredAt: Date.now() + 3 * 60 * 1000
    }

    // update thông tin user vào Database
    const updatedUser = await userModel.update(existUser._id, updateData)
    // console.log(updatedUser)

    // Gửi Email cho người dùng xác thực tài khoản
    const ressetLink = `${WEBSITE_DOMAIN}/account/reset?email=${updatedUser.email}&token=${updatedUser.verifyToken}`
    const customSubject = 'Trello: CLick the link to reset your password!'
    const htmlContent = `
      <h3>Here is your reset link:</h3>
      <h3>${ressetLink}</h3>
      <h3>Sincerely,<br/> - Trello Team - </h3>
    `
    // Gọi tới cái Provider gửi mail
    await BrevoProvider.sendEmail(updatedUser.email, customSubject, htmlContent)


    // return trả về dữ liệu cho Controller, không trả về hashed password và verifyToken
    return pickUser(updatedUser)
  } catch (error) {
    // console.log(error)
    throw error
  }
}

const createNewPassword = async (reqBody) => {
  try {
    // Trường hợp submit form set lại password mới
    if (reqBody.createNewPasswordMessage) {
      // Query user trong Database
      const existUser = await userModel.findOneByEmail(reqBody.email)

      // Các bước kiểm tra cần thiết
      if (Date.now() > existUser.tokenExpiredAt) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is expired, have to click the link within 3 mins of receiving it !')
      }
      if (reqBody.token !== existUser.verifyToken) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is invalid!')
      }

      // Nếu như mọi thứ ok thì chúng ta bắt đầu update lại thông tin của thằng user để verify account
      const updateData = {
        verifyToken: null,
        password: bcryptjs.hashSync(reqBody.password, 8)
      }
      // Thực hiện update thông tin user
      const updatedUser = await userModel.update(existUser._id, updateData)

      return pickUser(updatedUser)
    }

    // Trường hợp check token hết hạn hay chưa khi nhấn vào link
    if (reqBody.checkExpiredTokenMessage) {
      const existUser = await userModel.findOneByEmail(reqBody.email)

      if (Date.now() > existUser.tokenExpiredAt) {
        throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Token is expired, have to click the link within 3 mins of receiving it !')
      } else return {}
    }

  } catch (error) { throw error }
}

export const userService = {
  createNew,
  verifyAccount,
  login,
  refreshToken,
  update,
  resetPassword,
  createNewPassword
}