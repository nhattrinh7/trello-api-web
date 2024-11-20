// https://www.mongodb.com/docs/manual/reference/method/cursor.skip/#pagination-example
// Tính toán giá trị skip phục vụ các tác vụ phân trang
export const pagingSkipValue = (page, itemsPerPage) => {
  // Luôn đảm bảo nếu giá trị không hợp lệ thì return về 0 hêt
  if (!page || !itemsPerPage) return 0
  if (page <= 0 || itemsPerPage <= 0) return 0

  return (page - 1) * itemsPerPage
}
