/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepWizard } from '@wings-software/uicore'
import { pick } from 'lodash-es'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import {
  Connectors,
  CONNECTOR_CREDENTIALS_STEP_IDENTIFIER,
  CreateConnectorModalProps,
  TESTCONNECTION_STEP_INDEX
} from '@connectors/constants'
import { getConnectorTitleIdByType, getConnectorIconByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { buildKubPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { useStrings } from 'framework/strings'
import ConnectorDetailsStep from '../commonSteps/ConnectorDetailsStep'
import Stepk8ClusterDetails from './StepAuth/Stepk8ClusterDetails'
import DelegateSelectorStep from '../commonSteps/DelegateSelectorStep/DelegateSelectorStep'

const CreateK8sConnector: React.FC<CreateConnectorModalProps> = props => {
  const { getString } = useStrings()
  const commonProps = pick(props, [
    'isEditMode',
    'connectorInfo',
    'gitDetails',
    'setIsEditMode',
    'accountId',
    'orgIdentifier',
    'projectIdentifier'
  ])

  return (
    <StepWizard
      icon={getConnectorIconByType(Connectors.KUBERNETES_CLUSTER)}
      iconProps={{ size: 50 }}
      title={getString(getConnectorTitleIdByType(Connectors.KUBERNETES_CLUSTER))}
    >
      <ConnectorDetailsStep
        type={Connectors.KUBERNETES_CLUSTER}
        name={getString('overview')}
        isEditMode={props.isEditMode}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
        mock={props.mock}
        helpPanelReferenceId="KubernetesConnectorOverview"
      />
      <Stepk8ClusterDetails
        name={getString('details')}
        identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
        onConnectorCreated={props.onSuccess}
        hideModal={props.onClose}
        {...commonProps}
      />
      <DelegateSelectorStep
        name={getString('delegate.DelegateselectionLabel')}
        isEditMode={props.isEditMode}
        setIsEditMode={props.setIsEditMode}
        buildPayload={buildKubPayload}
        onConnectorCreated={props.onSuccess}
        connectorInfo={props.connectorInfo}
        gitDetails={props.gitDetails}
        hideModal={props.onClose}
        helpPanelReferenceId="ConnectorDelegatesSetup"
      />
      <VerifyOutOfClusterDelegate
        name={getString('connectors.stepThreeName')}
        connectorInfo={props.connectorInfo}
        isStep
        isLastStep={true}
        type={Connectors.KUBERNETES_CLUSTER}
        onClose={props.onClose}
        setIsEditMode={props.setIsEditMode}
        stepIndex={TESTCONNECTION_STEP_INDEX}
        helpPanelReferenceId="ConnectorTest"
      />
    </StepWizard>
  )
}

export default CreateK8sConnector
