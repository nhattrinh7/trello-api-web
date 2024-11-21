export const inviteUserToBoardSocket = (socket) => {
  // Lắng nghe sự kiện mà client emit lên có tên là FE_USER_INVITED_TO_BOARD
  socket.on('FE_USER_INVITED_TO_BOARD', (invitation) => {
  // Cách làm nhanh & đơn giản nhất: Emit ngược lại 2 sự kiện về cho mọi client khác (ngoại trừ chính thằng gửi emit lên server), rồi để phía FE check
    socket.broadcast.emit('BE_USER_INVITED_TO_BOARD', invitation)
  })
}