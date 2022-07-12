/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import {
  Text,
  FontVariation,
  Layout,
  CardSelect,
  Icon,
  Container,
  Formik,
  FormikForm as Form,
  Accordion,
  FormInput,
  FormError,
  useToaster,
  PageSpinner,
  getErrorInfoFromErrorObject
} from '@harness/uicore'
import type { FormikContextType, FormikProps } from 'formik'
import { get, set } from 'lodash-es'
import produce from 'immer'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'

import {
  InfrastructureRequestDTO,
  InfrastructureRequestDTORequestBody,
  ServiceRequestDTO,
  useCreateEnvironmentV2,
  useCreateInfrastructure
} from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { InfrastructureTypes, InfrastructureType } from '../DeployProvisioningWizard/Constants'
import {
  SelectAuthenticationMethod,
  SelectAuthenticationMethodInterface,
  SelectAuthenticationMethodRef
} from './SelectAuthenticationMethod'
import { useCDOnboardingContext } from '../CDOnboardingStore'
import { cleanEnvironmentDataUtil, getUniqueEntityIdentifier, newEnvironmentState } from '../cdOnboardingUtils'
import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'

export interface SelectInfrastructureRef {
  values: SelectInfrastructureInterface
  setFieldTouched(
    field: keyof SelectInfrastructureInterface & string,
    isTouched?: boolean,
    shouldValidate?: boolean
  ): void
  validate?: () => boolean
  showValidationErrors?: () => void
  authValues?: SelectAuthenticationMethodInterface
  submitForm?: FormikProps<SelectInfrastructureInterface>['submitForm']
}
export interface SelectInfrastructureInterface {
  infraType: string
  envId: string
  infraId: string
  namespace: string
}

interface SelectInfrastructureProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
  onSuccess?: () => void
}

export type SelectInfrastructureForwardRef =
  | ((instance: SelectInfrastructureRef | null) => void)
  | React.MutableRefObject<SelectInfrastructureRef | null>
  | null

const SelectInfrastructureRef = (
  props: SelectInfrastructureProps,
  forwardRef: SelectInfrastructureForwardRef
): React.ReactElement => {
  const { getString } = useStrings()
  const {
    saveEnvironmentData,
    saveInfrastructureData,
    state: { environment: environmentData, infrastructure: infrastructureData }
  } = useCDOnboardingContext()
  const [disableBtn, setDisableBtn] = useState<boolean>(false)
  const [infrastructureType, setInfrastructureType] = useState<InfrastructureType | undefined>(
    InfrastructureTypes.find((item: InfrastructureType) => item.value === infrastructureData?.type)
  )
  const formikRef = useRef<FormikContextType<SelectInfrastructureInterface>>()
  const selectAuthenticationMethodRef = React.useRef<SelectAuthenticationMethodRef | null>(null)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { getRBACErrorMessage } = useRBACError()
  // useEffect(() => {
  //   if (infrastructureType) enableNextBtn()
  //   else disableNextBtn()
  // })

  const { loading: createEnvLoading, mutate: createEnvironment } = useCreateEnvironmentV2({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  const openSetUpDelegateAccordion = (): boolean | undefined => {
    return selectAuthenticationMethodRef?.current?.validate()
  }

  const setForwardRef = ({ values, setFieldTouched }: Omit<SelectInfrastructureRef, 'validate'>): void => {
    if (!forwardRef) {
      return
    }
    if (typeof forwardRef === 'function') {
      return
    }

    if (values) {
      forwardRef.current = {
        values,
        setFieldTouched: setFieldTouched,
        // authValues: selectAuthenticationMethodRef?.current?.values
        // validate: validateInfraSetup
        submitForm: formikRef?.current?.submitForm
      }
    }
  }

  const { mutate: createInfrastructure } = useCreateInfrastructure({
    queryParams: {
      accountIdentifier: accountId
    }
  })

  useEffect(() => {
    if (formikRef.current?.values && formikRef.current?.setFieldTouched) {
      setForwardRef({
        values: formikRef.current.values,
        setFieldTouched: formikRef.current.setFieldTouched
      })
    }
  }, [formikRef?.current, formikRef?.current?.values, formikRef?.current?.setFieldTouched])

  const { showSuccess, showError, clear } = useToaster()
  const handleSubmit = async (values: SelectInfrastructureInterface): Promise<SelectInfrastructureInterface> => {
    const { envId, infraId, infraType, namespace } = values || {}
    if (!infraType) {
      showError(getString('common.validation.fieldIsRequired', { name: 'Infrastructure Type' }))
    } else if (!envId) {
      showError(getString('fieldRequired', { field: 'Environment' }))
    } else if (!infraId) {
      showError(getString('common.validation.fieldIsRequired', { name: 'Infrastructure' }))
    } else if (!namespace) {
      showError(getString('common.validation.fieldIsRequired', { name: 'Namespace' }))
    }
    const environmentIdentifier = getUniqueEntityIdentifier(envId as string)
    const updatedContextEnvironment = produce(newEnvironmentState.environment, draft => {
      set(draft, 'name', envId)
      set(
        draft,
        'identifier',
        // isEnvironmentNameUpdated ?
        environmentIdentifier
        // : get(environmentData, 'identifier')
      )
    })
    try {
      selectAuthenticationMethodRef?.current?.submitForm?.()?.then(async (authValues: any) => {
        const cleanEnvironmentData = cleanEnvironmentDataUtil(updatedContextEnvironment as ServiceRequestDTO)

        const response = await createEnvironment({ ...cleanEnvironmentData, orgIdentifier, projectIdentifier })
        if (response.status === 'SUCCESS') {
          clear()
          showSuccess(getString('cd.environmentCreated'))
          envId &&
            saveEnvironmentData({
              environment: updatedContextEnvironment,
              environmentResponse: response
            })
          const infraIdentifier = getUniqueEntityIdentifier(envId as string)
          const updatedContextInfra = produce(newEnvironmentState.infrastructure, draft => {
            set(draft, 'name', infraId)
            set(draft, 'identifier', getUniqueEntityIdentifier(infraId))
            set(draft, 'type', infraType)
            set(draft, 'environmentRef', envId)
            set(draft, 'infrastructureDefinition.spec.namespace', namespace)
            set(draft, 'infrastructureDefinition.spec.connectorRef', authValues?.identifier)
          })
          saveInfrastructureData({
            infrastructure: { ...updatedContextInfra }
          })
          const body: InfrastructureRequestDTORequestBody = {
            name: infraId,
            identifier: infraIdentifier,
            description: '',
            tags: {},
            orgIdentifier,
            projectIdentifier,
            type: infraType as InfrastructureRequestDTO['type'],
            environmentRef: environmentIdentifier
          }

          createInfrastructure({
            ...body,
            yaml: yamlStringify({
              infrastructureDefinition: {
                ...body,
                spec: get(infrastructureData, 'infrastructureDefinition.spec'),
                allowSimultaneousDeployments: false
              }
            })
          })
            .then(infraResponse => {
              if (infraResponse.status === 'SUCCESS') {
                showSuccess(
                  getString('cd.infrastructure.created', {
                    identifier: infraResponse.data?.infrastructure?.identifier
                  })
                )
              } else {
                throw infraResponse
              }
              props?.onSuccess?.()
            })
            .catch(e => {
              showError(getErrorInfoFromErrorObject(e))
            })

          return Promise.resolve(values)
        } else {
          throw response
        }
      })
    } catch (error: any) {
      showError(getRBACErrorMessage(error))
      return Promise.resolve({} as SelectInfrastructureInterface)
    }
    return Promise.resolve({} as SelectInfrastructureInterface)
  }

  const borderBottom = <div className={css.repoborderBottom} />

  if (createEnvLoading) {
    return <PageSpinner />
  }

  return (
    <Layout.Vertical width="80%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.workloadDeploy')}</Text>
      <Formik<SelectInfrastructureInterface>
        initialValues={{
          infraType: get(infrastructureData, 'type') || '',
          envId: get(environmentData, 'name') || '',
          infraId: get(infrastructureData, 'name') || '',
          namespace: get(infrastructureData, 'infrastructureDefinition.spec.namespace') || ''
        }}
        formName="cdInfrastructure"
        onSubmit={handleSubmit}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Container padding={{ top: 'xxlarge', bottom: 'xxxlarge' }}>
                <CardSelect
                  data={InfrastructureTypes}
                  cornerSelected={true}
                  className={css.icons}
                  cardClassName={css.serviceDeploymentTypeCard}
                  renderItem={(item: InfrastructureType) => (
                    <>
                      <Layout.Vertical flex>
                        <Icon name={item.icon} size={30} flex className={css.serviceDeploymentTypeIcon} />

                        <Text font={{ variation: FontVariation.SMALL_SEMI }} padding={{ top: 'xxlarge' }} width={78}>
                          {getString(item.label)}
                        </Text>
                      </Layout.Vertical>
                    </>
                  )}
                  selected={infrastructureType}
                  onChange={(item: InfrastructureType) => {
                    formikProps.setFieldValue('infraType', item.value)
                    setInfrastructureType(item)
                  }}
                />
                {formikProps.touched.infraType && !formikProps.values.infraType ? (
                  <FormError
                    className={css.marginTop}
                    name={'infraType'}
                    errorMessage={getString('common.getStarted.plsChoose', {
                      field: `${getString('infrastructureText')}`
                    })}
                  />
                ) : null}
              </Container>
              <Layout.Vertical padding={{ top: 'xxlarge', bottom: 'xxlarge' }}>
                <FormInput.Text
                  tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
                  label={getString('cd.getStartedWithCD.envName')}
                  name="envId"
                  className={css.formInput}
                />
                <FormInput.Text
                  // tooltipProps={{ dataTooltipId: 'specifyYourEnvironment' }}
                  label={getString('infrastructureText')}
                  name="infraId"
                  className={css.formInput}
                />
                <FormInput.Text
                  tooltipProps={{ dataTooltipId: 'gcpInfraNamespace' }}
                  label={getString('common.namespace')}
                  placeholder={getString('pipeline.infraSpecifications.namespacePlaceholder')}
                  name="namespace"
                  className={css.formInput}
                />
              </Layout.Vertical>
              {borderBottom}
              {infrastructureType &&
              formikRef?.current?.values?.envId &&
              formikRef?.current?.values?.infraId &&
              formikRef?.current?.values?.namespace ? (
                <Accordion className={css.accordion} activeId={infrastructureType ? 'authMethod' : 'setUpDelegate'}>
                  <Accordion.Panel
                    id="authMethod"
                    summary={
                      <Layout.Horizontal width={500}>
                        <Text font={{ variation: FontVariation.H5 }}>{'Connect to your Kubernetes cluster'}</Text>
                        {openSetUpDelegateAccordion() ? (
                          <Icon name="success-tick" size={20} className={css.accordionStatus} />
                        ) : (
                          <Icon name="danger-icon" size={20} className={css.accordionStatus} />
                        )}
                      </Layout.Horizontal>
                    }
                    details={
                      <SelectAuthenticationMethod
                        ref={selectAuthenticationMethodRef}
                        onSuccess={data => {
                          return data
                        }}
                        disableNextBtn={() => setDisableBtn(true)}
                        enableNextBtn={() => setDisableBtn(disableBtn)}
                      ></SelectAuthenticationMethod>
                    }
                  />
                </Accordion>
              ) : null}
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const SelectInfrastructure = React.forwardRef(SelectInfrastructureRef)
