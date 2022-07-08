/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext, useState } from 'react'
import {
  Button,
  Heading,
  Icon,
  Layout,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  StepProps,
  Text
} from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import { Color } from '@harness/design-system'
import { omit as _omit, defaultTo as _defaultTo } from 'lodash-es'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { ConnectorInfoDTO, ConnectorRequestBody, useCreateConnector, useUpdateConnector } from 'services/cd-ng'
import { downloadYamlAsFile } from '@common/utils/downloadYamlUtils'
import { DialogExtensionContext } from '@connectors/common/ConnectorExtention/DialogExtention'
import { Connectors } from '@connectors/constants'
import { useStrings } from 'framework/strings'
import { useCloudCostK8sClusterSetup } from 'services/ce'
import { CE_K8S_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useMutateAsGet } from '@common/hooks'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGovernanceMetaDataModal } from '@governance/hooks/useGovernanceMetaDataModal'
import { connectorGovernanceModalProps } from '@connectors/utils/utils'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import CopyCodeSection from './components/CopyCodeSection'
import PermissionYAMLPreview from './PermissionYAMLPreview'
import css from './CEK8sConnector.module.scss'

interface ProvidePermissionsProps {
  name: string
  onSuccess?: (connector: ConnectorRequestBody) => void
  isEditMode: boolean
}

interface StepSecretManagerProps extends ConnectorInfoDTO {
  spec: any
}

const yamlFileName = 'ccm-kubernetes.yaml'

const ProvidePermissions: React.FC<StepProps<StepSecretManagerProps> & ProvidePermissionsProps> = props => {
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()
  const { accountId } = useParams<AccountPathProps>()
  const [isDownloadComplete, setIsDownloadComplete] = useState<boolean>(false)
  const [isDelegateDone, setIsDelegateDone] = useState<boolean>(false)
  const [command] = useState(`kubectl apply -f ${yamlFileName}`)
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const { triggerExtension } = useContext(DialogExtensionContext)
  const { trackEvent } = useTelemetry()

  useStepLoadTelemetry(CE_K8S_CONNECTOR_CREATION_EVENTS.LOAD_PROVIDE_PERMISSIONS)

  const { mutate: createConnector } = useCreateConnector({ queryParams: { accountIdentifier: accountId } })
  const { mutate: updateConnector } = useUpdateConnector({
    queryParams: { accountIdentifier: accountId }
  })

  const opaFlagEnabled = useFeatureFlag(FeatureFlag.OPA_CONNECTOR_GOVERNANCE)
  const { conditionallyOpenGovernanceErrorModal } = useGovernanceMetaDataModal(connectorGovernanceModalProps())
  const { data: permissionsYaml, loading: yamlLoading } = useMutateAsGet(useCloudCostK8sClusterSetup, {
    queryParams: {
      accountIdentifier: accountId
    },
    body: {
      connectorIdentifier: _defaultTo(props.prevStepData?.spec?.connectorRef, ''),
      featuresEnabled: props.prevStepData?.spec?.featuresEnabled,
      ccmConnectorIdentifier: _defaultTo(props.prevStepData?.identifier, '')
    }
  })

  const handleDownload = async () => {
    trackEvent(CE_K8S_CONNECTOR_CREATION_EVENTS.DOWNLOAD_YAML, {})
    const { status } = await downloadYamlAsFile(permissionsYaml, yamlFileName)
    status && setIsDownloadComplete(true)
  }

  const handleDoneClick = () => {
    trackEvent(CE_K8S_CONNECTOR_CREATION_EVENTS.APPLY_COMMAND_DONE, {})
    setIsDelegateDone(true)
  }

  const saveAndContinue = async (): Promise<void> => {
    trackEvent(ConnectorActions.ProvidePermissionsSubmit, {
      category: Category.CONNECTOR,
      connector_type: Connectors.CEK8
    })
    setIsSaving(true)
    try {
      modalErrorHandler?.hide()
      const connector: ConnectorRequestBody = {
        connector: {
          ...props.prevStepData,
          spec: _omit({ ...props.prevStepData?.spec }, 'fixFeatureSelection'),
          type: Connectors.CE_KUBERNETES
        } as ConnectorInfoDTO
      }
      const response = props.isEditMode ? await updateConnector(connector) : await createConnector(connector)
      const nextSteps = () => {
        props.onSuccess?.(response?.data as ConnectorRequestBody)
        props.nextStep?.({ ...props.prevStepData } as ConnectorInfoDTO)
      }
      if (opaFlagEnabled && response.data?.governanceMetadata) {
        conditionallyOpenGovernanceErrorModal(response.data?.governanceMetadata, nextSteps)
      } else {
        nextSteps()
      }
    } catch (e) {
      modalErrorHandler?.showDanger(getRBACErrorMessage(e))
    } finally {
      setIsSaving(false)
    }
  }

  useTrackEvent(ConnectorActions.ProvidePermissionsLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.CEK8
  })

  return (
    <Layout.Vertical spacing={'xlarge'} className={css.providePermissionContainer}>
      <Heading level={2} className={css.heading}>
        {getString('connectors.ceK8.providePermissionsStep.heading')}
      </Heading>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Text icon={'info'} iconProps={{ color: Color.PRIMARY_7 }} color={Color.PRIMARY_7}>
        {getString('connectors.ceK8.providePermissionsStep.info')}
        <a
          href="https://docs.harness.io/article/ltt65r6k39-set-up-cost-visibility-for-kubernetes#prerequisites"
          target="_blank"
          rel="noreferrer"
        >
          {getString('connectors.readMore')}
        </a>
      </Text>
      <Text>
        {getString('connectors.ceK8.providePermissionsStep.downloadYamlText')}
        <span
          className={css.previewLink}
          onClick={() => triggerExtension(<PermissionYAMLPreview yamlContent={permissionsYaml as unknown as string} />)}
        >
          here
        </span>
        .
      </Text>
      <div>
        <Text>{getString('connectors.ceK8.providePermissionsStep.fileDescription.heading')}</Text>
        <ul>
          <li>{getString('connectors.ceK8.providePermissionsStep.fileDescription.info1')}</li>
          <li>{getString('connectors.ceK8.providePermissionsStep.fileDescription.info2')}</li>
          <li>{getString('connectors.ceK8.providePermissionsStep.fileDescription.info3')}</li>
          <li>{getString('connectors.ceK8.providePermissionsStep.fileDescription.info4')}</li>
        </ul>
        {!isDownloadComplete && (
          <Button
            intent={'primary'}
            outlined={true}
            onClick={handleDownload}
            text={getString('connectors.ceK8.providePermissionsStep.downloadYamlBtnText')}
            className={css.stepBtn}
            disabled={yamlLoading}
          />
        )}
        {isDownloadComplete && (
          <Layout.Horizontal className={css.successTextContainer}>
            <Icon name="tick" />
            <span>{getString('connectors.ceK8.providePermissionsStep.downloadComplete')}</span>
          </Layout.Horizontal>
        )}
        {isDownloadComplete && (
          <div className={css.commandSection}>
            <Text>{getString('connectors.ceK8.providePermissionsStep.applyDelegateText')}</Text>
            <CopyCodeSection snippet={`${command}`} />
            {!isDelegateDone && (
              <Button
                intent={'primary'}
                outlined={true}
                onClick={handleDoneClick}
                text={getString('done')}
                className={css.stepBtn}
              />
            )}
            {isDelegateDone && (
              <Layout.Horizontal className={css.successTextContainer}>
                <Icon name="tick" />
                <span>{getString('connectors.ceK8.providePermissionsStep.successfulCommandExec')}</span>
              </Layout.Horizontal>
            )}
          </div>
        )}
      </div>
      <Button
        intent="primary"
        text={getString('continue')}
        rightIcon="chevron-right"
        loading={isSaving}
        disabled={isSaving || !(isDownloadComplete && isDelegateDone)}
        onClick={() => saveAndContinue()}
        className={css.submitBtn}
      />
    </Layout.Vertical>
  )
}

export default ProvidePermissions
