
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

export const APPOINT_TYPES = {
  OWNER: 'owner',
  MEMBER: 'member'
}

export const WEBSITE_DOMAIN = (env.BUILD_MODE === 'production') ? env.WEBSITE_DOMAIN_PRODUCTION : env.WEBSITE_DOMAIN_DEVELOPMENT

export const DEFAULT_PAGE = 1
export const DEFAULT_ITEMS_PER_PAGE = 12

export const INVITATION_TYPES = {
  BOARD_INVITATION: 'BOARD_INVITATION'
}

export const BOARD_INVITATION_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED'
}

export const CARD_MEMBER_ACTIONS = {
  ADD: 'ADD',
  REMOVE: 'REMOVE'
}

export const BOARD_ALLOW_STATUS = {
  ALLOW: 'ALLOW',
  NOTALLOW: 'NOTALLOW'
}
