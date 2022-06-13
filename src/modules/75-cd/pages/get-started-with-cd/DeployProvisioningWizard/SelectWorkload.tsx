/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useState } from 'react'

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
  ThumbnailSelect,
  Color
} from '@harness/uicore'
import type { FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'

import { WorkloadType, AllSaaSWorkloadProviders, deploymentTypes } from './Constants'

import css from './DeployProvisioningWizard.module.scss'

export interface SelectWorkloadRef {
  values: SelectWorkloadInterface
  setFieldTouched(field: keyof SelectWorkloadInterface & string, isTouched?: boolean, shouldValidate?: boolean): void
  validate: () => boolean
  showValidationErrors: () => void
}
export interface SelectWorkloadInterface {
  workloadType?: string
  deploymentType?: string
}

interface SelectWorkloadProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

const SelectWorkloadRef = (props: SelectWorkloadProps): React.ReactElement => {
  const { getString } = useStrings()
  const { disableNextBtn, enableNextBtn } = props
  const [workloadType, setWorkloadType] = useState<WorkloadType | undefined>()
  const formikRef = useRef<FormikContextType<SelectWorkloadInterface>>()

  return (
    <Layout.Vertical width="70%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.workloadDeploy')}</Text>
      <Formik<SelectWorkloadInterface>
        initialValues={{}}
        formName="ciInfraProvisiong-gitProvider"
        // validationSchema={getValidationSchema()}
        validateOnChange={true}
        onSubmit={(values: SelectWorkloadInterface) => Promise.resolve(values)}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Container
                padding={{ top: 'xxlarge', bottom: 'xxxlarge' }}
                className={cx({ [css.borderBottom]: workloadType })}
              >
                <CardSelect
                  data={AllSaaSWorkloadProviders}
                  cornerSelected={true}
                  className={css.icons}
                  cardClassName={css.workloadTypeCard}
                  renderItem={(item: WorkloadType) => (
                    <>
                      <Layout.Vertical flex>
                        <Icon
                          name={item.icon}
                          size={30}
                          flex
                          className={cx(
                            { [css.serviceIcon]: item.icon === 'services' },
                            { [css.gitlabIcon]: item.icon === 'service-serverless' },
                            { [css.bitbucketIcon]: item.icon === 'services' }
                          )}
                        />
                        <Text font={{ variation: FontVariation.SMALL_SEMI }} padding={{ top: 'small' }}>
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
              </Container>

              {workloadType?.label === 'services' ? (
                <Layout.Horizontal>
                  <Container padding={{ bottom: 'xxlarge' }}>
                    <Text font={{ variation: FontVariation.H5 }} padding={{ top: 'xlarge', bottom: 'xlarge' }}>
                      {getString('cd.getStartedWithCD.serviceDeploy')}
                    </Text>
                    <ThumbnailSelect
                      name="deploymentType"
                      items={deploymentTypes}
                      onChange={type => {
                        formikProps?.setFieldValue('deploymentType', type)
                      }}
                    ></ThumbnailSelect>
                    <Container padding={{ bottom: 'xxlarge' }}>
                      <Text font={{ variation: FontVariation.H5 }} padding={{ top: 'xlarge', bottom: 'xlarge' }}>
                        {getString('cd.getStartedWithCD.serviceHeading')}
                      </Text>
                      <Text color={Color.GREY_600} iconProps={{ size: 14 }} padding={{ bottom: 'xlarge' }}>
                        {getString('common.serviceName')}
                      </Text>
                      {/* <DropDown
                        filterable={false}
                        width={180}
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
