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

import { String, useStrings } from 'framework/strings'
import {
  ConnectorInfoDTO,
  Error,
  ResponseConnectorValidationResult,
  useGetTestConnectionResult,
  useUpdateConnector
} from 'services/cd-ng'
import type { StepDetails } from '@connectors/interfaces/ConnectorInterface'
import { ErrorHandler } from '@common/components/ErrorHandler/ErrorHandler'

import css from '../CloudVisibilityModal.module.scss'

interface Props {
  name: string
  connector: ConnectorInfoDTO
  closeModal: () => void
}

const EnableCostVisibilityStep: React.FC<Props & StepProps<ConnectorInfoDTO>> = props => {
  const { nextStep, closeModal, connector } = props

  const { accountId } = useParams<{ accountId: string }>()
  const { getString } = useStrings()

  const [stepDetails, setStepDetails] = useState<StepDetails>({
    step: 1,
    intent: Intent.WARNING,
    status: 'PROCESS'
  })
  const [testConnectionRes, setTestConnectionRes] = useState<ResponseConnectorValidationResult>()

  const { mutate: updateConnector } = useUpdateConnector({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const { mutate: testConnection } = useGetTestConnectionResult({
    identifier: connector.identifier,
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const updateAndVerifyConnector = async () => {
    await updateConnector({
      connector: {
        ...connector,
        spec: { ...connector.spec, featuresEnabled: ['VISIBILITY'] }
      }
    })

    if (stepDetails.status === 'PROCESS') {
      try {
        const result = await testConnection()
        setTestConnectionRes(result)
        if (result?.data?.status === 'SUCCESS') {
          setStepDetails({ step: 2, intent: Intent.SUCCESS, status: 'DONE' })
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
    updateAndVerifyConnector()
  }, [])

  const renderError = () => {
    const { responseMessages = null } = testConnectionRes?.data as Error

    return responseMessages ? (
      <div className={css.errorContainer}>
        <ErrorHandler responseMessages={responseMessages} />
      </div>
    ) : null
  }

  const getSteps = () => {
    return (
      <>
        <Layout.Vertical spacing={'xxxlarge'}>
          <Text font={{ variation: FontVariation.BODY2 }}>
            {getString('ce.cloudIntegration.costVisibilityDialog.step1.step1')}
          </Text>
          <Text font={{ variation: FontVariation.BODY2 }}>
            {getString('ce.cloudIntegration.costVisibilityDialog.step1.step2')}
          </Text>
          <Text font={{ variation: FontVariation.BODY2 }}>
            <String stringID="ce.cloudIntegration.costVisibilityDialog.step1.step3" useRichText />
          </Text>
        </Layout.Vertical>
        {(testConnectionRes?.data as Error)?.responseMessages ? renderError() : null}
      </>
    )
  }

  return (
    <>
      <Layout.Vertical height={'100%'} spacing={'xlarge'}>
        <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_800}>
          {getString('ce.cloudIntegration.costVisibilityDialog.step1.title')}
        </Text>
        <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_700}>
          {getString('ce.cloudIntegration.costVisibilityDialog.step1.desc', { connectorName: connector.name })}
        </Text>
        <div className={css.steps}>
          <StepsProgress
            steps={[getSteps()]}
            intent={stepDetails.intent}
            current={stepDetails.step}
            currentStatus={stepDetails.status}
          />
        </div>
        <div>
          <Button
            text={getString('finish')}
            variation={ButtonVariation.SECONDARY}
            margin={{ right: 'small' }}
            onClick={closeModal}
          />
          <Button
            text={getString('ce.cloudIntegration.enableAutoStopping')}
            variation={ButtonVariation.PRIMARY}
            onClick={() => nextStep?.()}
          />
        </div>
      </Layout.Vertical>
    </>
  )
}

export default EnableCostVisibilityStep
