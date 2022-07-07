/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { find } from 'lodash-es'
import { Classes } from '@blueprintjs/core'
import {
  Button,
  ButtonSize,
  ButtonVariation,
  Color,
  Container,
  FontVariation,
  Layout,
  NoDataCard,
  PillToggle,
  PillToggleProps,
  Text
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { MonitoredServiceChangeDetailSLO, useGetMonitoredServiceChangeDetails } from 'services/cv'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getErrorMessage } from '@cv/utils/CommonUtils'
import SLOTargetChartWrapper from './SLOTargetChartWrapper'
import { SLOAndErrorBudgetProps, SLOCardToggleViews } from './SLOAndErrorBudget.types'
import css from './SLOAndErrorBudget.module.scss'

const SLOAndErrorBudget: React.FC<SLOAndErrorBudgetProps> = ({
  monitoredServiceIdentifier,
  startTime,
  endTime,
  eventTime,
  eventType
}) => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const [view, setView] = useState(SLOCardToggleViews.SLO)
  const [selectedSLOs, setSelectedSLOs] = useState<MonitoredServiceChangeDetailSLO[]>([])

  const { data, loading, error } = useGetMonitoredServiceChangeDetails({
    monitoredServiceIdentifier,
    queryParams: {
      accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const toggleProps: PillToggleProps<SLOCardToggleViews> = {
    options: [
      {
        label: getString('cv.SLO'),
        value: SLOCardToggleViews.SLO
      },
      {
        label: getString('cv.errorBudget'),
        value: SLOCardToggleViews.ERROR_BUDGET
      }
    ],
    onChange: setView,
    selectedView: view,
    className: css.pillToggle
  }

  const handleCardSelectChange = (serviceLevelObjective: MonitoredServiceChangeDetailSLO): void => {
    setSelectedSLOs(prevSelectedSLOs => {
      if (find(prevSelectedSLOs, serviceLevelObjective)) {
        return prevSelectedSLOs.filter(item => item.identifier !== serviceLevelObjective.identifier)
      } else {
        return [...prevSelectedSLOs, serviceLevelObjective].slice(-3)
      }
    })
  }

  useEffect(() => {
    if (data?.resource?.length) {
      setSelectedSLOs(data.resource.slice(0, 3))
    }
  }, [data?.resource])

  if (data?.resource?.length === 0) {
    return (
      <Container margin={{ top: 'small' }} padding="small" className={css.noSlo}>
        <Text font={{ variation: FontVariation.SMALL }} color={Color.GREY_600}>
          {getString('cv.noSLOHasBeenCreated')}
        </Text>
      </Container>
    )
  }

  return (
    <Container margin={{ top: 'small' }}>
      <Container flex={{ justifyContent: 'center' }} padding={{ top: 'medium', bottom: 'medium' }}>
        <PillToggle {...toggleProps} />
      </Container>
      <Layout.Horizontal
        spacing="small"
        padding={{ bottom: 'small' }}
        flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
      >
        <Text font={{ variation: FontVariation.TINY_SEMI }} color={Color.BLACK}>
          {getString('cv.SLO')}:
        </Text>
        {loading && (
          <Layout.Horizontal spacing="small">
            <Container height={24} width={100} className={Classes.SKELETON} />
            <Container height={24} width={100} className={Classes.SKELETON} />
            <Container height={24} width={100} className={Classes.SKELETON} />
            <Container height={24} width={100} className={Classes.SKELETON} />
          </Layout.Horizontal>
        )}
        {!loading && error && (
          <Text color={Color.RED_500} font={{ variation: FontVariation.TINY_SEMI }} lineClamp={1}>
            {getErrorMessage(error)}
          </Text>
        )}
        {!loading && !error && (
          <Layout.Horizontal spacing="small">
            {data?.resource?.map(item => (
              <Button
                key={item.identifier}
                text={item.name}
                size={ButtonSize.SMALL}
                onClick={() => handleCardSelectChange(item)}
                disabled={selectedSLOs.length === 3 && !find(selectedSLOs, item)}
                variation={find(selectedSLOs, item) ? ButtonVariation.SECONDARY : ButtonVariation.TERTIARY}
              />
            ))}
          </Layout.Horizontal>
        )}
      </Layout.Horizontal>
      <Text
        icon="info"
        color={Color.GREY_600}
        padding={{ bottom: 'xlarge' }}
        font={{ variation: FontVariation.SMALL }}
        iconProps={{ size: 12, color: Color.PRIMARY_7 }}
      >
        {getString('cv.aMaximumOfThreeSLOCanBeComparedWithTheServiceHealth')}
      </Text>
      <Layout.Vertical spacing="large">
        {selectedSLOs.map(serviceLevelObjective => (
          <SLOTargetChartWrapper
            key={serviceLevelObjective.identifier}
            type={view}
            startTime={startTime}
            endTime={endTime}
            selectedSLO={serviceLevelObjective}
            eventTime={eventTime}
            eventType={eventType}
          />
        ))}
      </Layout.Vertical>
      {!selectedSLOs.length && (
        <Container height={250}>
          <NoDataCard
            message={
              <Text color={Color.GREY_600} font={{ variation: FontVariation.SMALL }}>
                {getString('cv.pleaseSelectSLOToGetTheData')}
              </Text>
            }
            containerClassName={css.noDataContainer}
          />
        </Container>
      )}
    </Container>
  )
}

export default SLOAndErrorBudget
