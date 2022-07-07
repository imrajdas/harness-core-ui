/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Route as RouterRoute } from 'react-router-dom'
import type { RouteProps as RouterRouteprops } from 'react-router-dom'

import { ModalProvider } from '@harness/use-modal'
import { DefaultLayout } from '@common/layouts'
import SidebarProvider, { SidebarContext } from '@common/navigation/SidebarProvider'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { LICENSE_STATE_VALUES } from 'framework/LicenseStore/licenseStoreUtil'
import type { LicenseRedirectProps } from 'framework/LicenseStore/LicenseStoreContext'
import type { PAGE_NAME } from '@common/pages/pageContext/PageName'
import PageProvider from '@common/pages/pageContext/PageProvider'
import { TemplateSelectorContextProvider } from 'framework/Templates/TemplateSelectorContext/TemplateSelectorContext'
import { TemplateSelectorDrawer } from 'framework/Templates/TemplateSelectorDrawer/TemplateSelectorDrawer'

export interface RouteWithLayoutProps extends RouterRouteprops {
  layout: React.ComponentType
  sidebarProps?: SidebarContext
  licenseRedirectData?: LicenseRedirectProps
  pageName?: PAGE_NAME
}

export function RouteWithLayout(props: React.PropsWithChildren<RouteWithLayoutProps>): React.ReactElement {
  const { children, layout: Layout, sidebarProps, licenseRedirectData, pageName, ...rest } = props
  const licenseStore = useLicenseStore()

  const childComponent = (
    <RouterRoute {...rest}>
      <ModalProvider>
        <TemplateSelectorContextProvider>
          <PageProvider pageName={pageName}>
            {sidebarProps ? (
              <SidebarProvider {...sidebarProps}>
                <Layout>{children}</Layout>
              </SidebarProvider>
            ) : (
              <Layout>{children}</Layout>
            )}
          </PageProvider>
          <TemplateSelectorDrawer />
        </TemplateSelectorContextProvider>
      </ModalProvider>
    </RouterRoute>
  )

  // For modules with no licenseStateName passed we will always show the child components
  // This allows pages to still render for products like CD and CE which have not gone GA and are still
  // using old licensing mechanisms
  if (!licenseRedirectData) {
    return childComponent
  }

  const {
    licenseStateName,
    startTrialRedirect: StartTrialRedirect
    // expiredTrialRedirect: ExpiredTrialRedirect
  } = licenseRedirectData

  const licenseValue = licenseStateName && licenseStore[licenseStateName]

  switch (licenseValue) {
    case LICENSE_STATE_VALUES.ACTIVE:
      return childComponent
    case LICENSE_STATE_VALUES.NOT_STARTED:
      return (
        <RouterRoute {...rest}>
          <StartTrialRedirect />
        </RouterRoute>
      )
    // case LICENSE_STATE_VALUES.EXPIRED:
    //   return (
    //     <RouterRoute {...rest}>
    //       <ExpiredTrialRedirect />
    //     </RouterRoute>
    //   )
    default:
      return childComponent
  }
}

RouteWithLayout.defaultProps = {
  layout: DefaultLayout
}
