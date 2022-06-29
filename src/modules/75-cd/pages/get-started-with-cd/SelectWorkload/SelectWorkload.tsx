/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'

import cx from 'classnames'
import {
  Text,
  FontVariation,
  Layout,
  CardSelect,
  Icon,
  Container,
  Formik,
  FormikForm as Form,
  FormError,
  FormInput
} from '@harness/uicore'
import type { FormikContextType } from 'formik'
import { get } from 'lodash-es'
import { useStrings } from 'framework/strings'

import {
  WorkloadType,
  deploymentTypes,
  ServiceDeploymentTypes,
  WorkloadProviders
} from '../DeployProvisioningWizard/Constants'

import { useCDOnboardingContext } from '../CDOnboardingStore'
import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'

export interface SelectWorkloadRef {
  values: SelectWorkloadInterface
  setFieldTouched(field: keyof SelectWorkloadInterface & string, isTouched?: boolean, shouldValidate?: boolean): void
  validate?: () => boolean
  showValidationErrors?: () => void
}
export interface SelectWorkloadInterface {
  workloadType?: WorkloadType
  serviceDeploymentType?: ServiceDeploymentTypes
  serviceRef: string
}
interface SelectWorkloadProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

export type SelectWorkloadForwardRef =
  | ((instance: SelectWorkloadRef | null) => void)
  | React.MutableRefObject<SelectWorkloadRef | null>
  | null

const SelectWorkloadRef = (props: SelectWorkloadProps, forwardRef: SelectWorkloadForwardRef): React.ReactElement => {
  const { getString } = useStrings()
  const { disableNextBtn, enableNextBtn } = props
  const {
    state: { service: serviceData }
  } = useCDOnboardingContext()
  const [workloadType, setWorkloadType] = useState<WorkloadType | undefined>(
    WorkloadProviders.find((item: WorkloadType) => item.value === serviceData?.data?.workload)
  )
  const [serviceDeploymentType, setServiceDeploymnetType] = useState<ServiceDeploymentTypes | undefined>(
    deploymentTypes.find(item => item.value === serviceData?.serviceDefinition?.type)
  )

  const formikRef = useRef<FormikContextType<SelectWorkloadInterface>>()

  // const validateWorkloadSetup = React.useCallback((): boolean => {
  //   const { serviceRef } = formikRef.current?.values || {}

  //   if (serviceRef) {
  //     return !!serviceRef
  //   }
  //   return false
  // }, [])
  const setForwardRef = ({ values, setFieldTouched }: Omit<SelectWorkloadRef, 'validate'>): void => {
    if (!forwardRef) {
      return
    }
    if (typeof forwardRef === 'function') {
      return
    }

    if (values) {
      forwardRef.current = {
        values,
        setFieldTouched: setFieldTouched
        // validate: validateWorkloadSetup
      }
    }
  }

  useEffect(() => {
    if (formikRef.current?.values?.workloadType && formikRef?.current?.values?.serviceDeploymentType) {
      enableNextBtn()
    } else {
      disableNextBtn()
    }
  }, [formikRef.current?.values])

  useEffect(() => {
    if (formikRef.current?.values && formikRef.current?.setFieldTouched) {
      setForwardRef({
        values: formikRef.current.values,
        setFieldTouched: formikRef.current.setFieldTouched
      })
    }
  }, [formikRef?.current?.values, formikRef?.current?.setFieldTouched])

  return (
    <Layout.Vertical width="70%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.workloadDeploy')}</Text>
      <Formik<SelectWorkloadInterface>
        initialValues={{
          workloadType: get(serviceData, 'data.workload') || undefined,
          serviceDeploymentType: get(serviceData, 'serviceDefinition.type') || undefined,
          serviceRef: get(serviceData, 'name') || ''
        }}
        formName="cdWorkload-provider"
        onSubmit={(values: SelectWorkloadInterface) => Promise.resolve(values)}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Container padding={{ top: 'xxlarge', bottom: 'xxxlarge' }}>
                <CardSelect
                  data={WorkloadProviders}
                  cornerSelected={true}
                  className={css.icons}
                  cardClassName={css.workloadTypeCard}
                  renderItem={(item: WorkloadType) => (
                    <>
                      <Layout.Vertical flex>
                        <Icon name={item.icon} size={25} flex className={css.workloadTypeIcon} />
                        <Text font={{ variation: FontVariation.BODY2 }} className={css.text}>
                          {getString(item.label)}
                        </Text>
                      </Layout.Vertical>
                    </>
                  )}
                  selected={workloadType}
                  onChange={(item: WorkloadType) => {
                    formikProps.setFieldValue('workloadType', item.value)
                    setWorkloadType(item)
                  }}
                />
                {formikProps.touched.workloadType && !formikProps.values.workloadType ? (
                  <FormError
                    name={'workloadType'}
                    errorMessage={getString('cd.workloadRequired')}
                    className={css.marginTop}
                  />
                ) : null}

                <Container className={cx({ [css.borderBottom]: workloadType })} />
              </Container>

              {workloadType?.label === 'services' ? (
                <Layout.Horizontal>
                  <Container padding={{ bottom: 'xxlarge' }}>
                    <Text font={{ variation: FontVariation.H5 }} padding={{ bottom: 'xlarge' }}>
                      {getString('cd.getStartedWithCD.serviceDeploy')}
                    </Text>
                    <CardSelect
                      data={deploymentTypes}
                      cornerSelected={true}
                      className={css.icons}
                      cardClassName={css.serviceDeploymentTypeCard}
                      renderItem={(item: WorkloadType) => (
                        <>
                          <Layout.Vertical flex>
                            <Icon name={item.icon} size={30} flex className={css.serviceDeploymentTypeIcon} />
                            <Text font={{ variation: FontVariation.BODY2 }} className={css.text1}>
                              {getString(item.label)}
                            </Text>
                          </Layout.Vertical>
                        </>
                      )}
                      selected={serviceDeploymentType}
                      onChange={(item: ServiceDeploymentTypes) => {
                        formikProps.setFieldValue('serviceDeploymentType', item.value)
                        setServiceDeploymnetType(item)
                      }}
                    />

                    {formikProps.touched.serviceDeploymentType &&
                    formikProps.values.serviceDeploymentType === undefined ? (
                      <FormError
                        name={'serviceDeploymentType'}
                        className={css.marginTop}
                        errorMessage={getString('fieldRequired', {
                          field: getString('deploymentTypeText')
                        })}
                      />
                    ) : null}

                    {serviceDeploymentType ? (
                      <>
                        <Container className={css.borderBottom} />
                        <Container padding={{ bottom: 'xsmall' }}>
                          <Text font={{ variation: FontVariation.H5 }} padding={{ top: 'xxlarge', bottom: 'xlarge' }}>
                            {getString('cd.getStartedWithCD.serviceHeading')}
                          </Text>

                          <FormInput.Text
                            tooltipProps={{ dataTooltipId: 'specifyYourService' }}
                            label={getString('common.serviceName')}
                            name="serviceRef"
                            className={css.formInput}
                          />
                          {formikProps.values.serviceRef === '' ? (
                            <FormError
                              name={'serviceRef'}
                              errorMessage={getString('fieldRequired', {
                                field: getString('common.serviceName')
                              })}
                            />
                          ) : null}
                        </Container>
                      </>
                    ) : null}
                  </Container>
                </Layout.Horizontal>
              ) : null}
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const SelectWorkload = React.forwardRef(SelectWorkloadRef)
