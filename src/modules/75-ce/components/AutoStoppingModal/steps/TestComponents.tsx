/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { Button, ButtonVariation, Layout, StepProps, StepsProgress, Text } from '@harness/uicore'
import { FontVariation, Color, Intent } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'

import type { StepDetails } from '@connectors/interfaces/ConnectorInterface'
import { ConnectorInfoDTO, Error, ResponseConnectorValidationResult, useGetTestConnectionResult } from 'services/cd-ng'
import { ErrorHandler } from '@common/components/ErrorHandler/ErrorHandler'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import EnableAutoStoppingHeader from '@ce/components/CloudVisibilityModal/steps/EnableAutoStoppingStep'

import css from '../AutoStoppingModal.module.scss'

interface TestComponentsProps {
  name: string
  connector?: ConnectorInfoDTO
  isCloudReportingModal?: boolean
  closeModal: () => void
}

const TestComponents: React.FC<StepProps<ConnectorInfoDTO> & TestComponentsProps> = ({
  isCloudReportingModal,
  connector: ccmConnector,
  prevStepData,
  previousStep,
  closeModal
}) => {
  const { getString } = useStrings()
  const { accountId } = useParams<AccountPathProps>()
  const connector = isCloudReportingModal ? prevStepData : ccmConnector

  const [stepDetails, setStepDetails] = useState<StepDetails>({
    step: 1,
    intent: Intent.WARNING,
    status: 'PROCESS'
  })
  const [testConnectionRes, setTestConnectionRes] = useState<ResponseConnectorValidationResult>()

  const { mutate: testConnection } = useGetTestConnectionResult({
    identifier: connector?.identifier || '',
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const verifyConnection = async () => {
    if (stepDetails.status === 'PROCESS') {
      try {
        const result = await testConnection()
        setTestConnectionRes(result)
        if (result?.data?.status === 'SUCCESS') {
          setStepDetails({ step: 1, intent: Intent.SUCCESS, status: 'DONE' })
        } else {
          setStepDetails({ step: 1, intent: Intent.DANGER, status: 'ERROR' })
        }
      } catch (err) {
        setTestConnectionRes(err)
        setStepDetails({ step: 1, intent: Intent.DANGER, status: 'ERROR' })
      }
    }
  }

  useEffect(() => {
    verifyConnection()
  }, [])

  const getSteps = () => <Text font={{ variation: FontVariation.BODY2 }}>{`${getString('test')} 1`}</Text>

  const renderError = () => {
    const { responseMessages = null } = testConnectionRes?.data as Error

    return responseMessages ? (
      <div className={css.errorContainer}>
        <ErrorHandler responseMessages={responseMessages} />
      </div>
    ) : null
  }

  return (
    <Layout.Vertical height={'100%'} spacing={'medium'}>
      {isCloudReportingModal ? <EnableAutoStoppingHeader /> : null}
      <Text font={{ variation: FontVariation.H4 }} color={Color.GREY_800}>
        {`iii. ${getString('ce.cloudIntegration.autoStoppingModal.testComponents.title')}`}
      </Text>
      <div className={css.steps}>
        <StepsProgress
          steps={[getSteps()]}
          intent={stepDetails.intent}
          current={stepDetails.step}
          currentStatus={stepDetails.status}
        />
        {(testConnectionRes?.data as Error)?.responseMessages ? renderError() : null}
      </div>
      <div>
        <Button
          icon="chevron-left"
          text={getString('back')}
          variation={ButtonVariation.SECONDARY}
          margin={{ right: 'medium' }}
          onClick={() => previousStep?.()}
        />
        <Button
          rightIcon="chevron-right"
          text={getString('finish')}
          variation={ButtonVariation.PRIMARY}
          onClick={closeModal}
        />
      </div>
    </Layout.Vertical>
  )
}

export default TestComponents
