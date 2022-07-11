/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepWizard } from '@wings-software/uicore'
import { pick } from 'lodash-es'
import ConnectorDetailsStep from '@connectors/components/CreateConnector/commonSteps/ConnectorDetailsStep'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import { Connectors, CONNECTOR_CREDENTIALS_STEP_IDENTIFIER, TESTCONNECTION_STEP_INDEX } from '@connectors/constants'
import { getConnectorIconByType, getConnectorTitleIdByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { buildJenkinsPayload } from '@connectors/pages/connectors/utils/ConnectorUtils'
import { useStrings } from 'framework/strings'
import type { ConnectorRequestBody, ConnectorInfoDTO, ResponseBoolean } from 'services/cd-ng'
import type { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import DelegateSelectorStep from '../commonSteps/DelegateSelectorStep/DelegateSelectorStep'
import StepJenkinsAuthentication from './StepAuth/StepJenkinsAuthentication'

interface CreateJenkinsConnectorProps {
  onClose: () => void
  onSuccess?: (data?: ConnectorRequestBody) => void | Promise<void>
  mock?: ResponseBoolean
  isEditMode: boolean
  setIsEditMode: (val: boolean) => void
  connectorInfo?: ConnectorInfoDTO | void
  gitDetails?: IGitContextFormProps
  accountId: string
  orgIdentifier: string
  projectIdentifier: string
}
const CreateJenkinsConnector: React.FC<CreateJenkinsConnectorProps> = props => {
  const { getString } = useStrings()
  const commonProps = pick(props, ['isEditMode', 'setIsEditMode', 'accountId', 'orgIdentifier', 'projectIdentifier'])
  return (
    <>
      <StepWizard
        icon={getConnectorIconByType(Connectors.JENKINS)}
        iconProps={{ size: 37 }}
        title={getString(getConnectorTitleIdByType(Connectors.JENKINS))}
      >
        <ConnectorDetailsStep
          type={Connectors.JENKINS}
          name={getString('overview')}
          isEditMode={props.isEditMode}
          connectorInfo={props.connectorInfo}
          gitDetails={props.gitDetails}
          mock={props.mock}
        />
        <StepJenkinsAuthentication
          name={getString('details')}
          identifier={CONNECTOR_CREDENTIALS_STEP_IDENTIFIER}
          {...commonProps}
          onConnectorCreated={props.onSuccess}
          connectorInfo={props.connectorInfo}
        />
        <DelegateSelectorStep
          name={getString('delegate.DelegateselectionLabel')}
          isEditMode={props.isEditMode}
          setIsEditMode={props.setIsEditMode}
          buildPayload={buildJenkinsPayload}
          hideModal={props.onClose}
          onConnectorCreated={props.onSuccess}
          connectorInfo={props.connectorInfo}
          gitDetails={props.gitDetails}
        />
        <VerifyOutOfClusterDelegate
          name={getString('connectors.stepThreeName')}
          connectorInfo={props.connectorInfo}
          isStep={true}
          isLastStep={true}
          type={Connectors.JENKINS}
          onClose={props.onClose}
          stepIndex={TESTCONNECTION_STEP_INDEX}
        />
      </StepWizard>
    </>
  )
}

export default CreateJenkinsConnector
