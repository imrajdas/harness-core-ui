/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-duplicate-imports */
declare const __DEV__: boolean
declare const Bugsnag: any
declare const __BUGSNAG_RELEASE_VERSION__: string
declare module '*.png' {
  const value: string
  export default value
}
declare module '*.jpg' {
  const value: string
  export default value
}
declare module '*.svg' {
  const value: string
  export default value
}

declare module '*.gif' {
  const value: string
  export default value
}

declare module '*.mp4' {
  const value: string
  export default value
}
declare module '*.yaml' {
  const value: Record<string, any>
  export default value
}

declare module '*.yml' {
  const value: Record<string, any>
  export default value
}

declare module '*.gql' {
  const query: string
  export default query
}

declare interface Window {
  apiUrl: string
  segmentToken: string
  HARNESS_ENABLE_NG_AUTH_UI: boolean
  bugsnagClient: any
  bugsnagToken: string
  Harness: {
    openNgTooltipEditor: () => void
    openTooltipEditor: () => void
  }
  getApiBaseUrl: (str: string) => string
  MktoForms2: any
  TOUR_GUIDE_USER_ID: string
  deploymentType: 'SAAS' | 'ON_PREM' | 'COMMUNITY'
  resourceBasePath: string
  refinerProjectToken: string
  refinerFeedbackToken: string
  saberToken: string
  Saber: any
  hj: any
  helpPanelAccessToken: string
  helpPanelSpace: string
  helpPanelEnvironment: 'QA' | 'master'
  stripeApiKey: string
}

declare interface WindowEventMap {
  PROMISE_API_RESPONSE: CustomEvent
  USE_CACHE_UPDATED: CustomEvent
}

declare interface Document {
  msHidden: string
  webkitHidden: string
}

declare const monaco: any

declare module 'event-source-polyfill'

declare module 'refiner-js'

declare module 'gitopsui/MicroFrontendApp' {
  import type { ChildAppComponent } from './microfrontends'
  const ChildApp: ChildAppComponent
  export default ChildApp
}

declare module 'chaos/MicroFrontendApp' {
  import type { ChildAppComponent } from './microfrontends'
  const ChildApp: ChildAppComponent
  export default ChildApp
}

declare module 'errortracking/App' {
  const ChildApp: ChildAppComponent
  export default ChildApp
}

declare module 'sto/App' {
  const ChildApp: ChildAppComponent
  export default ChildApp
}
declare module 'ccmui/MicroFrontendApp' {
  const ChildApp: ChildAppComponent
  export default ChildApp
}

declare module 'sto/PipelineSecurityView' {
  import type { PipelineSecurityViewProps } from '@pipeline/interfaces/STOApp'
  const ChildApp: React.ComponentType<PipelineSecurityViewProps>
  export default ChildApp
}

declare type Optional<T, K extends keyof T = keyof T> = Omit<T, K> & Partial<Pick<T, K>>
