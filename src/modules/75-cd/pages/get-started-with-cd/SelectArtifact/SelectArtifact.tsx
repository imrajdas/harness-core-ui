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
  FormError
} from '@harness/uicore'
import type { FormikContextType } from 'formik'
// import cx from 'classnames'
import { useStrings } from 'framework/strings'
import type { SelectGitProviderRef } from './SelectGitProvider'
import { ArtifactProviders, ArtifactType, Hosting } from '../DeployProvisioningWizard/Constants'

import { SelectGitProvider } from './SelectGitProvider'
import { SelectRepository, SelectRepositoryRef } from './SelectRepository'
import { ProvideManifest, ProvideManifestRef } from './ProvideManifest'
import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'

export interface SelectArtifactRef {
  values: SelectArtifactInterface
  setFieldTouched(field: keyof SelectArtifactInterface & string, isTouched?: boolean, shouldValidate?: boolean): void
  validate?: () => boolean
  showValidationErrors?: () => void
}
export interface SelectArtifactInterface {
  artifactType?: ArtifactType
}

interface SelectArtifactProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

export type SelectArtifactForwardRef =
  | ((instance: SelectArtifactRef | null) => void)
  | React.MutableRefObject<SelectArtifactRef | null>
  | null

const SelectArtifactRef = (props: SelectArtifactProps, forwardRef: SelectArtifactForwardRef): React.ReactElement => {
  const { getString } = useStrings()
  // const { disableNextBtn, enableNextBtn } = props
  const [artifactType, setArtifactType] = useState<ArtifactType | undefined>()
  const formikRef = useRef<FormikContextType<SelectArtifactInterface>>()
  const [disableBtn, setDisableBtn] = useState<boolean>(false)
  const selectGitProviderRef = React.useRef<SelectGitProviderRef | null>(null)
  const selectRepositoryRef = React.useRef<SelectRepositoryRef | null>(null)
  const provideManifestRef = React.useRef<ProvideManifestRef | null>(null)

  const setForwardRef = ({
    values,
    setFieldTouched
  }: Omit<SelectArtifactRef, 'validate' | 'showValidationErrors'>): void => {
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
      }
    }
  }

  useEffect(() => {
    if (formikRef.current?.values && formikRef.current?.setFieldTouched) {
      setForwardRef({
        values: formikRef.current.values,
        setFieldTouched: formikRef.current.setFieldTouched
      })
    }
  }, [formikRef?.current?.values, formikRef?.current?.setFieldTouched])

  const openSelectRepoAccordion = (): boolean | undefined => {
    const { validate } = selectGitProviderRef.current || {}
    return validate?.()
  }
  // useEffect(() => {
  //   if (!selectGitProviderRef.current?.validate?.()) {
  //     disableNextBtn()
  //   } else {
  //     enableNextBtn()
  //   }
  // }, [selectGitProviderRef.current?.validate?.()])

  const openProvideManifestAccordion = (): boolean | undefined => {
    if (selectRepositoryRef.current?.repository && selectGitProviderRef?.current?.validatedConnector?.spec) {
      return true
    } else {
      return false
    }
  }

  // useEffect(() => {
  //   if (provideManifestRef?.current?.validate) {
  //     console.log('sdfgh')
  //   }
  // }, [provideManifestRef?.current?.values])

  const isActiveAccordion: boolean = artifactType ? true : false
  return (
    <Layout.Vertical width="80%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.artifactLocation')}</Text>
      <Formik<SelectArtifactInterface>
        formName="cdRepo"
        initialValues={{
          artifactType: undefined
        }}
        onSubmit={(values: SelectArtifactInterface) => Promise.resolve(values)}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Container padding={{ top: 'xxlarge', bottom: 'xxxlarge' }}>
                <CardSelect
                  cornerSelected={true}
                  data={ArtifactProviders}
                  cardClassName={css.artifactTypeCard}
                  renderItem={(item: ArtifactType) => (
                    <>
                      <Layout.Vertical height="100%" flex={{ justifyContent: 'space-between' }}>
                        <Layout.Vertical spacing="medium">
                          <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing="small">
                            <Icon name={item.icon} size={20} />
                            <Text font={{ variation: FontVariation.H5 }}>{getString(item.label)}</Text>
                          </Layout.Horizontal>
                          <Text font={{ variation: FontVariation.SMALL }}>{getString(item.details)}</Text>
                        </Layout.Vertical>
                      </Layout.Vertical>
                    </>
                  )}
                  selected={artifactType}
                  onChange={(item: ArtifactType) => {
                    formikProps.setFieldValue('artifactType', item)
                    setArtifactType(item)
                  }}
                />
                {formikProps.touched.artifactType && !formikProps.values.artifactType ? (
                  <FormError
                    name={'artifactType'}
                    errorMessage={getString('common.getStarted.plsChoose', {
                      field: `your ${getString('pipeline.artifactsSelection.artifactType')}`
                    })}
                  />
                ) : null}
              </Container>

              <div className={css.repoborderBottom} />

              {isActiveAccordion ? (
                <Accordion
                  className={css.accordion}
                  activeId={
                    isActiveAccordion
                      ? 'codeRepo'
                      : openSelectRepoAccordion()
                      ? 'selectYourRepo'
                      : openSelectRepoAccordion() && openProvideManifestAccordion()
                      ? 'provideManifest'
                      : ''
                  }
                >
                  <Accordion.Panel
                    id="codeRepo"
                    summary={
                      <Layout.Horizontal width={300}>
                        <Text font={{ variation: FontVariation.H5 }}>{getString('cd.getStartedWithCD.codeRepos')}</Text>

                        {openSelectRepoAccordion() ? <Icon name="success-tick" size={20} /> : null}
                      </Layout.Horizontal>
                    }
                    details={
                      <SelectGitProvider
                        ref={selectGitProviderRef}
                        disableNextBtn={() => setDisableBtn(true)}
                        enableNextBtn={() => setDisableBtn(false)}
                        selectedHosting={Hosting.SaaS}
                      ></SelectGitProvider>
                    }
                  />
                  <Accordion.Panel
                    id="selectYourRepo"
                    summary={
                      <Layout.Horizontal width={300}>
                        <Text font={{ variation: FontVariation.H5 }}>{getString('common.selectYourRepo')}</Text>
                        {openProvideManifestAccordion() ? <Icon name="success-tick" size={20} /> : null}
                      </Layout.Horizontal>
                    }
                    details={
                      <SelectRepository
                        ref={selectRepositoryRef}
                        validatedConnectorRef={selectGitProviderRef.current?.values?.gitProvider?.type}
                        disableNextBtn={() => setDisableBtn(true)}
                        enableNextBtn={() => setDisableBtn(false)}
                      ></SelectRepository>
                    }
                  />
                  <Accordion.Panel
                    id="provideManifest"
                    summary={
                      <Layout.Horizontal width={300}>
                        <Text font={{ variation: FontVariation.H5 }}>
                          {getString('cd.getStartedWithCD.provideManifest')}
                        </Text>
                        {/* <Icon name="success-tick" size={20} /> */}
                      </Layout.Horizontal>
                    }
                    details={
                      <ProvideManifest
                        ref={provideManifestRef}
                        disableNextBtn={() => setDisableBtn(true)}
                        enableNextBtn={() => setDisableBtn(false)}
                      />
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

export const SelectArtifact = React.forwardRef(SelectArtifactRef)
