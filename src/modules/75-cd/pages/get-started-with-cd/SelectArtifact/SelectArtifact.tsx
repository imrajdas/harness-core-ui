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
  Collapse
} from '@harness/uicore'
import type { FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'

import { ArtifactProviders, ArtifactType, Hosting } from '../DeployProvisioningWizard/Constants'

import { SelectGitProvider } from './SelectGitProvider'
import { SelectRepository } from './SelectRepository'
import { ProvideManifest } from './ProvideManifest'
import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'

export interface SelectArtifactRef {
  values: SelectArtifactInterface
  setFieldTouched(field: keyof SelectArtifactInterface & string, isTouched?: boolean, shouldValidate?: boolean): void
  validate: () => boolean
  showValidationErrors: () => void
}
export interface SelectArtifactInterface {
  artifactType?: ArtifactType
}

interface SelectArtifactProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

// const collapseProps = {
//   collapsedIcon: 'main-chevron-right' as IconName,
//   expandedIcon: 'main-chevron-down' as IconName,
//   iconProps: { size: 16 } as IconProps,
//   // className: 'a',
//   isRemovable: false
// }

const SelectArtifactRef = (props: SelectArtifactProps): React.ReactElement => {
  const { getString } = useStrings()
  const { disableNextBtn, enableNextBtn } = props
  const [artifactType, setArtifactType] = useState<ArtifactType | undefined>()
  const formikRef = useRef<FormikContextType<SelectArtifactInterface>>()
  const [disableBtn, setDisableBtn] = useState<boolean>(false)
  useEffect(() => {
    if (artifactType) {
      enableNextBtn()
    } else {
      disableNextBtn()
    }
  }, [artifactType])

  return (
    <Layout.Vertical width="70%">
      <Text font={{ variation: FontVariation.H4 }}>{getString('cd.getStartedWithCD.artifactLocation')}</Text>
      <Formik<SelectArtifactInterface>
        formName="cdRepo"
        initialValues={{}}
        validateOnChange={true}
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
                  renderItem={(item: ArtifactType) => {
                    const { icon, label, details } = item
                    return (
                      <Layout.Vertical height="100%" flex={{ justifyContent: 'space-between' }}>
                        <Layout.Vertical spacing="medium">
                          <Layout.Horizontal flex={{ justifyContent: 'flex-start' }} spacing="small">
                            <Icon name={icon} size={20} />
                            <Text font={{ variation: FontVariation.H5 }}>{getString(label)}</Text>
                          </Layout.Horizontal>
                          <Text font={{ variation: FontVariation.SMALL }}>{getString(details)}</Text>
                        </Layout.Vertical>
                      </Layout.Vertical>
                    )
                  }}
                  selected={artifactType}
                  onChange={(item: ArtifactType) => setArtifactType(item)}
                />
              </Container>

              <div>
                <Collapse
                  heading={
                    <div className={css.artifactSections}>
                      <Text font={{ variation: FontVariation.H5 }}>{getString('cd.getStartedWithCD.codeRepos')}</Text>
                    </div>
                  }
                >
                  <SelectGitProvider
                    disableNextBtn={() => setDisableBtn(true)}
                    enableNextBtn={() => setDisableBtn(false)}
                    selectedHosting={Hosting.SaaS}
                  ></SelectGitProvider>
                </Collapse>
              </div>

              <div>
                <Collapse
                  heading={
                    <div className={css.artifactSections}>
                      <Text font={{ variation: FontVariation.H5 }}>{getString('common.selectYourRepo')}</Text>
                    </div>
                  }
                >
                  <SelectRepository
                    disableNextBtn={() => setDisableBtn(true)}
                    enableNextBtn={() => setDisableBtn(false)}
                  ></SelectRepository>
                </Collapse>
              </div>
              <div>
                <Collapse
                  heading={
                    <div className={css.artifactSections}>
                      <Text font={{ variation: FontVariation.H5 }}>
                        {getString('cd.getStartedWithCD.provideManifest')}
                      </Text>
                    </div>
                  }
                >
                  <ProvideManifest
                    disableNextBtn={() => setDisableBtn(true)}
                    enableNextBtn={() => setDisableBtn(false)}
                  />
                </Collapse>
              </div>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const SelectArtifact = React.forwardRef(SelectArtifactRef)
