import { WHITELIST_DOMAINS } from '~/utils/constants'
import { env } from '~/config/environment'
import { StatusCodes } from 'http-status-codes'
import ApiError from '~/utils/ApiError'

// Cấu hình CORS Option trong dự án thực tế
export const corsOptions = {
  origin: function (origin, callback) {
    // Cho phép việc gọi API bằng POSTMAN trên môi trường DEV,
    // Thông thường khi sử dụng postman thì cái origin sẽ có giá trị là undefined
    // Update mới: Ở video số 75 trong chuỗi MERN Stack PRO khi chúng ta deploy dự án lên một Server Production thì sẽ sửa lại đoạn này thêm một chút nữa để phù hợp với từng môi trường production hoặc dev nhé. Học với mình thì các bạn cứ yên tâm về sự chỉn chu chuẩn chỉnh nhé :D
    if (!origin && env.BUILD_MODE === 'dev') { // chỉ cho Postman đi qua khi môi trường là DEV, production Postman ko đụng vô được, bảo mật blabla
      return callback(null, true) // null tức là ko có lỗi - true là cho phép CORS
    }

    // Kiểm tra xem origin có phải là domain được chấp nhận hay không
    if (WHITELIST_DOMAINS.includes(origin)) {
      return callback(null, true)
    }

    // Cuối cùng nếu domain không được chấp nhận thì trả về lỗi
    return callback(new ApiError(StatusCodes.FORBIDDEN, `${origin} not allowed by our CORS Policy.`))
  },

  // Some legacy browsers (IE11, various SmartTVs) choke on 204 - No Content - máy chủ xử lí thành công yêu cầu nhưng ko có dữ liệu vào được trả về
  optionsSuccessStatus: 200,

  // CORS sẽ cho phép nhận cookies từ request, (Nhá hàng :D | Ở khóa MERN Stack Advance nâng cao học trực tiếp mình sẽ hướng dẫn các bạn đính kèm jwt access token và refresh token vào httpOnly Cookies)
  credentials: true
}
