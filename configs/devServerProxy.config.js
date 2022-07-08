/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

const baseUrl = process.env.BASE_URL ?? 'https://qa.harness.io/gateway'
const targetLocalHost = (process.env.TARGET_LOCALHOST && JSON.parse(process.env.TARGET_LOCALHOST)) ?? true // set to false to target baseUrl environment instead of localhost

console.log('\nProxy env vars')
console.table({ baseUrl, targetLocalHost })

module.exports = {
  '/ng/api': {
    pathRewrite: { '^/ng/api': '' },
    target: targetLocalHost ? 'https://localhost:7090' : `${baseUrl}/ng/api`
  },
  '/pipeline/api': {
    pathRewrite: { '^/pipeline/api': '/api' },
    target: targetLocalHost ? 'http://localhost:12001' : `${baseUrl}/pipeline`
  },
  '/notifications/api': {
    pathRewrite: { '^/notifications/api': '/api' },
    target: targetLocalHost ? 'http://localhost:9005' : `${baseUrl}/notifications`
  },
  '/resourcegroup/api': {
    pathRewrite: { '^/resourcegroup/api': '/api' },
    target: targetLocalHost ? 'http://localhost:9005' : `${baseUrl}/resourcegroup`
  },
  '/authz/api': {
    pathRewrite: { '^/authz/api': '/api' },
    target: targetLocalHost ? 'http://localhost:9006' : `${baseUrl}/authz`
  },
  '/api': {
    target: targetLocalHost ? 'https://localhost:9090' : baseUrl
  },
  '/gateway/api': {
    pathRewrite: { '^/gateway': '' },
    target: targetLocalHost ? 'https://localhost:9090' : baseUrl
  },
  '/template/api': {
    pathRewrite: { '^/template/api': '' },
    target: targetLocalHost ? 'http://localhost:15001/api' : `${baseUrl}/template/api`
  },
  '/cv/api': {
    target: targetLocalHost ? 'https://localhost:6060' : `${baseUrl}`
  },
  '/cf': {
    target: targetLocalHost ? 'http://localhost:3000' : baseUrl,
    pathRewrite: targetLocalHost ? { '^/cf': '/api/1.0' } : {}
  },
  '/ci': {
    target: targetLocalHost ? 'https://localhost:7171' : baseUrl
  },
  '/ti-service': {
    target: targetLocalHost ? 'https://localhost:7457' : baseUrl
  },
  '/log-service': {
    pathRewrite: { ...(targetLocalHost ? { '^/log-service': '' } : {}) },
    target: targetLocalHost ? 'http://localhost:8079' : baseUrl
  },
  '/lw/api': {
    target: targetLocalHost ? 'http://localhost:9090' : `${baseUrl}/lw/api`,
    pathRewrite: { '^/lw/api': '' }
  },
  '/dashboard': {
    target: process.env.CUSTOM_DASHBOARDS_API_URL || baseUrl
  },
  '/gateway/dashboard': {
    pathRewrite: { '^/gateway/dashboard': '/dashboard' },
    target: process.env.CUSTOM_DASHBOARDS_API_URL || baseUrl
  },
  '/ng-dashboard/api': {
    target: targetLocalHost ? 'http://localhost:7100' : `${baseUrl}/ng-dashboard/api`,
    pathRewrite: { '^/ng-dashboard/api': '' }
  },
  '/ccm/api': {
    target: targetLocalHost ? 'http://localhost:5000' : baseUrl
  },
  '/ccm/public-pricing/api': {
    target: targetLocalHost ? 'http://localhost:5000' : baseUrl
  },
  '/ccm/recommendations/api': {
    target: targetLocalHost ? 'http://localhost:5000' : baseUrl
  },
  '/pm/api': {
    pathRewrite: { '^/pm': '' },
    target: process.env.OPA_GOVERNANCE_API_URL || 'http://localhost:3001'
  },
  '/pm': {
    pathRewrite: { '^/pm': '' },
    target: process.env.OPA_GOVERNANCE_UI_URL || 'http://localhost:3000'
  },
  '/sto/api': {
    pathRewrite: { '^/sto': '' },
    target: process.env.STO_API_URL || 'http://localhost:4000'
  },
  '/sto': {
    pathRewrite: { '^/sto(/v2)?': '' },
    target: process.env.STO_UI_URL || 'http://localhost:3002'
  },
  '/gitops': {
    pathRewrite: { '^/gitops': '' },
    target: process.env.GITOPS_URL || 'https://localhost:8183'
  },
  '/chaos': {
    pathRewrite: { '^/chaos': '' },
    target: process.env.CHAOS_UI_URL || 'https://localhost:8184'
  },
  '/et': {
    pathRewrite: { '^/et': '' },
    target: process.env.ERROR_TRACKING_URL || 'http://localhost:9191'
  },
  '/audit/api': {
    pathRewrite: { '^/ng/api': '' },
    target: targetLocalHost ? 'http://localhost:9005' : baseUrl
  },
  '/auth': {
    pathRewrite: { '^/auth': '' },
    target: 'https://app.harness.io/auth'
  },
  '/ccmui': {
    pathRewrite: { '^/ccmui': '' },
    target: process.env.CCM_UI_URL || 'https://localhost:8183'
  }
}
