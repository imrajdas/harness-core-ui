/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { defaultTo } from 'lodash-es'
import { Divider } from '@blueprintjs/core'
import { Card, Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import moment from 'moment'
import type { ChangeEventDTO, HarnessCDEventMetadata } from 'services/cv'
import { useStrings } from 'framework/strings'
import ChangeEventServiceHealth from '@cv/pages/monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/components/ChangeCard/components/ChangeEventServiceHealth/ChangeEventServiceHealth'
import SLOAndErrorBudget from '@cv/pages/monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/components/ChangeCard/components/SLOAndErrorBudget/SLOAndErrorBudget'
import { useGetExecutionDetailV2 } from 'services/pipeline-ng'
import type { PipelineType, ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import { UserLabel } from '@common/exports'
import type { ChangeTitleData, ChangeDetailsDataInterface } from '../../../ChangeEventCard.types'
import { createChangeTitleData, createChangeDetailsData } from '../../../ChangeEventCard.utils'
import ChangeDetails from '../../ChangeDetails/ChangeDetails'
import DeploymentTimeDuration from '../../DeploymentTimeDuration/DeploymentTimeDuration'
import { TWO_HOURS_IN_MILLISECONDS } from '../../../ChangeEventCard.constant'
import ChangeTitleForHarness from '../../ChangeTitleForHarnessCD/ChangePipelineForHarnessCD'
import { durationAsString } from '../../DeploymentTimeDuration/DeploymentTimeDuration.utils'
import css from '../../../ChangeEventCard.module.scss'

export default function HarnessNextGenEventCard({ data }: { data: ChangeEventDTO }): JSX.Element {
  const { getString } = useStrings()
  const [timeStamps, setTimestamps] = useState<[number, number]>([0, 0])
  const changeDetailsData: ChangeDetailsDataInterface = useMemo(() => createChangeDetailsData(data), [])
  const metadata: HarnessCDEventMetadata = defaultTo(data.metadata, {})
  const { artifactType = '', artifactTag = '', verifyStepSummaries } = metadata
  const changeInfoData = { artifactType, artifactTag }
  const { orgIdentifier, projectIdentifier, accountId } = useParams<PipelineType<ExecutionPathProps>>()

  const { data: executionDetails } = useGetExecutionDetailV2({
    planExecutionId: defaultTo(metadata.planExecutionId, ''),
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      stageNodeId: metadata.stageStepId
    }
  })

  const { pipelineExecutionSummary } = defaultTo(executionDetails?.data, {})
  const { pipelineIdentifier, runSequence, status } = defaultTo(pipelineExecutionSummary, {})

  const changeTitleData: ChangeTitleData = useMemo(
    () => createChangeTitleData(data, pipelineIdentifier, runSequence, status),
    [pipelineExecutionSummary]
  )

  const timePassed = useMemo(() => {
    /* istanbul ignore else */ if (metadata.deploymentStartTime && metadata.deploymentEndTime) {
      return durationAsString(metadata.deploymentEndTime, moment().valueOf())
    }
    return ''
  }, [metadata.deploymentStartTime, metadata.deploymentEndTime])

  const { triggeredBy, triggerType } = defaultTo(pipelineExecutionSummary?.executionTriggerInfo, {})
  const { identifier, extraInfo } = defaultTo(triggeredBy, {})

  return (
    <Card className={css.main}>
      <ChangeTitleForHarness changeTitleData={changeTitleData} />
      <Container margin={{ top: 'medium', bottom: 'medium' }} height={1} background={Color.GREY_200} />

      <ChangeDetails
        ChangeDetailsData={{
          ...changeDetailsData,
          details: changeInfoData,
          executedBy: {
            shouldVisible: true,
            component: (
              <>
                <Layout.Vertical width="max-content">
                  <Layout.Horizontal
                    flex={{ justifyContent: 'flex-start', alignItems: 'center' }}
                    spacing="small"
                    margin={{ bottom: 'medium' }}
                  >
                    <UserLabel
                      name={identifier || extraInfo?.emai}
                      email={extraInfo?.email}
                      iconProps={{ size: 16 }}
                      textProps={{ font: { size: 'small', weight: 'semi-bold' }, color: Color.BLACK_100 }}
                    />
                    <Divider className={css.verticalDivider} />
                    <Text
                      font={{ size: 'small', weight: 'semi-bold' }}
                      margin={{ left: 'small', right: 'small' }}
                      color={Color.BLACK_100}
                    >
                      {triggerType}
                    </Text>

                    <Text
                      icon={'calendar'}
                      iconProps={{ size: 12 }}
                      font={{ size: 'small', weight: 'semi-bold' }}
                      color={Color.BLACK_100}
                    >
                      {timePassed}
                      {getString('cv.changeSource.changeSourceCard.ago')}
                    </Text>
                  </Layout.Horizontal>
                  <DeploymentTimeDuration
                    startTime={data.metadata.deploymentStartTime}
                    endTime={data.metadata.deploymentEndTime}
                    type={data.type}
                  />
                </Layout.Vertical>
              </>
            )
          }
        }}
      />

      <Container margin={{ top: 'medium', bottom: 'medium' }} height={1} background={Color.GREY_200} />
      {data.eventTime && data.monitoredServiceIdentifier && (
        <>
          <ChangeEventServiceHealth
            monitoredServiceIdentifier={data.monitoredServiceIdentifier}
            startTime={data.eventTime}
            eventType={data.type}
            timeStamps={timeStamps}
            setTimestamps={setTimestamps}
            title={getString('cv.changeSource.changeSourceCard.deploymentHealth')}
            verifyStepSummaries={verifyStepSummaries}
          />
          <SLOAndErrorBudget
            monitoredServiceIdentifier={data.monitoredServiceIdentifier}
            startTime={timeStamps[0] || data.eventTime}
            endTime={timeStamps[1] || data.eventTime + TWO_HOURS_IN_MILLISECONDS}
            eventTime={data.eventTime}
            eventType={data.type}
          />
        </>
      )}
    </Card>
  )
}
