/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import * as Yup from 'yup'
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
  Color,
  FormError
} from '@harness/uicore'
import type { FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'

import { WorkloadType, deploymentTypes, ServiceDeploymentTypes, WorkloadProviders } from './Constants'

import css from './DeployProvisioningWizard.module.scss'

export interface SelectWorkloadRef {
  values: SelectWorkloadInterface
  setFieldTouched(field: keyof SelectWorkloadInterface & string, isTouched?: boolean, shouldValidate?: boolean): void
  validate: () => boolean
  showValidationErrors: () => void
}
export interface SelectWorkloadInterface {
  workloadType?: WorkloadType
  serviceDeploymentType?: ServiceDeploymentTypes
  serviceName: string
}

interface SelectWorkloadProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

const SelectWorkloadRef = (props: SelectWorkloadProps): React.ReactElement => {
  const { getString } = useStrings()
  const { disableNextBtn, enableNextBtn } = props
  const [workloadType, setWorkloadType] = useState<WorkloadType | undefined>()
  const [serviceDeploymentType, setServiceDeploymnetType] = useState<ServiceDeploymentTypes | undefined>()
  const formikRef = useRef<FormikContextType<SelectWorkloadInterface>>()

  useEffect(() => {
    if (workloadType) {
      enableNextBtn()
    } else {
      disableNextBtn()
    }
  }, [workloadType])

  return (
    <Layout.Vertical width="70%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.workloadDeploy')}</Text>
      <Formik<SelectWorkloadInterface>
        initialValues={{
          workloadType: undefined,
          serviceDeploymentType: undefined,
          serviceName: ''
        }}
        formName="cdWorkload-provider"
        validationSchema={Yup.object().shape({
          serviceName: Yup.string().required(
            getString('fieldRequired', {
              field: getString('common.serviceName')
            })
          )
        })}
        validateOnChange={true}
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
                        <Icon name={item.icon} size={45} flex className={css.workloadTypeIcon} />
                        <Text font={{ variation: FontVariation.BODY2 }} className={css.text}>
                          {getString(item.label)}
                        </Text>
                      </Layout.Vertical>
                    </>
                  )}
                  selected={workloadType}
                  onChange={(item: WorkloadType) => {
                    formikProps.setFieldValue('workloadType', item)
                    setWorkloadType(item)
                  }}
                />
                {formikProps.touched.workloadType && !formikProps.values.workloadType ? (
                  <Container padding={{ top: 'xsmall' }}>
                    <FormError
                      name={'workloadType'}
                      errorMessage={getString('fieldRequired', {
                        field: getString('cd.workloadRequired')
                      })}
                    />
                  </Container>
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
                            <Text font={{ variation: FontVariation.BODY2 }} className={css.text}>
                              {getString(item.label)}
                            </Text>
                          </Layout.Vertical>
                        </>
                      )}
                      selected={serviceDeploymentType}
                      onChange={(item: ServiceDeploymentTypes) => {
                        formikProps.setFieldValue('serviceDeploymentType', item)
                        setServiceDeploymnetType(item)
                      }}
                    />

                    {formikProps.touched.serviceDeploymentType && !formikProps.values.serviceDeploymentType ? (
                      <Container padding={{ top: 'xsmall' }}>
                        <FormError
                          name={'serviceDeploymentType'}
                          errorMessage={getString('fieldRequired', {
                            field: getString('deploymentTypeText')
                          })}
                        />
                      </Container>
                    ) : null}

                    <Container className={css.borderBottom} />
                    <Container padding={{ bottom: 'xxlarge' }}>
                      <Text font={{ variation: FontVariation.H5 }} padding={{ top: 'xlarge', bottom: 'xlarge' }}>
                        {getString('cd.getStartedWithCD.serviceHeading')}
                      </Text>
                      <Text color={Color.GREY_600} iconProps={{ size: 14 }} padding={{ bottom: 'xlarge' }}>
                        {getString('common.serviceName')}
                      </Text>
                      {/* <DropDown
                        filterable={false}
                        width={320}
                        icon={'main-sort'}
                        iconProps={{ size: 16, color: Color.GREY_400 }}
                        onChange={onChange()}
                        items={[]}
                      /> */}
                      {/* {disableNextBtn()} */}
                    </Container>
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
