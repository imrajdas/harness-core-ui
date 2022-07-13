/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import moment from 'moment'
import type { UserInfo } from 'services/cd-ng'

export const ON_PREM_RELEASE_NODE_LINK = 'https://ngdocs.harness.io/article/556wy85kbo-harness-on-prem-release-notes'
export const SAAS_RELEASE_NODE_LINK = 'https://ngdocs.harness.io/article/7zkchy5lhj-harness-saa-s-release-notes-2022'

export const HARNESS_SEARCH_LINK = 'https://harness.io/search/'
export const HARNESS_UNIVERISITY_LINK = 'https://university.harness.io/'
export const HARNESS_COMMUNITY_LINK = 'https://community.harness.io/'
export const HARNESS_COMMUNITY_SLACK_LINK =
  'https://join.slack.com/t/harnesscommunity/shared_invite/zt-y4hdqh7p-RVuEQyIl5Hcx4Ck8VCvzBw'
export const HARNESS_DOCS_LINK = 'https://ngdocs.harness.io/'
export const HARNESS_API_DOCS_LINK = 'https://harness.io/docs/api/'
export const SITE_STATUS_LINK = 'https://status.harness.io/'

export const timestamp = moment.now()
export const HARNESS_SUPPORT_LINK =
  '/sso.html?action=login&brand_id=114095000394&locale_id=1&return_to=https%3A%2F%2Fsupport.harness.io%2Fhc%2Fen-us%2Frequests&src=zendesk&timestamp=' +
  timestamp

export const WHATS_NEW_LINK = `https://changelog.harness.io/?categories=ng-fix,ng-improvement,ng-new`
export const EARLY_ACCESS_LINK = `https://changelog.harness.io/?categories=ng-early-access`

export const openZendeskSupport = (e: React.MouseEvent<Element, MouseEvent>): void => {
  e.stopPropagation()
  e.preventDefault()
  window.open(HARNESS_SUPPORT_LINK)
}

export function getReleaseNodeLink(): string {
  switch (window.deploymentType) {
    case 'COMMUNITY':
    case 'ON_PREM': {
      return ON_PREM_RELEASE_NODE_LINK
    }
    default:
      return SAAS_RELEASE_NODE_LINK
  }
}
export const openFileATicket = (
  e: React.MouseEvent<Element, MouseEvent>,
  currentUserInfo: UserInfo,
  setShow: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  e.stopPropagation()
  e.preventDefault()
  window.Saber.do?.('set_options', {
    feedback_values: {
      Email: currentUserInfo.email // set default value for email field
    }
  })
  setShow(false)
  window.Saber.do?.('open')
}
export const openWhatsNew = (e: React.MouseEvent<Element, MouseEvent>): void => {
  e.stopPropagation()
  e.preventDefault()
  window.open(WHATS_NEW_LINK)
}
export const openEarlyAccess = (e: React.MouseEvent<Element, MouseEvent>): void => {
  e.stopPropagation()
  e.preventDefault()
  window.open(EARLY_ACCESS_LINK)
}
