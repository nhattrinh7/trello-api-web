import multer from 'multer'
import { maxFileSize, allowedFileTypes } from '~/utils/validators'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

/*
* https://www.npmjs.com/package/multer
*/

// Function Kiểm tra loại file nào được chấp nhận - đây là func kiểm tra thôi
const customFileFilter = (req, file, callback) => {
  // Đối với thằng multer, kiểm tra kiểu file thì sử dụng mimetype
  if (!allowedFileTypes.includes(file.mimetype)) {
    const errMessage = 'File type is invalid. Error in multerUploadMiddleware.js'
    return callback(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, errMessage), null)
  }
  // Nếu như kiểu file hợp lệ:
  return callback(null, true)
}

// Khởi tạo function upload được bọc bởi thằng multer - đây là func khởi tạo
const upload = multer({
  limits: { fileSize: maxFileSize },
  fileFilter: customFileFilter
})

export const multerUploadMiddleware = {
  uploadSingleAvatar: upload.single('avatar'),
  uploadCardFields: upload.fields([
    { name: 'cardCover', maxCount: 1 },
    { name: 'attachments', maxCount: 10 }
  ])
}
