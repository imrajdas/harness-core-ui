/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  Container,
  Formik,
  FormikForm,
  FormInput,
  Layout,
  ModalErrorHandler,
  ModalErrorHandlerBinding,
  StepProps,
  Icon,
  Text
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import * as Yup from 'yup'
import { omit, pick } from 'lodash-es'
import { useParams, Link } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import {
  ConnectorInfoDTO,
  ConnectorFilterProperties,
  useGetConnectorListV2,
  GetConnectorListV2QueryParams,
  Failure,
  CEAwsConnector,
  AwsCurAttributes
} from 'services/cd-ng'
import routes from '@common/RouteDefinitions'
import { Description, Tags } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { CE_AWS_CONNECTOR_CREATION_EVENTS } from '@connectors/trackingConstants'
import { Connectors } from '@connectors/constants'
import { useStepLoadTelemetry } from '@connectors/common/useTrackStepLoad/useStepLoadTelemetry'
import { useTelemetry, useTrackEvent } from '@common/hooks/useTelemetry'
import { Category, ConnectorActions } from '@common/constants/TrackingConstants'
import css from '../CreateCeAwsConnector.module.scss'
interface OverviewDetails {
  name: string
  awsAccountId: string
  identifier: string
  description: string
  tags: Record<string, any>
}

export interface ExistingCURDetails extends AwsCurAttributes {
  awsAccountId: string
}

export interface CEAwsConnectorDTO extends ConnectorInfoDTO {
  existingCurReports?: ExistingCURDetails[]
  spec: CEAwsConnector
  includeBilling?: boolean
  isEditMode?: boolean
}

interface OverviewProps extends StepProps<CEAwsConnectorDTO> {
  isEditMode?: boolean
  connectorInfo?: CEAwsConnectorDTO
}

const OverviewStep: React.FC<OverviewProps> = props => {
  const { getString } = useStrings()

  useStepLoadTelemetry(CE_AWS_CONNECTOR_CREATION_EVENTS.LOAD_OVERVIEW_STEP)

  const { connectorInfo, isEditMode, nextStep, prevStepData } = props
  const { accountId } = useParams<{
    projectIdentifier: string
    orgIdentifier: string
    accountId: string
  }>()
  const [awsAccountID, setAwsAccountID] = useState<string>('')
  const [isUniqueConnnector, setIsUniqueConnnector] = useState<boolean>(true)
  const [existingConnectorName, setExistingConnectorName] = useState<string>('')
  const [existingConnectorId, setExistingConnectorId] = useState<string>('')
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [featureText, setFeatureText] = useState<string>('')

  const defaultQueryParams: GetConnectorListV2QueryParams = {
    pageIndex: 0,
    pageSize: 10,
    accountIdentifier: accountId,
    getDistinctFromBranches: false
  }

  const filterParams: ConnectorFilterProperties = {
    types: ['CEAws'],
    filterType: 'Connector'
  }

  const { mutate: fetchConnectors } = useGetConnectorListV2({
    queryParams: defaultQueryParams
  })

  const handleSubmit = async (formData: OverviewDetails): Promise<void> => {
    setIsLoading(true)
    const newspec: CEAwsConnector = {
      crossAccountAccess: { crossAccountRoleArn: '' },
      ...connectorInfo?.spec,
      ...prevStepData?.spec,
      ...pick(formData, ['awsAccountId'])
    }
    const payload: CEAwsConnectorDTO = {
      ...omit(formData, ['awsAccountId']),
      type: 'CEAws',
      spec: newspec,
      existingCurReports: [],
      isEditMode: isEditMode
    }
    let includesBilling
    if (connectorInfo?.spec?.featuresEnabled) {
      includesBilling = connectorInfo?.spec?.featuresEnabled.includes('BILLING')
    }
    try {
      const uniqueConnectorFilterParams: ConnectorFilterProperties = { ...filterParams }
      const curReportExistFilterParams: ConnectorFilterProperties = { ...filterParams }
      uniqueConnectorFilterParams.ccmConnectorFilter = {
        awsAccountId: formData.awsAccountId
      }
      curReportExistFilterParams.ccmConnectorFilter = {
        featuresEnabled: ['BILLING']
      }

      const response = await fetchConnectors(uniqueConnectorFilterParams)

      if (response.status == 'SUCCESS') {
        if (response?.data?.pageItemCount == 0 || isEditMode) {
          //No Connectors on AwsAccountId

          const curResponse = await fetchConnectors(curReportExistFilterParams)
          if (curResponse.status == 'SUCCESS') {
            if (curResponse?.data?.pageItemCount == 0 || includesBilling) {
              nextStep?.(payload)
            } else {
              const existingCurReports: ExistingCURDetails[] =
                curResponse.data?.content?.map(ele => ({
                  awsAccountId: ele.connector?.spec.awsAccountId,
                  s3BucketName: ele.connector?.spec?.curAttributes.s3BucketName,
                  reportName: ele.connector?.spec?.curAttributes.reportName
                })) || []
              payload.existingCurReports = existingCurReports
              nextStep?.(payload)
            }
          } else {
            throw response as Failure
          }
        } else {
          setAwsAccountID(formData?.awsAccountId)
          setIsUniqueConnnector(false)
          setExistingConnectorName(response?.data?.content?.[0]?.connector?.name || '')
          setExistingConnectorId(response?.data?.content?.[0]?.connector?.identifier || '')
          const featuresEnabled = response?.data?.content?.[0]?.connector?.spec?.featuresEnabled || []
          let newFeatureText = featuresEnabled.join(' and ')
          if (featuresEnabled.length > 2) {
            featuresEnabled.push(`and ${featuresEnabled.pop()}`)
            newFeatureText = featuresEnabled.join(', ')
          }
          setFeatureText(newFeatureText)
        }
      } else {
        throw response as Failure
      }
      setIsLoading(false)
    } catch (error) {
      modalErrorHandler?.showDanger('Error')
    }
  }

  const getInitialValues = () => {
    return {
      ...pick(connectorInfo, ['name', 'identifier', 'description', 'tags']),
      ...pick(prevStepData, ['name', 'identifier', 'description', 'tags']),
      awsAccountId: prevStepData?.spec?.awsAccountId || connectorInfo?.spec?.awsAccountId || ''
    }
  }

  const { trackEvent } = useTelemetry()
  useTrackEvent(ConnectorActions.OverviewLoad, {
    category: Category.CONNECTOR,
    connector_type: Connectors.CENGAWS
  })

  return (
    <Layout.Vertical className={css.stepContainer}>
      <Text
        font={{ variation: FontVariation.H3 }}
        tooltipProps={{ dataTooltipId: 'awsConnectorOverview' }}
        margin={{ bottom: 'large' }}
        data-cy="aws-overview"
      >
        {getString('connectors.ceAws.overview.heading')}
      </Text>
      <div style={{ flex: 1 }}>
        <Formik<OverviewDetails>
          formName="connectorsCeAwsOverViewForm"
          initialValues={getInitialValues() as OverviewDetails}
          validationSchema={Yup.object().shape({
            name: NameSchema(),
            identifier: IdentifierSchema(),
            awsAccountId: Yup.number()
              .typeError(getString('connectors.ceAws.overview.validation.numeric'))
              .positive(getString('connectors.ceAws.overview.validation.positive'))
              .required(getString('connectors.ceAws.overview.validation.required'))
          })}
          onSubmit={values => {
            trackEvent(ConnectorActions.OverviewSubmit, {
              category: Category.CONNECTOR,
              connector_type: Connectors.CENGAWS
            })
            handleSubmit(values)
          }}
        >
          {() => (
            <FormikForm>
              <ModalErrorHandler bind={setModalErrorHandler} />
              <Container className={css.main}>
                <div style={{ width: '65%' }}>
                  <FormInput.InputWithIdentifier
                    inputLabel={getString('connectors.name')}
                    isIdentifierEditable={!isEditMode}
                  />
                </div>
                <FormInput.Text
                  className={css.dataFields}
                  name={'awsAccountId'}
                  label={getString('connectors.ceAws.overview.awsAccountId')}
                  tooltipProps={{ dataTooltipId: 'awsAccountId' }}
                />
                <Description />
                <Tags />
              </Container>
              {!isUniqueConnnector && (
                <div className={css.connectorExistBox}>
                  <Layout.Vertical spacing="large">
                    <div style={{ color: 'red' }}>
                      <Icon name="circle-cross" color="red700" style={{ paddingRight: 5 }}></Icon>
                      <span style={{ fontSize: 'var(--font-size-normal)' }}>
                        {getString('connectors.ceAws.overview.alreadyExist')}
                      </span>
                    </div>
                    <div>
                      <Icon name="info" style={{ paddingRight: 5 }}></Icon>
                      {getString('connectors.ceAws.overview.alreadyExistInfo', {
                        awsAccountID,
                        existingConnectorName,
                        featureText
                      })}
                    </div>
                    <div>
                      <Icon name="lightbulb" style={{ paddingRight: 5 }}></Icon>
                      {getString('connectors.ceAws.overview.trySuggestion')}
                      <div>
                        {getString('connectors.ceAws.overview.editConnector')}{' '}
                        <Link to={routes.toConnectorDetails({ accountId, connectorId: existingConnectorId })}>
                          {existingConnectorName}
                        </Link>{' '}
                        {getString('connectors.ceAws.overview.ifReq')}
                      </div>
                    </div>
                  </Layout.Vertical>
                </div>
              )}
              <Layout.Horizontal spacing="medium" className={css.buttonPanel}>
                <Button
                  type="submit"
                  intent="primary"
                  text={getString('continue')}
                  rightIcon="chevron-right"
                  disabled={isLoading}
                />
                {isLoading && <Icon name="spinner" size={24} color="blue500" />}
              </Layout.Horizontal>
            </FormikForm>
          )}
        </Formik>
      </div>
    </Layout.Vertical>
  )
}

export default OverviewStep
