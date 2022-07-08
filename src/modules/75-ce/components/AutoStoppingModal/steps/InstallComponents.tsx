/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import { Button, ButtonVariation, Layout, StepProps, Text } from '@harness/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'

import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { CE_K8S_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { DialogExtensionContext } from '@connectors/common/ConnectorExtention/DialogExtention'

import type { ConnectorInfoDTO } from 'services/cd-ng'
import { useMutateAsGet } from '@common/hooks'
import { useCloudCostK8sClusterSetup } from 'services/ce'
import PermissionYAMLPreview from '@connectors/components/CreateConnector/CEK8sConnector/PermissionYAMLPreview'

import css from '../AutoStoppingModal.module.scss'

interface InstallComponentsProps {
  name: string
  connector?: ConnectorInfoDTO
  isCloudReportingModal?: boolean
}

const InstallComponents: React.FC<StepProps<ConnectorInfoDTO> & InstallComponentsProps> = ({
  previousStep,
  prevStepData,
  nextStep,
  connector: ccmConnector,
  isCloudReportingModal
}) => {
  const { getString } = useStrings()
  const { triggerExtension } = useContext(DialogExtensionContext)
  const { accountId } = useParams<AccountPathProps>()

  useStepLoadTelemetry(CE_K8S_CONNECTOR_CREATION_EVENTS.LOAD_SECRET_CREATION)

  const connector = isCloudReportingModal ? prevStepData : ccmConnector

  const { data: permissionsYaml, loading: yamlLoading } = useMutateAsGet(useCloudCostK8sClusterSetup, {
    queryParams: {
      accountIdentifier: accountId
    },
    body: {
      connectorIdentifier: connector?.spec?.connectorRef,
      featuresEnabled: connector?.spec?.featuresEnabled,
      ccmConnectorIdentifier: connector?.identifier
    }
  })

  return (
    <Layout.Vertical height={'100%'} spacing={'medium'}>
      {isCloudReportingModal ? (
        <Text font={{ variation: FontVariation.H3 }} color={Color.GREY_800}>
          {getString('ce.cloudIntegration.enableAutoStopping')}{' '}
          <Text inline font={{ weight: 'light', italic: true }} color={Color.GREY_800}>
            {getString('common.optionalLabel')}
          </Text>
        </Text>
      ) : null}
      <Text font={{ variation: FontVariation.H4 }} color={Color.GREY_800}>
        {`i. ${getString('ce.cloudIntegration.autoStoppingModal.installComponents.title')}`}
      </Text>
      <Text font={{ variation: FontVariation.BODY }} color={Color.GREY_600}>
        <p>{getString('ce.cloudIntegration.autoStoppingModal.installComponents.desc')}</p>
        <p>{`1. ${getString('connectors.ceK8.providePermissionsStep.fileDescription.info1')}`}</p>
        <p>{`2. ${getString('connectors.ceK8.providePermissionsStep.fileDescription.info2')}`}</p>
        <p>{`3. ${getString('connectors.ceK8.providePermissionsStep.fileDescription.info3')}`}</p>
        <p>{`4. ${getString('connectors.ceK8.providePermissionsStep.fileDescription.info4')}`}</p>
      </Text>
      <div className={css.container}>
        <div className={css.downloadYaml}>
          <Text color={Color.GREY_900} margin={{ right: 'xlarge' }}>
            {getString('ce.cloudIntegration.autoStoppingModal.createSecret.step1')}
          </Text>
          <Button
            rightIcon="launch"
            variation={ButtonVariation.SECONDARY}
            margin={{ right: 'medium' }}
            text={getString('connectors.ceK8.providePermissionsStep.downloadYamlBtnText')}
          />
          <Button
            loading={yamlLoading}
            rightIcon="launch"
            variation={ButtonVariation.SECONDARY}
            text={getString('ce.cloudIntegration.autoStoppingModal.installComponents.previewYaml')}
            onClick={() =>
              triggerExtension(<PermissionYAMLPreview yamlContent={permissionsYaml as unknown as string} />)
            }
          />
        </div>
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
          text={getString('continue')}
          variation={ButtonVariation.PRIMARY}
          onClick={() => nextStep?.(connector)}
        />
      </div>
    </Layout.Vertical>
  )
}

export default InstallComponents
