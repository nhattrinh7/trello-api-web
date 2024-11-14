import { env } from '~/config/environment'

// những Domain được phép truy cập tới server này
export const WHITELIST_DOMAINS = [
  'http://localhost:5173' // không có '/' ở cuối
  // sau này deploy lên domain chính thức thì sẽ có thêm ở đây
]

export const BOARD_TYPES = {
  PUBLIC: 'public',
  PRIVATE: 'private'
}

export const WEBSITE_DOMAIN = (env.BUILD_MODE === 'production') ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT