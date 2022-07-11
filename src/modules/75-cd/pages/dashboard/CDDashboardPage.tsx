/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Dialog, PageHeader, PageSpinner } from '@wings-software/uicore'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo, get } from 'lodash-es'
import moment from 'moment'
import { useModalHook } from '@harness/use-modal'
import type { IDialogProps } from '@blueprintjs/core'
import routes from '@common/RouteDefinitions'
import { Page } from '@common/exports'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import CardRailView from '@pipeline/components/Dashboards/CardRailView/CardRailView'
import { useGetWorkloads, useGetDeployments, CDPipelineModuleInfo, ExecutionStatusInfo } from 'services/cd-ng'
import type { CIBuildCommit, CIWebhookInfoDTO } from 'services/ci'
import { PipelineExecutionSummary, useGetListOfExecutions } from 'services/pipeline-ng'
import {
  ActiveStatus,
  FailedStatus,
  mapToExecutionStatus,
  useErrorHandler,
  useRefetchCall
} from '@pipeline/components/Dashboards/shared'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import ExecutionCard from '@pipeline/components/ExecutionCard/ExecutionCard'
import { CardVariant } from '@pipeline/utils/constants'
import {
  startOfDay,
  TimeRangeSelector,
  TimeRangeSelectorProps
} from '@common/components/TimeRangeSelector/TimeRangeSelector'
import { DeploymentsTimeRangeContext } from '@cd/components/Services/common'
import { useLocalStorage, useMutateAsGet, useQueryParams } from '@common/hooks'
import PipelineDeploymentList, {
  processQueryParams
} from '@pipeline/pages/pipeline-deployment-list/PipelineDeploymentList'
import PipelineModalListView from '@pipeline/components/PipelineModalListView/PipelineModalListView'

import { TitleWithToolTipId } from '@common/components/Title/TitleWithToolTipId'
import type { QueryParams } from '@pipeline/pages/pipeline-deployment-list/types'
import { DashboardSelected } from '@pipeline/components/ServiceExecutionsCard/ServiceExecutionsCard'
import DeploymentsHealthCards from './DeploymentsHealthCards'
import DeploymentExecutionsChart from './DeploymentExecutionsChart'
import WorkloadCard from './DeploymentCards/WorkloadCard'
import bgImage from './images/CD-OverviewImageBG-compressed.png'
import styles from './CDDashboardPage.module.scss'

const NoDataOverviewPage = (): JSX.Element => {
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()

  const runPipelineDialogProps: IDialogProps = {
    isOpen: true,
    enforceFocus: false,
    style: { minWidth: 800, minHeight: 280, backgroundColor: 'var(--grey-50)', padding: 0 }
  }

  const [openModal, hideModal] = useModalHook(
    () => (
      <Dialog {...runPipelineDialogProps}>
        <PipelineModalListView onClose={hideModal} />
      </Dialog>
    ),
    [projectIdentifier, orgIdentifier, accountId]
  )
  return (
    <div
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        height: '100%',
        width: 'auto',
        opacity: 0.5,
        backdropFilter: 'blur(1px)',
        margin: 16
      }}
    >
      <PipelineDeploymentList onRunPipeline={openModal} isCDOverview />
    </div>
  )
}

export const validTimeFormat = (timeRange: TimeRangeSelectorProps): TimeRangeSelectorProps => {
  //convert to valid format if string
  if (typeof timeRange.range[0] === 'string') {
    timeRange.range[0] = new Date(defaultTo(timeRange.range[0], ''))
    timeRange.range[1] = new Date(defaultTo(timeRange.range[1], ''))
  }
  return timeRange
}

/** TODO: fix types after BE merge */
export function executionStatusInfoToExecutionSummary(
  info: ExecutionStatusInfo,
  caller: string
): PipelineExecutionSummary {
  const cd: CDPipelineModuleInfo = {
    serviceIdentifiers: info.serviceInfoList?.map(item =>
      item && caller === DashboardSelected.OVERVIEW ? item.serviceName : item.serviceTag
    ) as string[],
    envIdentifiers: info.environmentInfoList?.map(item => item.envName) as string[]
  }

  const branch = get(info, 'gitInfo.targetBranch')
  const commits: CIBuildCommit[] = [{ message: get(info, 'gitInfo.commit'), id: get(info, 'gitInfo.commitID') }]

  const ciExecutionInfoDTO: CIWebhookInfoDTO = {
    author: info.author,
    event: get(info, 'gitInfo.eventType'),
    branch: {
      name: get(info, 'gitInfo.sourceBranch'),
      commits
    },
    pullRequest: {
      sourceBranch: get(info, 'gitInfo.sourceBranch'),
      targetBranch: branch,
      commits
    }
  }

  return {
    startTs: info.startTs,
    endTs: typeof info.endTs === 'number' && info.endTs > 0 ? info.endTs : undefined,
    name: info.pipelineName,
    status: mapToExecutionStatus(info.status),
    planExecutionId: info.planExecutionId,
    pipelineIdentifier: info.pipelineIdentifier,
    moduleInfo: {
      cd: cd as any,
      ci: (branch ? { ciExecutionInfoDTO, branch } : undefined) as any
    },
    modules: [caller],
    executionTriggerInfo: {
      triggeredBy: {
        identifier: info.author?.name
      },
      triggerType: info.triggerType as Required<PipelineExecutionSummary>['executionTriggerInfo']['triggerType']
    }
  }
}

export const CDDashboardPage: React.FC = () => {
  const { getString } = useStrings()
  const queryParams = useQueryParams<QueryParams>({ processQueryParams })
  const { projectIdentifier, orgIdentifier, accountId } = useParams<ProjectPathProps>()

  const [timeRange, setTimeRange] = useLocalStorage<TimeRangeSelectorProps>(
    'timeRangeCDDashboard',
    {
      range: [startOfDay(moment().subtract(1, 'month').add(1, 'day')), startOfDay(moment())],
      label: getString('common.duration.month')
    },
    window.sessionStorage
  )
  const resultTimeRange = validTimeFormat(timeRange)
  timeRange.range[0] = resultTimeRange.range[0]
  timeRange.range[1] = resultTimeRange.range[1]

  const history = useHistory()

  useDocumentTitle([getString('deploymentsText'), getString('overview')])

  const startTime = defaultTo(timeRange?.range[0]?.getTime(), 0)
  const endTime = defaultTo(timeRange?.range[1]?.getTime(), 0)

  const { data, loading, error, refetch } = useGetDeployments({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      startTime: startTime,
      endTime: endTime
    }
  })

  // this for detecting whether the project have any pipelines or if pipelines then any execution or not
  const { data: pipelineExecution, loading: pipelineLoading } = useMutateAsGet(useGetListOfExecutions, {
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier
    },
    queryParamStringifyOptions: {
      arrayFormat: 'repeat'
    },
    body: {
      ...queryParams.filters,
      filterType: 'PipelineExecution'
    }
  })

  const {
    data: workloadsData,
    loading: loadingWorkloads,
    error: workloadsError
  } = useGetWorkloads({
    queryParams: {
      accountIdentifier: accountId,
      projectIdentifier,
      orgIdentifier,
      startTime: startTime,
      endTime: endTime
    }
  })

  useErrorHandler(error)
  useErrorHandler(workloadsError)

  const refetchingDeployments = useRefetchCall(refetch, loading)
  const activeDeployments = [...(data?.data?.active ?? []), ...(data?.data?.pending ?? [])]

  const pipelineExecutionSummary = pipelineExecution?.data || {}

  if (loadingWorkloads || pipelineLoading) {
    return (
      <div style={{ position: 'relative', height: 'calc(100vh - 128px)' }}>
        <PageSpinner />
      </div>
    )
  }

  return (
    <>
      <PageHeader
        title={<TitleWithToolTipId title={getString('overview')} toolTipId={'cdOverViewTitle'} />}
        breadcrumbs={<NGBreadcrumbs links={[]} />}
        toolbar={
          <>
            <TimeRangeSelector timeRange={timeRange?.range} setTimeRange={setTimeRange} minimal />
          </>
        }
      ></PageHeader>
      <Page.Body className={styles.content} loading={(loading && !refetchingDeployments) || loadingWorkloads}>
        {!pipelineExecutionSummary?.content?.length ? (
          <NoDataOverviewPage />
        ) : (
          <DeploymentsTimeRangeContext.Provider value={{ timeRange, setTimeRange }}>
            <Container className={styles.page} padding="large">
              <DeploymentsHealthCards range={timeRange} setRange={setTimeRange} title="Deployments Health" />
              <Container className={styles.executionsWrapper}>
                <DeploymentExecutionsChart
                  range={timeRange}
                  setRange={setTimeRange}
                  title={getString('executionsText')}
                />
              </Container>
              <CardRailView contentType="WORKLOAD" isLoading={loadingWorkloads}>
                {workloadsData?.data?.workloadDeploymentInfoList?.map(workload => (
                  <WorkloadCard
                    key={workload.serviceId}
                    serviceName={workload.serviceName!}
                    lastExecuted={workload?.lastExecuted}
                    totalDeployments={workload.totalDeployments!}
                    percentSuccess={workload.percentSuccess!}
                    rateSuccess={workload.rateSuccess!}
                    workload={workload.workload}
                    serviceId={workload.serviceId}
                  />
                ))}
              </CardRailView>
              <CardRailView
                contentType="FAILED_DEPLOYMENT"
                isLoading={loading && !refetchingDeployments}
                onShowAll={() =>
                  history.push(
                    routes.toDeployments({ projectIdentifier, orgIdentifier, accountId, module: 'cd' }) +
                      `?filters=${JSON.stringify({ status: Object.keys(FailedStatus) })}`
                  )
                }
              >
                {data?.data?.failure?.map(d => (
                  <ExecutionCard
                    variant={CardVariant.Minimal}
                    key={d.planExecutionId}
                    pipelineExecution={executionStatusInfoToExecutionSummary(d, DashboardSelected.OVERVIEW)}
                  />
                ))}
              </CardRailView>
              <CardRailView
                contentType="ACTIVE_DEPLOYMENT"
                isLoading={loading && !refetchingDeployments}
                onShowAll={() =>
                  history.push(
                    routes.toDeployments({ projectIdentifier, orgIdentifier, accountId, module: 'cd' }) +
                      `?filters=${JSON.stringify({ status: Object.keys(ActiveStatus) })}`
                  )
                }
              >
                {activeDeployments.map(d => (
                  <ExecutionCard
                    variant={CardVariant.Minimal}
                    key={d.planExecutionId}
                    pipelineExecution={executionStatusInfoToExecutionSummary(d, DashboardSelected.OVERVIEW)}
                  />
                ))}
              </CardRailView>
            </Container>
          </DeploymentsTimeRangeContext.Provider>
        )}
      </Page.Body>
    </>
  )
}

export default CDDashboardPage
