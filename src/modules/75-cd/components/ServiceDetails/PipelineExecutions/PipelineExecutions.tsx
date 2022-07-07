/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useContext, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Container, ExpandingSearchInput, Layout, Text, PageError, NoDataCard } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useGetDeploymentsByServiceId, GetDeploymentsByServiceIdQueryParams } from 'services/cd-ng'
import type { ProjectPathProps, ServicePathProps } from '@common/interfaces/RouteInterfaces'
import ExecutionCard from '@pipeline/components/ExecutionCard/ExecutionCard'
import { CardVariant } from '@pipeline/utils/constants'
import { executionStatusInfoToExecutionSummary } from '@cd/pages/dashboard/CDDashboardPage'
import { DeploymentsTimeRangeContext } from '@cd/components/Services/common'
import { useStrings } from 'framework/strings'
import { PageSpinner } from '@common/components'
import pipelineIllustration from '@pipeline/pages/pipelines/images/deploypipeline-illustration.svg'
import css from '@cd/components/ServiceDetails/PipelineExecutions/PipelineExecutions.module.scss'

export const PipelineExecutions: React.FC = () => {
  const { getString } = useStrings()
  const { timeRange } = useContext(DeploymentsTimeRangeContext)

  const { accountId, orgIdentifier, projectIdentifier, serviceId } = useParams<ProjectPathProps & ServicePathProps>()
  const queryParams: GetDeploymentsByServiceIdQueryParams = {
    accountIdentifier: accountId,
    orgIdentifier,
    projectIdentifier,
    serviceId,
    startTime: timeRange?.range[0]?.getTime() || 0,
    endTime: timeRange?.range[1]?.getTime() || 0
  }
  const { loading, data, error, refetch } = useGetDeploymentsByServiceId({ queryParams })
  const [searchTerm, setSearchTerm] = useState('')
  const deployments = data?.data?.deployments || []
  const filteredDeployments = useMemo(() => {
    if (!searchTerm) {
      return deployments
    }
    return deployments.filter(
      deployment =>
        (deployment.pipelineIdentifier || '').toLocaleLowerCase().indexOf(searchTerm.toLocaleLowerCase()) !== -1 ||
        (deployment.pipelineName || '').toLocaleLowerCase().indexOf(searchTerm.toLocaleLowerCase()) !== -1 ||
        (deployment.author?.name || '').toLocaleLowerCase().indexOf(searchTerm.toLocaleLowerCase()) !== -1
    )
  }, [searchTerm, deployments])

  const onSearch = useCallback((val: string) => {
    setSearchTerm(val.trim())
  }, [])

  const getComponent = (): React.ReactElement => {
    if (loading) {
      return <PageSpinner />
    }
    if (error) {
      return <PageError onClick={() => refetch()} />
    }
    if (!filteredDeployments.length) {
      return (
        <Card className={css.pipelineExecutionsEmptyStateContainer}>
          <NoDataCard
            image={pipelineIllustration}
            imageClassName={css.pipelineExecutionsEmptyStateImage}
            message={getString('cd.serviceDashboard.noPipelines', {
              timeRange: timeRange?.label
            })}
            containerClassName={css.dataCard}
          />
        </Card>
      )
    }
    return (
      <>
        {filteredDeployments.map(d => (
          <ExecutionCard
            variant={CardVariant.Minimal}
            key={d.planExecutionId}
            pipelineExecution={executionStatusInfoToExecutionSummary(d)}
          />
        ))}
      </>
    )
  }

  return (
    <Container padding={{ top: 'medium' }} height="100%">
      <Layout.Vertical height="100%">
        <Layout.Horizontal padding={{ top: 'medium' }} flex={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Text font={{ weight: 'bold' }} color={Color.GREY_600}>
            {`${getString('cd.serviceDashboard.totalDeployments')}: ${deployments.length}`}
          </Text>
          <ExpandingSearchInput
            placeholder={getString('search')}
            throttle={200}
            onChange={onSearch}
            className={css.searchIconStyle}
          />
        </Layout.Horizontal>
        <Container className={css.executionCardContainer}>{getComponent()}</Container>
      </Layout.Vertical>
    </Container>
  )
}
