/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { StepWizard } from '@wings-software/uicore'
import { Connectors, CreateConnectorModalProps } from '@connectors/constants'
import DialogExtention from '@connectors/common/ConnectorExtention/DialogExtention'
import { getConnectorIconByType } from '@connectors/pages/connectors/utils/ConnectorHelper'
import { useStrings } from 'framework/strings'
import VerifyOutOfClusterDelegate from '@connectors/common/VerifyOutOfClusterDelegate/VerifyOutOfClusterDelegate'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { CCM_CONNECTOR_SAVE_EVENT, CCM_CONNECTOR_SAVE_SUCCESS } from '@connectors/trackingConstants'
import OverviewStep, { CEGcpConnectorDTO } from './steps/OverviewStep'
import BillingExport from './steps/BillingExport'
import GrantPermission from './steps/GrantPermission'
import ChooseRequirements from './steps/ChooseRequirements'
import css from './CreateCeGcpConnector.module.scss'

const CreateCeGcpConnector: React.FC<CreateConnectorModalProps> = props => {
  const { getString } = useStrings()
  const { trackEvent } = useTelemetry()
  return (
    <DialogExtention>
      <StepWizard
        icon={getConnectorIconByType(Connectors.CE_GCP)}
        iconProps={{ size: 40 }}
        title={getString('pipelineSteps.gcpConnectorLabel')}
        className={css.gcpConnector}
      >
        <OverviewStep
          name={getString('connectors.ceAws.steps.overview')}
          isEditMode={props.isEditMode}
          connectorInfo={props.connectorInfo as CEGcpConnectorDTO}
        />
        <BillingExport name={getString('connectors.ceGcp.billingExport.heading')} />
        <ChooseRequirements name={getString('connectors.ceGcp.chooseRequirements.name')} />
        <GrantPermission name={getString('connectors.ceGcp.grantPermission.heading')}></GrantPermission>
        <VerifyOutOfClusterDelegate
          name={getString('connectors.ceGcp.testConnection.heading')}
          connectorInfo={props.connectorInfo}
          isStep={true}
          isLastStep={true}
          type={Connectors.CE_GCP}
          onClose={() => {
            trackEvent(CCM_CONNECTOR_SAVE_EVENT, { type: Connectors.CE_GCP })
            props.onClose?.()
          }}
          onTestConnectionSuccess={() => trackEvent(CCM_CONNECTOR_SAVE_SUCCESS, { type: Connectors.CE_GCP })}
        />
      </StepWizard>
    </DialogExtention>
  )
}

export default CreateCeGcpConnector
