/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { defaultTo } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { TimePeriodEnum } from '@cv/pages/monitored-service/components/ServiceHealth/ServiceHealth.constants'
import HealthScoreChart from '@cv/pages/monitored-service/components/ServiceHealth/components/HealthScoreChart/HealthScoreChart'
import { TimelineBar } from '@cv/components/TimelineView/TimelineBar'
import ServiceDependenciesLegend from '@cv/components/ServiceDependenciesLegend/ServiceDependenciesLegend'
import { getColorForChangeEventType } from '@cv/components/ChangeTimeline/ChangeTimeline.utils'
import VerificationStatusCard from '@cv/components/ExecutionVerification/components/DeploymentProgressAndNodes/components/VerificationStatusCard/VerificationStatusCard'
import type { VerifyStepSummary } from 'services/cv'
import type { ChangeEventServiceHealthProps } from './ChangeEventServiceHealth.types'
import { TWO_HOURS_IN_MILLISECONDS, COLUMN_CHART_PROPS } from './ChangeEventServiceHealth.constants'
import css from './ChangeEventServiceHealth.module.scss'

export default function ChangeEventServiceHealth(props: ChangeEventServiceHealthProps): JSX.Element {
  const {
    monitoredServiceIdentifier,
    startTime: propsStartTime,
    eventType,
    timeStamps,
    setTimestamps,
    title,
    verifyStepSummaries
  } = props
  const { getString } = useStrings()
  return (
    <Container className={css.main}>
      <Text className={css.status}>{defaultTo(title, getString('status'))}</Text>
      <Text className={css.healthTrend}>{getString('cv.serviceHealthTrend')}</Text>
      <Layout.Horizontal margin={{ top: 'medium', bottom: 'medium' }}>
        {verifyStepSummaries?.map(item => {
          return (
            <Container className={css.flexRow} key={item.name}>
              <Layout.Horizontal spacing="large">
                <Text font={{ size: 'small', weight: 'semi-bold' }} color={Color.BLACK_100}>
                  {'Verification:'}
                </Text>
                <VerificationStatusCard status={item.verificationStatus as VerifyStepSummary['verificationStatus']} />
              </Layout.Horizontal>
            </Container>
          )
        })}
        {<ServiceDependenciesLegend hideServiceTypeLegend />}
      </Layout.Horizontal>
      <HealthScoreChart
        hasTimelineIntegration={false}
        monitoredServiceIdentifier={monitoredServiceIdentifier}
        duration={{ value: TimePeriodEnum.FOUR_HOURS, label: getString('cv.monitoredServices.serviceHealth.last4Hrs') }}
        columChartProps={{
          ...COLUMN_CHART_PROPS,
          timestampMarker: {
            timestamp: propsStartTime,
            color: getColorForChangeEventType(eventType)
          }
        }}
        endTime={propsStartTime + TWO_HOURS_IN_MILLISECONDS}
        setHealthScoreData={riskData => {
          if (!riskData?.length) {
            return
          }
          const newStartTime = riskData[0].startTime
          const newEndTime = riskData[riskData.length - 2].endTime
          if (!newStartTime || !newEndTime) {
            return
          }
          setTimestamps([newStartTime, newEndTime])
        }}
        isChangeEventView
      />
      <TimelineBar startDate={timeStamps[0]} endDate={timeStamps[1]} columnWidth={50} className={css.timestamps} />
    </Container>
  )
}
