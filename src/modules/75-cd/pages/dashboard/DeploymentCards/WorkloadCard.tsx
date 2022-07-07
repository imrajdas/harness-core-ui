/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import type { WorkloadDateCountInfo, LastWorkloadInfo } from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import ServiceCardWithChart from './CardWithChart'
import css from '../CDDashboardPage.module.scss'
export interface WorkloadCardProps {
  serviceName: string
  lastExecuted?: LastWorkloadInfo
  lastMessage?: string
  totalDeployments: number
  percentSuccess: number
  rateSuccess: number
  username?: string
  workload?: WorkloadDateCountInfo[]
  serviceId?: string
}

export default function WorkloadCard({
  serviceName,
  lastExecuted,
  totalDeployments,
  percentSuccess,
  rateSuccess,
  workload,
  serviceId = ''
}: WorkloadCardProps): React.ReactElement {
  const history = useHistory()

  const { accountId, orgIdentifier, projectIdentifier, module } = useParams<ProjectPathProps & ModulePathParams>()
  const countList = useMemo(() => {
    if (workload) {
      return workload.map(val => ({
        time: val.date,
        builds: {
          count: val?.execution?.count
        }
      }))
    }
  }, [workload])
  const gotoServices = (): void => {
    history.push(routes.toServiceStudio({ accountId, orgIdentifier, projectIdentifier, serviceId, module }))
  }
  return (
    <ServiceCardWithChart
      title={serviceName}
      message={lastExecuted?.triggerType}
      profileUrl={lastExecuted?.authorInfo?.url}
      username={lastExecuted?.authorInfo?.name}
      startTime={lastExecuted?.startTime as number}
      endTime={lastExecuted?.endTime as number}
      count={totalDeployments}
      countLabel="Deployments"
      seriesName="Executions"
      successRate={percentSuccess}
      successRateDiff={rateSuccess}
      countList={countList}
      onClick={gotoServices}
      className={css.hoverService}
      lastExecutionStatus={lastExecuted?.status}
    />
  )
}
