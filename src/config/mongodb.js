/**
 * Updated by trungquandev.com's author on August 17 2023
 * YouTube: https://youtube.com/@trungquandev
 * "A bit of fragrance clings to the hand that gives flowers!"
 */


const { MongoClient, ServerApiVersion } = require('mongodb')
import { env } from '~/config/environment'

// tạo ra đối tượng để lấy database, trelloDatabaseInstance chính là database
let trelloDatabaseInstance = null

// khởi tạo một đối tượng Client để connect tới Database
const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  // serverApi có từ version 5.0.0, có thể ko cần dùng nó, nếu dùng nghĩa là chúng ta
  // định nghĩa một cái Stable API Version của MongoDB
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

//kết nối tới Database
export const CONNECT_DB = async () => {
  // gọi kết nối tới MongoDB Atlas với URI đã khai báo
  await mongoClientInstance.connect()
  // trả về đối tượng Database được chỉ định với tên là DATABASE_NAME
  trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME) //connect xong thì gán vào Instance
}

// hàm thường không async
export const GET_DB = () => {
  if (!trelloDatabaseInstance) throw new Error('Must connect to Database first!')
  return trelloDatabaseInstance
}

// đóng kết nối tới Database khi cần
export const CLOSE_DB = async () => {
  await mongoClientInstance.close()
}
