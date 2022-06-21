/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { FormInput, Layout, MultiTypeInputType } from '@harness/uicore'
import { Form, Formik, FormikContextType } from 'formik'
import React, { useRef } from 'react'
import { useStrings } from 'framework/strings'
import DragnDropPaths from '@pipeline/components/ManifestSelection/DragnDropPaths'
import { gitFetchTypeList, GitFetchTypes } from '../DeployProvisioningWizard/Constants'

export interface ProvideManifestRef {
  values: ProvideManifestInterface
  showValidationErrors: () => void
}
interface ProvideManifestInterface {
  manifestName?: string
  branch?: string | undefined
  commitId?: string | undefined
  gitFetchType?: 'Branch' | 'Commit'
  paths?: any
  valuesPath?: any
}

interface ProvideManifestProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

const ProvideManifestRef = (props: ProvideManifestProps): React.ReactElement => {
  const { getString } = useStrings()
  const { disableNextBtn, enableNextBtn } = props
  const formikRef = useRef<FormikContextType<ProvideManifestInterface>>()

  return (
    <Layout.Vertical width="70%">
      <Formik<ProvideManifestInterface>
        initialValues={{}}
        // formName="cdArtifact-provideManifest"
        validationSchema={{}}
        onSubmit={(values: ProvideManifestInterface) => Promise.resolve(values)}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Layout.Vertical width={320}>
                <div>
                  <FormInput.Text
                    name="identifier"
                    label={getString('pipeline.manifestType.manifestIdentifier')}
                    placeholder={getString('pipeline.manifestType.manifestPlaceholder')}
                  />
                </div>

                <div>
                  <FormInput.Select
                    name="gitFetchType"
                    label={getString('pipeline.manifestType.gitFetchTypeLabel')}
                    items={gitFetchTypeList}
                  />
                </div>
                {formikProps.values?.gitFetchType === GitFetchTypes.Branch ? (
                  <FormInput.Text
                    label={getString('pipelineSteps.deploy.inputSet.branch')}
                    placeholder={getString('pipeline.manifestType.branchPlaceholder')}
                    name="branch"
                  />
                ) : (
                  <FormInput.Text
                    label={getString('pipeline.manifestType.commitId')}
                    placeholder={getString('pipeline.manifestType.commitPlaceholder')}
                    name="commitId"
                  />
                )}
                <div>
                  <DragnDropPaths
                    formik={formikProps}
                    expressions={[]}
                    allowableTypes={[MultiTypeInputType.FIXED]}
                    fieldPath="paths"
                    pathLabel={getString('fileFolderPathText')}
                    placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
                  />
                </div>
                <div>
                  <DragnDropPaths
                    formik={formikProps}
                    fieldPath="valuesPaths"
                    pathLabel={getString('pipeline.manifestType.valuesYamlPath')}
                    placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
                    expressions={[]}
                    allowableTypes={[MultiTypeInputType.FIXED]}
                  />
                </div>
              </Layout.Vertical>
            </Form>
          )
        }}
      </Formik>
    </Layout.Vertical>
  )
}

export const ProvideManifest = React.forwardRef(ProvideManifestRef)
