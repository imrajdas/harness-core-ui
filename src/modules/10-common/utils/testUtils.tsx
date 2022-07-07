/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { UseGetProps, UseGetReturn, RestfulProvider } from 'restful-react'
import { queryByAttribute } from '@testing-library/react'
import { compile } from 'path-to-regexp'
import { createMemoryHistory } from 'history'
import { Router, Route, Switch, useLocation, useHistory } from 'react-router-dom'
import { ModalProvider } from '@harness/use-modal'
import qs from 'qs'
import { noop } from 'lodash-es'
import { enableMapSet } from 'immer'
import { AppStoreContext, AppStoreContextProps } from 'framework/AppStore/AppStoreContext'
import { LicenseStoreContext, LicenseStoreContextProps } from 'framework/LicenseStore/LicenseStoreContext'
import { LICENSE_STATE_VALUES } from 'framework/LicenseStore/licenseStoreUtil'
import { withAccountId, accountPathProps } from '@common/utils/routeUtils'
import type { Project } from 'services/cd-ng'
import { StringsContext } from 'framework/strings'

import { FeaturesContext, FeaturesContextProps } from 'framework/featureStore/FeaturesContext'
import type { FeatureDetail, FeatureMetaData } from 'framework/featureStore/featureStoreUtil'
import type { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import './testUtils.scss'
import { PermissionsContext, PermissionsContextProps } from 'framework/rbac/PermissionsContext'
import { Editions } from '@common/constants/SubscriptionTypes'
import type { FeatureFlag } from '@common/featureFlags'
import { PreferenceStoreContext } from 'framework/PreferenceStore/PreferenceStoreContext'
import {
  TemplateSelectorContext,
  TemplatesSelectorContextInterface
} from 'framework/Templates/TemplateSelectorContext/TemplateSelectorContext'

export type UseGetMockData<TData, TError = undefined, TQueryParams = undefined, TPathParams = undefined> = Required<
  UseGetProps<TData, TError, TQueryParams, TPathParams>
>['mock']

export interface UseGetMockDataWithMutateAndRefetch<T> extends UseGetMockData<T> {
  mutate: () => Record<string, unknown>
  refetch: () => Record<string, unknown>
  cancel?: () => Record<string, unknown>
}

export interface UseMutateMockData<TData, TRequestBody = unknown> {
  loading?: boolean
  mutate?: (data?: TRequestBody) => Promise<TData>
}

export type UseGetReturnData<TData, TError = undefined, TQueryParams = undefined, TPathParams = undefined> = Omit<
  UseGetReturn<TData, TError, TQueryParams, TPathParams>,
  'absolutePath' | 'cancel' | 'response'
>

export const findDialogContainer = (): HTMLElement | null => document.querySelector('.bp3-dialog')
export const findPopoverContainer = (): HTMLElement | null => document.querySelector('.bp3-popover-content')

export interface TestWrapperProps {
  path?: string
  pathParams?: Record<string, string | number>
  queryParams?: Record<string, unknown>
  defaultAppStoreValues?: Partial<AppStoreContextProps>
  defaultLicenseStoreValues?: Partial<LicenseStoreContextProps>
  defaultPermissionValues?: Partial<PermissionsContextProps>
  defaultTemplateSelectorValues?: Partial<TemplatesSelectorContextInterface>
  defaultFeaturesValues?: Partial<FeaturesContextProps>
  defaultFeatureFlagValues?: Partial<Record<FeatureFlag, boolean>>
  projects?: Project[]
  enableBrowserView?: boolean
  stringsData?: Record<string, string>
  getString?(key: string): string
}

export const prependAccountPath = (path: string): string => withAccountId(() => path)(accountPathProps)

export const CurrentLocation = (): JSX.Element => {
  const location = useLocation()
  return (
    <div>
      <h1>Not Found</h1>
      <div data-testid="location">{`${location.pathname}${
        location.search ? `?${location.search.replace(/^\?/g, '')}` : ''
      }`}</div>
    </div>
  )
}

export interface BrowserViewProps {
  enable?: boolean
  children: React.ReactNode
}

export function BrowserView(props: BrowserViewProps): React.ReactElement {
  const { enable, children } = props
  const location = useLocation()
  const history = useHistory()

  if (!enable) {
    return <>{children}</>
  }

  function handlePathChange(e: React.ChangeEvent<HTMLInputElement>): void {
    history.replace(e.currentTarget.value)
  }

  const search = location.search ? `?${location.search.replace(/^\?/, '')}` : ''

  return (
    <div className="browser">
      <div className="browser-header">
        <input className="browser-path" value={location.pathname + search} onChange={handlePathChange} />
      </div>
      <div className="browser-content">{children}</div>
    </div>
  )
}

export const TestWrapper: React.FC<TestWrapperProps> = props => {
  enableMapSet()
  const {
    path = '/',
    pathParams = {},
    defaultAppStoreValues,
    queryParams = {},
    defaultLicenseStoreValues,
    defaultPermissionValues,
    defaultTemplateSelectorValues,
    defaultFeaturesValues,
    defaultFeatureFlagValues = {},
    stringsData = {},
    getString = (key: string) => key
  } = props

  const search = qs.stringify(queryParams, { addQueryPrefix: true })
  const routePath = compile(path)(pathParams) + search

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const history = React.useMemo(() => createMemoryHistory({ initialEntries: [routePath] }), [])

  const defaultReturn = {
    enabled: true
  }

  /** TODO: Try fixing this later. This is causing some tests to fail */
  // React.useEffect(() => {
  //   history.replace(compile(path)(pathParams) + qs.stringify(queryParams, { addQueryPrefix: true }))
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [path, pathParams, queryParams])

  return (
    <Router history={history}>
      <StringsContext.Provider value={{ data: stringsData as any, getString }}>
        <PreferenceStoreContext.Provider
          value={{
            set: noop,
            get: noop,
            clear: noop
          }}
        >
          <AppStoreContext.Provider
            value={{
              featureFlags: {
                FEATURE_ENFORCEMENT_ENABLED: true,
                ...defaultFeatureFlagValues
              },
              updateAppStore: () => void 0,
              currentUserInfo: { uuid: '' },
              ...defaultAppStoreValues
            }}
          >
            <LicenseStoreContext.Provider
              value={{
                versionMap: {},
                licenseInformation: {},
                CI_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
                FF_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
                CCM_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
                CD_LICENSE_STATE: LICENSE_STATE_VALUES.ACTIVE,
                updateLicenseStore: () => void 0,
                ...defaultLicenseStoreValues
              }}
            >
              <PermissionsContext.Provider
                value={{
                  permissions: new Map<string, boolean>(),
                  requestPermission: () => void 0,
                  checkPermission: () => true,
                  cancelRequest: () => void 0,
                  ...defaultPermissionValues
                }}
              >
                <FeaturesContext.Provider
                  value={{
                    features: new Map<FeatureIdentifier, FeatureDetail>(),
                    featureMap: new Map<FeatureIdentifier, FeatureMetaData>(),
                    getEdition: () => {
                      return undefined
                    },
                    requestFeatures: () => void 0,
                    requestLimitFeature: () => void 0,
                    checkFeature: () => {
                      return defaultReturn
                    },
                    checkLimitFeature: () => {
                      return defaultReturn
                    },
                    getRestrictionType: () => {
                      return undefined
                    },
                    getHighestEdition: () => {
                      return Editions.FREE
                    },
                    ...defaultFeaturesValues
                  }}
                >
                  <ModalProvider>
                    <TemplateSelectorContext.Provider
                      value={{
                        state: {
                          isDrawerOpened: false,
                          selectorData: {
                            templateType: 'Step',
                            onSubmit: jest.fn(),
                            onCancel: jest.fn()
                          }
                        },
                        openTemplateSelector: jest.fn(),
                        closeTemplateSelector: jest.fn(),
                        ...defaultTemplateSelectorValues
                      }}
                    >
                      <RestfulProvider base="/">
                        <BrowserView enable={props.enableBrowserView}>
                          <Switch>
                            <Route exact path={path}>
                              {props.children}
                            </Route>
                            <Route>
                              <CurrentLocation />
                            </Route>
                          </Switch>
                        </BrowserView>
                      </RestfulProvider>
                    </TemplateSelectorContext.Provider>
                  </ModalProvider>
                </FeaturesContext.Provider>
              </PermissionsContext.Provider>
            </LicenseStoreContext.Provider>
          </AppStoreContext.Provider>
        </PreferenceStoreContext.Provider>
      </StringsContext.Provider>
    </Router>
  )
}

export const queryByNameAttribute = (name: string, container: HTMLElement): HTMLElement | null =>
  queryByAttribute('name', container, name)
