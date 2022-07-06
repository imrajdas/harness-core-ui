/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the royot of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Page, Tab, Tabs, Text } from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import { useStrings } from 'framework/strings'

import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import K8sClustersTab from '@ce/components/CloudIntegrationTabs/K8sClustersTab'
import CloudAccountsTab from '@ce/components/CloudIntegrationTabs/CloudAccountsTab'

import css from './CloudIntegrationPage.module.scss'

const CloudIntegrationPage: React.FC = () => {
  const { getString } = useStrings()

  return (
    <>
      <Page.Header title={getString('ce.cloudIntegration.sideNavText')} breadcrumbs={<NGBreadcrumbs />} />
      <Page.Body>
        <div className={css.tabs}>
          <Tabs id={'cloudIntegrationTabs'} renderAllTabPanels>
            <Tab
              id={'k8sClustersTab'}
              panel={<K8sClustersTab />}
              title={
                <Text
                  icon="app-kubernetes"
                  iconProps={{ padding: { right: 'small' } }}
                  font={{ variation: FontVariation.H6 }}
                >
                  {getString('ce.cloudIntegration.k8sClusters')}
                </Text>
              }
            />
            <Tab
              id={'cloudAccountsTab'}
              panel={<CloudAccountsTab />}
              title={
                <Text
                  icon="cloud-accounts"
                  iconProps={{ padding: { right: 'small' } }}
                  font={{ variation: FontVariation.H6 }}
                >
                  {getString('ce.cloudIntegration.cloudAccounts')}
                </Text>
              }
            />
          </Tabs>
        </div>
      </Page.Body>
    </>
  )
}

export default CloudIntegrationPage
