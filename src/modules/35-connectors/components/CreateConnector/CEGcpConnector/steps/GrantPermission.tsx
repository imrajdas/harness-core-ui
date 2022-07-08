/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { pick } from 'lodash-es'
import {
  Button,
  Container,
  Heading,
  Layout,
  StepProps,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  Icon
} from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import { useGcpserviceaccount } from 'services/ce'
import { useCreateConnector, useUpdateConnector, Failure } from 'services/cd-ng'
import CopyToClipboard from '@common/components/CopyToClipBoard/CopyToClipBoard'
import { CE_GCP_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { connectorGovernanceModalProps } from '@connectors/utils/utils'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import { FeatureFlag } from '@common/featureFlags'
import type { CEGcpConnectorDTO } from './OverviewStep'
import css from '../CreateCeGcpConnector.module.scss'

const GrantPermission: React.FC<StepProps<CEGcpConnectorDTO>> = props => {
  const { getString } = useStrings()

  useStepLoadTelemetry(CE_GCP_CONNECTOR_CREATION_EVENTS.LOAD_GRANT_PERMISSIONS)

  const { accountId } = useParams<{
    accountId: string
  }>()
  const { prevStepData, nextStep, previousStep } = props
  const [isSubmitLoading, setIsSubmitLoading] = useState<boolean>(false)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()

  const { mutate: createConnector } = useCreateConnector({
    queryParams: { accountIdentifier: accountId }
  })
  const { mutate: updateConnector } = useUpdateConnector({
    queryParams: { accountIdentifier: accountId }
  })

  const opaFlagEnabled = useFeatureFlag(FeatureFlag.OPA_CONNECTOR_GOVERNANCE)
  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal(connectorGovernanceModalProps())
  const {
    data,
    loading: loadingServiceAccount,
    refetch: refetchServiceAccount
  } = useGcpserviceaccount({
    queryParams: { accountIdentifier: accountId },
    lazy: true
  })

  const serviceAccount = prevStepData?.serviceAccount || data?.data
  useEffect(() => {
    if (!prevStepData?.serviceAccount) {
      refetchServiceAccount()
    }
  }, [])

  const handleSubmit = async () => {
    trackEvent(ConnectorActions.ProvidePermissionsSubmit, {
      category: Category.CONNECTOR,
      connector_type: Connectors.CEGcp
    })
    setIsSubmitLoading(true)

    try {
      if (prevStepData) {
        const connectorInfo: CEGcpConnectorDTO = {
          ...pick(prevStepData, ['name', 'identifier', 'description', 'tags', 'spec', 'type']),
          spec: {
            ...prevStepData.spec,
            serviceAccountEmail: serviceAccount || ''
          }
        }

        const response = await (prevStepData.isEditMode
          ? updateConnector({ connector: connectorInfo })
          : createConnector({ connector: connectorInfo }))
        if (response.status !== 'SUCCESS') {
          throw response as Failure
        }
        if (opaFlagEnabled && response.data?.governanceMetadata) {
          conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, () => {
            nextStep?.({ ...prevStepData, serviceAccount })
          })
        } else {
          nextStep?.({ ...prevStepData, serviceAccount })
        }
      }
    } catch (e) {
      modalErrorHandler?.showDanger(e?.data?.message)
    }
    setIsSubmitLoading(false)
  }

  const handlePrev = () => {
    previousStep?.({ ...(prevStepData as CEGcpConnectorDTO), serviceAccount })
  }

  const renderAdditionalSteps = () => {
    const optimizationEnabled = props.prevStepData?.spec.featuresEnabled?.includes('OPTIMIZATION')
    const inventoryEnabled = props.prevStepData?.spec.featuresEnabled?.includes('VISIBILITY')
    return optimizationEnabled && inventoryEnabled ? (
      <>
        <li>
          <div>
            {getString('enable')}{' '}
            <a
              href="https://console.cloud.google.com/apis/library/compute.googleapis.com"
              rel="noreferrer"
              target="_blank"
            >
              {getString('connectors.ceGcp.grantPermission.inventory.computeEngine')}
            </a>{' '}
            {getString('connectors.ceGcp.grantPermission.inventory.step1')}
          </div>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.optimization.step1')}</div>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.optimization.step2', { serviceAccount })}</div>
        </li>
        <li>
          <div>
            {getString('connectors.ceGcp.grantPermission.optimization.step3', {
              otherRole: inventoryEnabled ? getString('connectors.ceGcp.grantPermission.inventory.step2') : ''
            })}
          </div>
        </li>
      </>
    ) : optimizationEnabled && !inventoryEnabled ? (
      <>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.optimization.step1')}</div>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.optimization.step2', { serviceAccount })}</div>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.optimization.step3')}</div>
        </li>
      </>
    ) : !optimizationEnabled && inventoryEnabled ? (
      <>
        <li>
          <div>
            {getString('enable')}{' '}
            <a
              href="https://console.cloud.google.com/apis/library/compute.googleapis.com"
              rel="noreferrer"
              target="_blank"
            >
              {getString('connectors.ceGcp.grantPermission.inventory.computeEngine')}
            </a>{' '}
            {getString('connectors.ceGcp.grantPermission.inventory.step1')}
          </div>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.inventory.completePermissionStep')}</div>
        </li>
      </>
    ) : null
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.ProvidePermissionsLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.CEGcp
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Heading level={2} className={css.header}>
        {getString('connectors.ceGcp.grantPermission.heading')}
      </Heading>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <ol className={css.grantPermissionSteps}>
        <li>
          <Layout.Vertical spacing="small">
            <div>{getString('connectors.ceGcp.grantPermission.step1')}</div>
            <Button
              className={css.bigQueryPage}
              text={getString('connectors.ceGcp.grantPermission.bigQueryButtonText')}
              rightIcon="chevron-right"
              onClick={() => {
                window.open('https://console.cloud.google.com/bigquery')
              }}
            />
          </Layout.Vertical>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.step2')}</div>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.step3')}</div>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.step4')}</div>
        </li>
        <li>
          <Layout.Vertical spacing="small">
            <div>{getString('connectors.ceGcp.grantPermission.step5')}</div>
            <Container className={css.commandsContainer}>
              <Container className={css.command}>
                {loadingServiceAccount ? <Loader /> : <pre>{serviceAccount}</pre>}
                <CopyToClipboard showFeedback content={serviceAccount || ''} />
              </Container>
            </Container>
          </Layout.Vertical>
        </li>
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.step6')}</div>
        </li>
        {renderAdditionalSteps()}
        <li>
          <div>{getString('connectors.ceGcp.grantPermission.step7')}</div>
        </li>
      </ol>

      <Layout.Horizontal className={css.buttonPanel} spacing="small">
        <Button text={getString('previous')} icon="chevron-left" onClick={handlePrev} disabled={isSubmitLoading} />
        <Button
          type="submit"
          intent="primary"
          text={getString('continue')}
          rightIcon="chevron-right"
          onClick={handleSubmit}
          disabled={isSubmitLoading}
        />
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

const Loader = () => {
  return (
    <Container className={css.serviceAccountLoader}>
      <Icon name="spinner" color="primary7" size={18} />
    </Container>
  )
}

export default GrantPermission
