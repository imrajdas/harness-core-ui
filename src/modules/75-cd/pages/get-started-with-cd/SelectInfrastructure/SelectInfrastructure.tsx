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
  FormError
} from '@harness/uicore'
import type { FormikContextType } from 'formik'
import { get } from 'lodash-es'
import { useStrings } from 'framework/strings'

import { InfrastructureTypes, InfrastructureType } from '../DeployProvisioningWizard/Constants'
import { SelectAuthenticationMethod, SelectAuthenticationMethodRef } from './SelectAuthenticationMethod'
import { useCDOnboardingContext } from '../CDOnboardingStore'
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
    state: { environment: environmentData, infrastructure: infrastructureData }
  } = useCDOnboardingContext()
  const [disableBtn, setDisableBtn] = useState<boolean>(false)
  const [infrastructureType, setInfrastructureType] = useState<InfrastructureType | undefined>(
    InfrastructureTypes.find((item: InfrastructureType) => item.value === infrastructureData?.type)
  )
  const formikRef = useRef<FormikContextType<SelectInfrastructureInterface>>()
  const selectAuthenticationMethodRef = React.useRef<SelectAuthenticationMethodRef | null>(null)
  // useEffect(() => {
  //   if (infrastructureType) enableNextBtn()
  //   else disableNextBtn()
  // })

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
        setFieldTouched: setFieldTouched
        // authValues: selectAuthenticationMethodRef?.current?.values
        // validate: validateInfraSetup
      }
    }
  }

  console.log('FDD---', formikRef?.current?.values)
  useEffect(() => {
    if (formikRef.current?.values && formikRef.current?.setFieldTouched) {
      setForwardRef({
        values: formikRef.current.values,
        setFieldTouched: formikRef.current.setFieldTouched
      })
    }
  }, [formikRef?.current, formikRef?.current?.values, formikRef?.current?.setFieldTouched])

  const borderBottom = <div className={css.repoborderBottom} />
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
        onSubmit={(values: SelectInfrastructureInterface) => Promise.resolve(values)}
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
