/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Layout, Container, CardSelect, Text, CardBody, FormError } from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import type { IconName } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import { delegateInstaller } from '../DelegateSetupStep.constants'
import type { DelegateInstallerDetails } from '../DelegateSetupStep.types'

export interface FormikForSelectDelegateType {
  delegateType: string
}

interface SelectDelegateTypeProps {
  formikProps?: FormikProps<FormikForSelectDelegateType>
}

const getDelegateType = (delegateType: string | undefined) => {
  return delegateInstaller.find(item => item.value === delegateType)
}

const SelectDelegateType = (props: SelectDelegateTypeProps): JSX.Element => {
  const { formikProps } = props
  const { getString } = useStrings()
  const [selectedInstaller, setSelectedInstaller] = useState<DelegateInstallerDetails | undefined>(
    getDelegateType(formikProps?.values.delegateType)
  )
  return (
    <Container padding={{ top: 'medium', bottom: 'medium' }}>
      <Layout.Vertical spacing="medium">
        <Text>{getString('delegates.delegateCreation.installerText')}</Text>
        <CardSelect
          data={delegateInstaller}
          cornerSelected={true}
          selected={selectedInstaller}
          style={{ marginRight: 'medium' }}
          className="grid"
          renderItem={item => (
            <div style={{ marginRight: 'medium' }}>
              <CardBody.Icon icon={item.icon as IconName} iconSize={25}>
                <Text
                  font={{
                    size: 'small',
                    align: 'center'
                  }}
                  flex={{ justifyContent: 'center' }}
                >
                  {getString(item.text)}
                </Text>
              </CardBody.Icon>
            </div>
          )}
          onChange={item => {
            setSelectedInstaller(item)
            formikProps?.setFieldValue('delegateType', item.value)
          }}
        />
      </Layout.Vertical>
      {formikProps?.touched.delegateType && !formikProps?.values.delegateType ? (
        <Container padding={{ top: 'xsmall' }}>
          <FormError
            name={'delegateType'}
            errorMessage={getString('delegates.delegateCreation.installerSelectionRequired')}
          />
        </Container>
      ) : null}
    </Container>
  )
}

export default SelectDelegateType
