import express from 'express'
import cors from 'cors'
import { corsOptions } from '~/config/cors'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from './config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1'
import { errorHandlingMiddleware } from './middlewares/errorHandlingMiddleware'
import cookieParser from 'cookie-parser'
import socketIo from 'socket.io'
import http from 'http' // 1 thư viện build-in của socket.io
import { inviteUserToBoardSocket } from './sockets/inviteUserToBoardSocket'


const START_SERVER = () => {

  const app = express()

  // Khắc phục trường hợp Cache from disk của ExpressJS
  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.use(cookieParser())

  app.use(cors(corsOptions))

  // middleware dùng để parse dữ liệu JSON ra được ví dụ từ req.body, nếu ko req.body sẽ là undefined
  app.use(express.json())

  app.use('/v1', APIs_V1)

  app.use(errorHandlingMiddleware)

  // Tạo 1 cái Server mới bọc thằng app của Express để làm real-time, vì thằng socket.io cần làm việc với http.createServer của nodejs
  const server = http.createServer(app)
  // Khởi tạo biến io với server và cors
  const io = socketIo(server, { cors: corsOptions }) // ở đây là xử lí cors với socket.io ko phải cors để gọi API như ở trên

  io.on('connection', (socket) => { // khi nhận được connect từ client, socket.io ở server sẽ tạo ra biến socket, biến này dùng để quản lí cái kết nối được gửi lên
    inviteUserToBoardSocket(socket)
  })

  // Dùng server.listen thay vì app.listen vì lúc này server đã bao gồm express app và đã config socket.io
  if (env.BUILD_MODE === 'production') {
    server.listen(process.env.PORT, () => { //PORT này hình như khác trong .env, check thử xem
      console.log(`3. Production: Back-end Server is running successfully at: Port: ${process.env.PORT}`)
    })
  } else {
    server.listen(env.APP_PORT, env.APP_HOST, () => {
      console.log(`3. LocalDev: Back-end Server is running successfully at http://${ env.APP_HOST }:${ env.APP_PORT }/`)
    })
  }

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
