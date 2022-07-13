/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams } from 'react-router-dom'
import moment from 'moment'
import { Card, Container, Layout } from '@wings-software/uicore'
import { Page } from '@common/exports'
import { ActiveServiceInstances } from '@cd/components/ServiceDetails/ActiveServiceInstances/ActiveServiceInstances'
import { ActiveServiceInstancesV2 } from '@cd/components/ServiceDetails/ActiveServiceInstances/ActiveServiceInstancesV2'
import {
  startOfDay,
  TimeRangeSelector,
  TimeRangeSelectorProps
} from '@common/components/TimeRangeSelector/TimeRangeSelector'
import { useStrings } from 'framework/strings'
import { DeploymentsTimeRangeContext } from '@cd/components/Services/common'
import { DeploymentsWidget } from '@cd/components/Services/DeploymentsWidget/DeploymentsWidget'
import type { ServicePathProps } from '@common/interfaces/RouteInterfaces'
import { InstanceCountHistory } from '@cd/components/ServiceDetails/InstanceCountHistory/InstanceCountHistory'
import { PipelineExecutions } from '@cd/components/ServiceDetails/PipelineExecutions/PipelineExecutions'
import { useLocalStorage } from '@common/hooks/useLocalStorage'
import { validTimeFormat } from '@cd/pages/dashboard/CDDashboardPage'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import css from '@cd/components/ServiceDetails/ServiceDetailsContent/ServicesDetailsContent.module.scss'

const ServiceDetailsSummary: React.FC = () => {
  const { serviceId } = useParams<ServicePathProps>()
  const { getString } = useStrings()

  const [serviceTimeRange, setServiceTimeRange] = useLocalStorage<TimeRangeSelectorProps>(
    'timeRangeServiceDetails',
    {
      range: [startOfDay(moment().subtract(1, 'month').add(1, 'day')), startOfDay(moment())],
      label: getString('common.duration.month')
    },
    window.sessionStorage
  )

  const timeServiceDetail = validTimeFormat(serviceTimeRange)
  serviceTimeRange.range[0] = timeServiceDetail.range[0]
  serviceTimeRange.range[1] = timeServiceDetail.range[1]
  return (
    <Page.Body>
      <Container flex className={css.timeRangeContainer}>
        <TimeRangeSelector timeRange={serviceTimeRange?.range} setTimeRange={setServiceTimeRange} />
      </Container>
      <Layout.Horizontal margin={{ top: 'large', bottom: 'large' }}>
        <DeploymentsTimeRangeContext.Provider
          value={{ timeRange: serviceTimeRange, setTimeRange: setServiceTimeRange }}
        >
          <Layout.Vertical margin={{ right: 'xlarge' }}>
            <Layout.Horizontal margin={{ bottom: 'medium' }}>
              {useFeatureFlag(FeatureFlag.SERVICE_DASHBOARD_V2) ? (
                <ActiveServiceInstancesV2 />
              ) : (
                <ActiveServiceInstances />
              )}
            </Layout.Horizontal>
            <InstanceCountHistory />
          </Layout.Vertical>
          <Layout.Vertical className={css.fullWidth}>
            <Card className={css.card}>
              <DeploymentsWidget serviceIdentifier={serviceId} />
            </Card>
            <PipelineExecutions />
          </Layout.Vertical>
        </DeploymentsTimeRangeContext.Provider>
      </Layout.Horizontal>
    </Page.Body>
  )
}

export default ServiceDetailsSummary
