/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Text, FontVariation, Layout, CardSelect, Icon, Container, Formik, FormikForm as Form } from '@harness/uicore'
import type { FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'

import { InfrastructureTypes, InfrastructureType } from '../DeployProvisioningWizard/Constants'

import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'

export interface SelectInfrastructureRef {
  values: SelectInfrastructureInterface
  setFieldTouched(
    field: keyof SelectInfrastructureInterface & string,
    isTouched?: boolean,
    shouldValidate?: boolean
  ): void
  validate: () => boolean
  showValidationErrors: () => void
}
export interface SelectInfrastructureInterface {
  infraType?: string
}

interface SelectInfrastructureProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

const SelectInfrastructureRef = (props: SelectInfrastructureProps): React.ReactElement => {
  const { getString } = useStrings()
  const { disableNextBtn, enableNextBtn } = props
  const [infrastructureType, setInfrastructureType] = useState<InfrastructureType | undefined>()
  const formikRef = useRef<FormikContextType<SelectInfrastructureInterface>>()

  useEffect(() => {
    if (infrastructureType) enableNextBtn()
    else disableNextBtn()
  })

  return (
    <Layout.Vertical width="70%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.workloadDeploy')}</Text>
      <Formik<SelectInfrastructureInterface>
        initialValues={{}}
        formName="cdInfrastructure"
        // validationSchema={getValidationSchema()}
        validateOnChange={true}
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
                  cardClassName={css.workloadTypeCard}
                  renderItem={(item: InfrastructureType) => (
                    <>
                      <Layout.Vertical flex>
                        <Icon name={item.icon} size={30} flex className={css.workloadTypeIcon} />

                        <Text font={{ variation: FontVariation.SMALL_SEMI }} padding={{ top: 'small' }}>
                          {getString(item.label)}
                        </Text>
                      </Layout.Vertical>
                    </>
                  )}
                  selected={infrastructureType}
                  onChange={(item: InfrastructureType) => {
                    formikProps.setFieldValue('infrastructureType', item)
                    setInfrastructureType(item)
                  }}
                />
              </Container>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const SelectInfrastructure = React.forwardRef(SelectInfrastructureRef)
