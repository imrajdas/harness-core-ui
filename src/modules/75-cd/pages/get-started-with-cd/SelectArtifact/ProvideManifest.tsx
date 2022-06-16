/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { FormInput, Layout } from '@harness/uicore'
import { Form, Formik } from 'formik'
import React from 'react'
import { useStrings } from 'framework/strings'
import { gitFetchTypeList } from '../DeployProvisioningWizard/Constants'

interface ProvideManifestProps {
  manifestName?: string
  branch?: string | undefined
  commitId?: string | undefined
  gitFetchType?: 'Branch' | 'Commit'
}
export const ProvideManifest = (): //   props: ProvideManifestProps
// forwardRef: SelectGitProviderForwardRef
React.ReactElement => {
  const { getString } = useStrings()

  return (
    <Layout.Vertical width="70%">
      <Formik
        initialValues={{}}
        formName="cdArtifact-provideManifest"
        validationSchema={{}}
        onSubmit={(values: ProvideManifestProps) => Promise.resolve(values)}
      >
        {formikProps => (
          <Form>
            <Layout.Vertical
              flex={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
              // className={css.manifestForm}
            >
              <div>
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
              </div>
            </Layout.Vertical>
          </Form>
        )}
      </Formik>
    </Layout.Vertical>
  )
}
