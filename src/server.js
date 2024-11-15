import express from 'express'
import cors from 'cors'
import { corsOptions } from '~/config/cors'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from './config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import cookieParser from 'cookie-parser'

const START_SERVER = () => {

  const app = express()

  // Khắc phục trường hợp Cache from disk của ExpressJS
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  // Use cookieParser
  app.use(cookieParser())

  // xử lí Cors
  app.use(cors(corsOptions))

  // middleware dùng để parse dữ liệu JSON ra được ví dụ từ req.body, nếu ko req.body sẽ là undefined
  app.use(express.json())

  app.use('/v1', APIs_V1)

  // Middleware xử lí lỗi tập trung
  app.use(errorHandlingMiddleware)

  app.listen(env.APP_PORT, env.APP_HOST, () => {
    console.log(`3. ${env.AUTHOR}, Back-end Server is running successfully at http://${ env.APP_HOST }:${ env.APP_PORT }/`)
  })

  // thằng này chạy windows đang hơi lỗi tí ko exit dc, kệ bà nó exit hay ko ko quan trọng ô tô kê!
  // sau deploy lên máy chủ chạy Linux khả năng là lại ô tô kê ngay ko sau đâu babi <3
  exitHook(() => {
    console.log('4. Server is shutting down...')
    CLOSE_DB()
    console.log('5. Disconnected to MongoDB Cloud Atlas!')
  })
}

// kết nối Database thành công thì mới Start Server lên
(async () => {
  try {
    console.log('1. Connecting to MongoDB Cloud Atlas...')
    await CONNECT_DB()
    console.log('2. Connected to MongoDB Cloud Atlas!')

    START_SERVER()
  } catch (error) {
    console.error('Error nè ->', error)
    process.exit(0)
  }
})()

// console.log('1. Connecting to MongoDB Cloud Atlas...')
// // CONNECT_DB là async function nên sẽ trả về 1 Promise
// CONNECT_DB()
//   .then(() => console.log('2. Connected to MongoDB Cloud Atlas!'))
//   .then(() => START_SERVER())
//   .catch(error => {
//     console.error('Error nè ->', error)
//     process.exit(0)
//   })
