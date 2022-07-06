/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Button,
  ButtonVariation,
  getErrorInfoFromErrorObject,
  Layout,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  StepProps,
  StepsProgress,
  Text
} from '@harness/uicore'
import { FontVariation, Color, Intent } from '@harness/design-system'
import { useParams } from 'react-router-dom'

import { String, useStrings } from 'framework/strings'
import {
  ConnectorInfoDTO,
  Error,
  ResponseConnectorValidationResult,
  useCreateConnector,
  useGetTestConnectionResult
} from 'services/cd-ng'
import type { StepDetails } from '@connectors/interfaces/ConnectorInterface'
import { ErrorHandler } from '@common/components/ErrorHandler/ErrorHandler'
import { Connectors } from '@connectors/constants'

import css from '../CloudVisibilityModal.module.scss'

interface Props {
  name: string
  connector: ConnectorInfoDTO
  closeModal: () => void
}

const Step1: React.FC = () => (
  <Text font={{ variation: FontVariation.BODY2 }}>
    <String stringID="ce.cloudIntegration.costVisibilityDialog.step1.step1" />
  </Text>
)

const Step2: React.FC = () => (
  <Text font={{ variation: FontVariation.BODY2 }}>
    <String stringID="ce.cloudIntegration.costVisibilityDialog.step1.step2" />
  </Text>
)

const Step3: React.FC = () => (
  <Text font={{ variation: FontVariation.BODY2 }}>
    <String stringID="ce.cloudIntegration.costVisibilityDialog.step1.step3" useRichText />
  </Text>
)

const EnableCostVisibilityStep: React.FC<Props & StepProps<ConnectorInfoDTO>> = props => {
  const { closeModal, connector, gotoStep } = props

  const { accountId } = useParams<{ accountId: string }>()
  const { getString } = useStrings()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const [ccmConnector, setCCMConnector] = useState<ConnectorInfoDTO>()

  const [stepDetails, setStepDetails] = useState<StepDetails>({
    step: 1,
    intent: Intent.WARNING,
    status: 'PROCESS'
  })
  const [testConnectionRes, setTestConnectionRes] = useState<ResponseConnectorValidationResult>()

  const { mutate: createConnector } = useCreateConnector({
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
    if (stepDetails.status === 'PROCESS') {
      try {
        const result = await testConnection()
        setTestConnectionRes(result)
        if (result?.data?.status === 'SUCCESS') {
          setStepDetails({ step: 3, intent: Intent.SUCCESS, status: 'DONE' })
        } else {
          setStepDetails({ step: 1, intent: Intent.DANGER, status: 'ERROR' })
        }
      } catch (err) {
        setTestConnectionRes(err)
        setStepDetails({ step: 1, intent: Intent.DANGER, status: 'ERROR' })
      }
    }
  }

  const saveConnector: () => Promise<boolean> = async () => {
    try {
      const res = await createConnector({
        connector: {
          ...connector,
          name: `${connector.name}-Cost-access`,
          identifier: `${connector.identifier}Costaccess`,
          spec: {
            ...connector.spec,
            connectorRef: connector.identifier,
            featuresEnabled: ['VISIBILITY']
          },
          type: Connectors.CE_KUBERNETES
        }
      })

      setCCMConnector(res.data?.connector)

      return true
    } catch (error) {
      modalErrorHandler?.showDanger(getErrorInfoFromErrorObject(error))

      return false
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

  return (
    <>
      <Layout.Vertical height={'100%'} spacing={'xlarge'}>
        <ModalErrorHandler bind={setModalErrorHandler} />
        <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_800}>
          {getString('ce.cloudIntegration.costVisibilityDialog.step1.title')}
        </Text>
        <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_700}>
          {getString('ce.cloudIntegration.costVisibilityDialog.step1.desc', { connectorName: connector.name })}
        </Text>
        <div className={css.steps}>
          <StepsProgress
            steps={[<Step1 key={1} />, <Step2 key={2} />, <Step3 key={3} />]}
            intent={stepDetails.intent}
            current={stepDetails.step}
            currentStatus={stepDetails.status}
          />
          {(testConnectionRes?.data as Error)?.responseMessages ? renderError() : null}
        </div>
        <div>
          <Button
            text={getString('finish')}
            variation={ButtonVariation.SECONDARY}
            margin={{ right: 'medium' }}
            onClick={async () => {
              const connectorSaved = await saveConnector()
              if (connectorSaved) {
                closeModal()
              }
            }}
            disabled={testConnectionRes?.status !== 'SUCCESS'}
          />
          <Button
            rightIcon="chevron-right"
            text={getString('ce.cloudIntegration.enableAutoStopping')}
            variation={ButtonVariation.PRIMARY}
            onClick={async () => {
              // const connectorSaved = await saveConnector()
              // if (connectorSaved) {
              gotoStep?.({ stepNumber: 3, prevStepData: ccmConnector })
              // }
            }}
            // disabled={testConnectionRes?.status !== 'SUCCESS'}
          />
        </div>
      </Layout.Vertical>
    </>
  )
}

export default EnableCostVisibilityStep
