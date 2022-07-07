/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useMemo, useState } from 'react'
import { Button, Card, Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { Divider, Dialog } from '@blueprintjs/core'
import { MonacoDiffEditor } from 'react-monaco-editor'
import type { ChangeEventDTO } from 'services/cv'
import { useStrings } from 'framework/strings'
import ChangeEventServiceHealth from '@cv/pages/monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/components/ChangeCard/components/ChangeEventServiceHealth/ChangeEventServiceHealth'
import SLOAndErrorBudget from '@cv/pages/monitored-service/components/ServiceHealth/components/ChangesAndServiceDependency/components/ChangesTable/components/ChangeCard/components/SLOAndErrorBudget/SLOAndErrorBudget'
import VerificationStatusCard from '@cv/components/ExecutionVerification/components/DeploymentProgressAndNodes/components/VerificationStatusCard/VerificationStatusCard'
import ChangeDetails from '../../ChangeDetails/ChangeDetails'
import type { ChangeTitleData, ChangeDetailsDataInterface, ChangeInfoData } from '../../../ChangeEventCard.types'
import { createChangeTitleData, createChangeDetailsDataForKubernetes } from '../../../ChangeEventCard.utils'
import K8sChangeEventYAML from './components/K8sChangeEventYAML/K8sChangeEventYAML'
import { K8sChangeEventDrawerProps } from './K8sChangeEventCard.constants'
import { createK8ChangeInfoData } from './K8sChangeEventCard.utils'
import { TWO_HOURS_IN_MILLISECONDS } from '../../../ChangeEventCard.constant'
import { IconWithText } from '../../IconWithText/IconWithText'
import changeEventCardCss from '../../../ChangeEventCard.module.scss'
import css from './K8sChangeEventCard.module.scss'

export default function K8sChangeEventCard({ data }: { data: ChangeEventDTO }): JSX.Element {
  const [timeStamps, setTimestamps] = useState<[number, number]>([0, 0])
  const changeTitleData: ChangeTitleData = useMemo(() => createChangeTitleData(data), [data])
  const changeDetailsData: ChangeDetailsDataInterface = useMemo(
    () => createChangeDetailsDataForKubernetes(data),
    [data]
  )
  const changeInfoData: ChangeInfoData = useMemo(() => createK8ChangeInfoData(data.metadata), [data.metadata])
  const { getString } = useStrings()
  const [showModal, hideModal] = useModalHook(() => (
    <Dialog {...K8sChangeEventDrawerProps} enforceFocus={false} onClose={hideModal}>
      <Container className={css.comparison}>
        <Text className={css.title}>{getString('previous')}</Text>
        <Text className={css.title}>{getString('common.current')}</Text>
      </Container>
      <MonacoDiffEditor
        width="100%"
        height="100%"
        language="yaml"
        original={data.metadata?.oldYaml}
        value={data.metadata?.newYaml}
      />
    </Dialog>
  ))

  return (
    <Card className={changeEventCardCss.main}>
      <Container>
        <Layout.Horizontal spacing="small" flex>
          <Text lineClamp={1} font={{ size: 'medium', weight: 'semi-bold' }} color={Color.BLACK_100}>
            Workload: {data.metadata.workload} - Namespace: {data.metadata.namespace}
          </Text>
        </Layout.Horizontal>
        <Layout.Horizontal spacing={'xlarge'}>
          <IconWithText icon={'infrastructure'} />
          <IconWithText icon={'services'} text={changeTitleData.serviceIdentifier} />
          <IconWithText icon={'environments'} text={changeTitleData.envIdentifier} />
          <VerificationStatusCard status={status as any} />
        </Layout.Horizontal>
      </Container>

      <Divider className={changeEventCardCss.divider} />
      <ChangeDetails
        ChangeDetailsData={{
          ...changeDetailsData,
          executedBy: {
            shouldVisible: false,
            component: changeInfoData?.triggerAt ? (
              <Text icon={'time'} iconProps={{ size: 13 }} font={{ size: 'small' }} color={Color.BLACK_100}>
                {`${getString('cv.changeSource.changeSourceCard.triggred')} ${changeInfoData.triggerAt}`}
              </Text>
            ) : (
              <></>
            )
          }
        }}
      />
      <Divider className={changeEventCardCss.divider} />
      <Container>
        <Button
          icon="eye-open"
          text={getString('cv.showYAMLChange')}
          onClick={() => showModal()}
          className={css.displayDiffButton}
        />
        <Text font={{ size: 'normal', weight: 'bold' }} color={Color.GREY_800}>
          Kubernetes Manifest Changes
        </Text>
        {data.metadata?.newYaml && <K8sChangeEventYAML yaml={data.metadata.newYaml} />}
      </Container>
      <Divider className={changeEventCardCss.divider} />
      {data.eventTime && data.monitoredServiceIdentifier && (
        <>
          <ChangeEventServiceHealth
            monitoredServiceIdentifier={data?.metadata?.dependentMonitoredService || data.monitoredServiceIdentifier}
            startTime={data.eventTime}
            eventType={data.type}
            timeStamps={timeStamps}
            setTimestamps={setTimestamps}
          />
          <SLOAndErrorBudget
            eventType={data.type}
            eventTime={data.eventTime}
            monitoredServiceIdentifier={data?.metadata?.dependentMonitoredService || data.monitoredServiceIdentifier}
            startTime={timeStamps[0] || data.eventTime}
            endTime={timeStamps[1] || data.eventTime + TWO_HOURS_IN_MILLISECONDS}
          />
        </>
      )}
    </Card>
  )
}
