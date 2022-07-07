/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Layout,
  Button,
  Formik,
  StepProps,
  ModalErrorHandlerBinding,
  ModalErrorHandler,
  FormikForm,
  Container,
  Text,
  FormInput
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { Link, useParams } from 'react-router-dom'
import { isEmpty, pick, get, omit } from 'lodash-es'
import cx from 'classnames'
import * as Yup from 'yup'
import {
  Failure,
  ConnectorInfoDTO,
  ResponseBoolean,
  GetConnectorListV2QueryParams,
  useGetConnectorListV2,
  ConnectorFilterProperties,
  ConnectorResponse,
  CEAzureConnector
} from 'services/cd-ng'
import { String, useStrings } from 'framework/strings'
import routes from '@common/RouteDefinitions'
import { Description, Tags } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import GitContextForm, { GitContextProps, IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { CE_AZURE_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import { Connectors } from '@connectors/constants'
import ShowConnectorError from '../ShowConnectorError'
import css from '../../CreateCeAzureConnector_new.module.scss'

export type DetailsForm = Pick<ConnectorInfoDTO, 'name' | 'identifier' | 'description' | 'tags'> & GitContextProps
export const guidRegex = (value: string) => {
  const regex = /^[{]?[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}[}]?$/
  return regex.test(value)
}

interface OverviewForm extends DetailsForm {
  tenantId: string
  subscriptionId: string
}

export interface CEAzureDTO extends ConnectorInfoDTO {
  spec: CEAzureConnector
  existingBillingExports?: CEAzureConnector[]
  hasBilling?: boolean
  isEditMode?: boolean
}

interface OverviewProps {
  type: ConnectorInfoDTO['type']
  name: string
  isEditMode?: boolean
  connectorInfo?: CEAzureDTO
  gitDetails?: IGitContextFormProps
  mock?: ResponseBoolean
}

type Params = {
  accountId: string
  projectIdentifier: string
  orgIdentifier: string
}

const Overview: React.FC<StepProps<CEAzureDTO> & OverviewProps> = props => {
  const [loading, setLoading] = useState(false)
  const [isUniqueConnector, setIsUniqueConnector] = useState(true)
  const [existingConnectorDetails, setExistingConnectorDetails] = useState<ConnectorResponse | undefined>()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()

  useStepLoadTelemetry(CE_AZURE_CONNECTOR_CREATION_EVENTS.LOAD_OVERVIEW_STEP)

  const { accountId } = useParams<Params>()
  const { isGitSyncEnabled } = useAppStore()
  const { getString } = useStrings()
  const { prevStepData, nextStep, isEditMode } = props

  const defaultQueryParams: GetConnectorListV2QueryParams = {
    pageIndex: 0,
    pageSize: 10,
    accountIdentifier: accountId,
    getDistinctFromBranches: false
  }

  const { mutate } = useGetConnectorListV2({ queryParams: defaultQueryParams })
  const filterParams: ConnectorFilterProperties = { types: ['CEAzure'], filterType: 'Connector' }
  const fetchConnectors = async (formData: OverviewForm) => {
    return mutate({
      ...filterParams,
      ccmConnectorFilter: {
        azureTenantId: formData.tenantId,
        azureSubscriptionId: formData.subscriptionId
      }
    })
  }
  const fetchConnectorsWithBillingExports = async (formData: OverviewForm) => {
    return mutate({
      ...filterParams,
      ccmConnectorFilter: {
        featuresEnabled: ['BILLING'],
        azureTenantId: formData.tenantId
      }
    })
  }

  const handleSubmit = async (formData: OverviewForm): Promise<void> => {
    setLoading(true)

    const hasBilling = !!props.connectorInfo?.spec?.featuresEnabled?.includes('BILLING')
    const nextStepData: CEAzureDTO = {
      ...props.connectorInfo,
      ...omit(formData, ['tenantId', 'subscriptionId']),
      type: props.type,
      spec: {
        ...props.connectorInfo?.spec,
        ...prevStepData?.spec,
        ...pick(formData, ['tenantId', 'subscriptionId'])
      },
      hasBilling,
      isEditMode
    }

    // if billing is already enabled,
    // the user is in Edit mode
    if (hasBilling) {
      nextStep?.(nextStepData)
      return
    }

    // Flow:
    //
    // Make a call and check if a connector already exists for
    // this tenantId and subscriptionId combination.
    //    - If yes, throw an error and suggest user to edit the
    //      exitising connector
    //    - If no, check if a connector with BILLING feature exists for
    //      this tenantId.
    //        - If yes, move onto the next step and show all the connectors
    //          which have BILLING enabled
    //        - If no, move onto the next step and allow user to create a
    //          new billing export
    try {
      const connectors = await fetchConnectors(formData)
      if ('SUCCESS' !== connectors.status) {
        throw connectors as Failure
      }

      const hasExistingConnector = !!connectors?.data?.pageItemCount
      if (hasExistingConnector && !isEditMode) {
        setIsUniqueConnector(false)
        setExistingConnectorDetails(connectors?.data?.content?.[0])
        setLoading(false)
        return
      }

      const response = await fetchConnectorsWithBillingExports(formData)
      if ('SUCCESS' !== response.status) {
        throw response as Failure
      }

      const cons = response.data?.content || []
      nextStepData.existingBillingExports = cons.map(c => c.connector?.spec as CEAzureConnector)
      nextStep?.(nextStepData)
    } catch (e) {
      setLoading(false)
      modalErrorHandler?.showDanger(e.message)
    }
  }

  const getInitialValues = () => {
    const conInfo = props.connectorInfo
    return {
      ...pick(conInfo, ['name', 'identifier', 'description', 'tags']),
      ...pick(prevStepData, ['name', 'identifier', 'description', 'tags']),
      tenantId: get(conInfo, 'spec.tenantId') || get(prevStepData, 'spec.tenantId'),
      subscriptionId: get(conInfo, 'spec.subscriptionId') || get(prevStepData, 'spec.subscriptionId')
    }
  }

  const resetExistingConnectorError = () => {
    if (!isUniqueConnector) {
      setIsUniqueConnector(true)
      setExistingConnectorDetails(undefined)
    }
  }

  const { trackEvent } = useTelemetry()

  useTrackEvent(ConnectorActions.OverviewLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.Azure
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Text
        font={{ variation: FontVariation.H3 }}
        tooltipProps={{ dataTooltipId: 'azureConnectorOverview' }}
        margin={{ bottom: 'large' }}
        data-cy="azure-overview"
      >
        {getString('connectors.ceAzure.overview.heading')}
      </Text>
      <ModalErrorHandler bind={setModalErrorHandler} />
      <Formik<OverviewForm>
        onSubmit={formData => {
          trackEvent(ConnectorActions.OverviewSubmit, {
            category: Category.CONNECTOR,
            connector_type: Connectors.Azure
          })
          handleSubmit(formData)
        }}
        formName="connectorOverviewForm"
        validationSchema={Yup.object().shape({
          name: NameSchema(),
          identifier: IdentifierSchema(),
          tenantId: Yup.string()
            .required(getString('connectors.ceAzure.validation.tenantId'))
            .test('tenantId', getString('connectors.ceAzure.guidRegexError'), guidRegex),
          subscriptionId: Yup.string()
            .required(getString('connectors.ceAzure.validation.subscriptionId'))
            .test('subscriptionId', getString('connectors.ceAzure.guidRegexError'), guidRegex)
        })}
        initialValues={{
          ...(getInitialValues() as OverviewForm),
          ...prevStepData
        }}
      >
        {formikProps => {
          return (
            <FormikForm>
              <Container style={{ minHeight: 550 }}>
                <Container className={cx(css.main, css.dataFields)}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('connectors.name')}
                    {...{ inputName: 'name', isIdentifierEditable: !isEditMode }}
                  />
                  <FormInput.Text
                    name={'tenantId'}
                    label={getString('connectors.ceAzure.overview.tenantId')}
                    placeholder={getString('connectors.ceAzure.guidPlaceholder')}
                    onChange={resetExistingConnectorError}
                    tooltipProps={{ dataTooltipId: 'azureTenantId' }}
                  />
                  <FormInput.Text
                    name={'subscriptionId'}
                    label={getString('connectors.ceAzure.overview.subscriptionId')}
                    placeholder={getString('connectors.ceAzure.guidPlaceholder')}
                    onChange={resetExistingConnectorError}
                    tooltipProps={{ dataTooltipId: 'azureSubscriptionId' }}
                  />
                  <Description descriptionProps={{}} hasValue={!!formikProps?.values.description} />
                  <Tags tagsProps={{}} isOptional={true} hasValue={!isEmpty(formikProps?.values.tags)} />
                </Container>
                {isGitSyncEnabled && (
                  <GitSyncStoreProvider>
                    <GitContextForm
                      formikProps={formikProps as any}
                      gitDetails={props.gitDetails}
                      className={'gitDetailsContainer'}
                    />
                  </GitSyncStoreProvider>
                )}
                {!isUniqueConnector && <ExistingConnectorMessage {...existingConnectorDetails} />}
              </Container>
              <Layout.Horizontal>
                <Button type="submit" intent="primary" rightIcon="chevron-right" disabled={loading}>
                  <String stringID="continue" />
                </Button>
              </Layout.Horizontal>
            </FormikForm>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

const ExistingConnectorMessage = (props: ConnectorResponse) => {
  const { getString } = useStrings()
  const { accountId: accountIdentifier } = useParams<Params>()

  const accountId = props.connector?.spec?.tenantId
  const featuresEnabled = [...(props.connector?.spec?.featuresEnabled || [])]
  const name = props.connector?.name

  let featureText = featuresEnabled.join(' and ')
  if (featuresEnabled.length > 2) {
    featuresEnabled.push(`and ${featuresEnabled.pop()}`)
    featureText = featuresEnabled.join(', ')
  }

  return (
    <ShowConnectorError
      title={getString('connectors.ceAzure.overview.alreadyExist')}
      reason={getString('connectors.ceAzure.overview.existingConnectorInfo', {
        accountId,
        name,
        featureText
      })}
      suggestion={
        <>
          {getString('connectors.ceAzure.overview.editConnector')}{' '}
          <Link
            to={routes.toConnectorDetails({
              accountId: accountIdentifier,
              connectorId: props.connector?.identifier
            })}
          >
            {name}
          </Link>{' '}
          {getString('connectors.ceAzure.overview.required')}
        </>
      }
    />
  )
}

export default Overview

// ALL three features enabled
// TenantId:  b229b2bb-5f33-4d22-bce0-730f6474e906
// Sub: 20d6a917-99fa-4b1b-9b2e-a3d624e9dcf0

// ["OPTIMIZATION", "BILLING"]
// TenantId: b229b2bb-5f33-4d22-bce1-730f6474e906
// SubId: b229b2bb-5f33-4d22-bce2-730f6474e906
