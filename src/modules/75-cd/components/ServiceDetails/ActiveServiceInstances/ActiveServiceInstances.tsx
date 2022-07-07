/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Layout, Tab, Tabs, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useStrings } from 'framework/strings'
import { ActiveServiceInstancesHeader } from '@cd/components/ServiceDetails/ActiveServiceInstances/ActiveServiceInstancesHeader'
import {
  GetEnvArtifactDetailsByServiceIdQueryParams,
  GetEnvBuildInstanceCountQueryParams,
  useGetEnvArtifactDetailsByServiceId,
  useGetEnvBuildInstanceCount
} from 'services/cd-ng'
import type { ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import { ActiveServiceInstancesContent } from '@cd/components/ServiceDetails/ActiveServiceInstances/ActiveServiceInstancesContent'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import { Deployments } from '../DeploymentView/DeploymentView'
import InstancesDetailsDialog from './InstancesDetails/InstancesDetailsDialog'
import css from '@cd/components/ServiceDetails/ActiveServiceInstances/ActiveServiceInstances.module.scss'

export enum ServiceDetailTabs {
  ACTIVE = 'Active Service Instances',
  DEPLOYMENT = 'Deployments'
}

export const ActiveServiceInstances: React.FC = () => {
  const { getString } = useStrings()
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState<boolean>(false)
  const isServiceDashboardV2Enabled = useFeatureFlag(FeatureFlag.SERVICE_DASHBOARD_V2)

  const { accountId, orgIdentifier, projectIdentifier, serviceId } = useParams<ProjectPathProps & ServicePathProps>()
  const queryParams: GetEnvBuildInstanceCountQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId
  }

  const {
    loading: activeInstanceLoading,
    data: activeInstanceData,
    error: activeInstanceError,
    refetch: activeInstanceRefetch
  } = useGetEnvBuildInstanceCount({ queryParams })

  const queryParamsDeployments: GetEnvArtifactDetailsByServiceIdQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId
  }

  const { data: deploymentData } = useGetEnvArtifactDetailsByServiceId({
    queryParams: queryParamsDeployments
  })

  const isDeploymentTab = (): boolean => {
    return Boolean(
      activeInstanceData &&
        deploymentData &&
        !(activeInstanceData?.data?.envBuildIdAndInstanceCountInfoList || []).length &&
        (deploymentData?.data?.environmentInfoByServiceId || []).length
    )
  }

  const [defaultTab, setDefaultTab] = useState(ServiceDetailTabs.ACTIVE)

  useEffect(() => {
    if (isDeploymentTab()) {
      setDefaultTab(ServiceDetailTabs.DEPLOYMENT)
    } else {
      setDefaultTab(ServiceDetailTabs.ACTIVE)
    }
  }, [deploymentData, activeInstanceData])

  const handleTabChange = (data: string): void => {
    setDefaultTab(data as ServiceDetailTabs)
  }

  const moreDetails = (
    <>
      <Text
        className={css.moreDetails}
        font={{ size: 'small', weight: 'semi-bold' }}
        color={Color.PRIMARY_7}
        onClick={() => setIsDetailsDialogOpen(true)}
      >
        {getString('cd.serviceDashboard.moreDetails')}
      </Text>
      <InstancesDetailsDialog
        data={activeInstanceData?.data?.envBuildIdAndInstanceCountInfoList}
        isOpen={isDetailsDialogOpen}
        setIsOpen={setIsDetailsDialogOpen}
      />
    </>
  )

  return (
    <Card className={css.activeServiceInstances}>
      <Layout.Vertical className={css.tabsStyle}>
        <Tabs id="ServiceDetailTabs" selectedTabId={defaultTab} onChange={handleTabChange}>
          <Tab
            id={ServiceDetailTabs.ACTIVE}
            title={getString('cd.serviceDashboard.activeServiceInstancesLabel')}
            panel={
              <>
                <ActiveServiceInstancesHeader />
                {isServiceDashboardV2Enabled && moreDetails}
                <ActiveServiceInstancesContent
                  loading={activeInstanceLoading}
                  data={activeInstanceData?.data?.envBuildIdAndInstanceCountInfoList}
                  error={activeInstanceError}
                  refetch={activeInstanceRefetch}
                />
              </>
            }
          />
          <Tab id={ServiceDetailTabs.DEPLOYMENT} title={getString('deploymentsText')} panel={<Deployments />} />
        </Tabs>
      </Layout.Vertical>
    </Card>
  )
}
