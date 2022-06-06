/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef, useState } from 'react'

import cx from 'classnames'
import { Text, FontVariation, Layout, CardSelect, Icon, Container, Formik, FormikForm as Form } from '@harness/uicore'
import type { FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'

import {
  GitAuthenticationMethod,
  Hosting,
  WorkloadProvider,
  AllSaaSWorkloadProviders,
  AllOnPremWorkloadProviders
} from './Constants'

import css from './DeployProvisioningWizard.module.scss'

export interface SelectGitProviderRef {
  values: SelectGitProviderInterface
  setFieldTouched(field: keyof SelectGitProviderInterface & string, isTouched?: boolean, shouldValidate?: boolean): void
  validate: () => boolean
  showValidationErrors: () => void
  // validatedConnector?: ConnectorInfoDTO
  // validatedSecret?: SecretDTOV2
}

export type SelectGitProviderForwardRef =
  | ((instance: SelectGitProviderRef | null) => void)
  | React.MutableRefObject<SelectGitProviderRef | null>
  | null

interface SelectWorkloadProviderProps {
  selectedHosting?: Hosting
  disableNextBtn: () => void
  enableNextBtn: () => void
}

export interface SelectGitProviderInterface {
  url?: string
  accessToken?: string
  username?: string
  applicationPassword?: string
  accessKey?: string
  gitAuthenticationMethod?: GitAuthenticationMethod
  gitProvider?: WorkloadProvider
}

const SelectWorkloadRef = (
  props: SelectWorkloadProviderProps
  //   forwardRef: SelectGitProviderForwardRef
): React.ReactElement => {
  const { selectedHosting } = props
  const { getString } = useStrings()
  const formikRef = useRef<FormikContextType<SelectGitProviderInterface>>()
  const [workloadProvider] = useState<WorkloadProvider | undefined>()
  return (
    <Layout.Vertical width="70%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.workloadDeploy')}</Text>
      <Formik<SelectGitProviderInterface>
        initialValues={
          {
            //   ...getInitialValues(),
            //   gitProvider: undefined,
            //   gitAuthenticationMethod: undefined
          }
        }
        formName="ciInfraProvisiong-gitProvider"
        // validationSchema={getValidationSchema()}
        validateOnChange={true}
        onSubmit={(values: SelectGitProviderInterface) => Promise.resolve(values)}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Container
                padding={{ top: 'xxlarge', bottom: 'xxxlarge' }}
                className={cx({ [css.borderBottom]: workloadProvider })}
              >
                <CardSelect
                  data={selectedHosting === Hosting.SaaS ? AllSaaSWorkloadProviders : AllOnPremWorkloadProviders}
                  cornerSelected={true}
                  className={css.icons}
                  cardClassName={css.gitProviderCard}
                  renderItem={(item: WorkloadProvider) => (
                    <>
                      <Layout.Vertical flex>
                        <Icon
                          name={item.icon}
                          size={30}
                          flex
                          className={cx(
                            { [css.serviceIcon]: item.icon === 'services' },
                            { [css.gitlabIcon]: item.icon === 'service-serverless' },
                            { [css.bitbucketIcon]: item.icon === 'services' },
                            { [css.genericGitIcon]: item.icon === 'service-github' }
                          )}
                        />
                        <Text font={{ variation: FontVariation.SMALL_SEMI }} padding={{ top: 'small' }}>
                          {getString(item.label)}
                        </Text>
                      </Layout.Vertical>
                    </>
                  )}
                  selected={workloadProvider}
                  onChange={() => {
                    // formikProps.setFieldValue('gitProvider', item)
                    // setGitProvider(item)
                    // setTestConnectionStatus(TestStatus.NOT_INITIATED)
                    // resetFormFields()
                    // setAuthMethod(undefined)
                  }}
                />
              </Container>
              <Container padding={{ top: 'large', bottom: 'xxxlarge' }} className={css.borderBottom}></Container>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const SelectWorkload = React.forwardRef(SelectWorkloadRef)
