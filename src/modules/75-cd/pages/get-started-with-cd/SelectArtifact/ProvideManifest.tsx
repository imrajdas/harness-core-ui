/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { FormError, FormInput, Layout, MultiTypeInputType } from '@harness/uicore'
import { Form, Formik, FormikContextType } from 'formik'
import React, { useEffect, useRef } from 'react'
import { useStrings } from 'framework/strings'
import DragnDropPaths from '@pipeline/components/ManifestSelection/DragnDropPaths'
import { gitFetchTypeList, GitFetchTypes } from '../DeployProvisioningWizard/Constants'
// import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'
export interface ProvideManifestRef {
  values: ProvideManifestInterface
  validate: () => boolean
}
interface ProvideManifestInterface {
  manifestName?: string
  branch?: string | undefined
  commitId?: string | undefined
  gitFetchType?: 'Branch' | 'Commit'
  paths?: any
  valuesPaths?: any
}

interface ProvideManifestProps {
  disableNextBtn: () => void
  enableNextBtn: () => void
}

export type ProvideManifestForwardRef =
  | ((instance: ProvideManifestRef | null) => void)
  | React.MutableRefObject<ProvideManifestRef | null>
  | null

const ProvideManifestRef = (props: ProvideManifestProps, forwardRef: ProvideManifestForwardRef): React.ReactElement => {
  const { getString } = useStrings()
  // const { disableNextBtn, enableNextBtn } = props
  const formikRef = useRef<FormikContextType<ProvideManifestInterface>>()

  const validateProvideManifestDetails = React.useCallback(
    (): any => {
      const { manifestName } = formikRef?.current?.values || {}

      if (!manifestName) return false
    },

    // return true
    []
  )

  const setForwardRef = ({ values }: Omit<ProvideManifestRef, 'validate'>): void => {
    if (!forwardRef) {
      return
    }
    if (typeof forwardRef === 'function') {
      return
    }

    if (values) {
      forwardRef.current = {
        values,
        validate: validateProvideManifestDetails
      }
    }
  }

  useEffect(() => {
    if (formikRef.current?.values && formikRef.current?.setFieldTouched) {
      setForwardRef({
        values: formikRef.current.values
      })
    }
  }, [formikRef.current?.values])

  return (
    <Layout.Vertical width="70%">
      <Formik<ProvideManifestInterface>
        initialValues={{
          manifestName: '',
          gitFetchType: 'Commit',
          commitId: '',
          branch: '',
          paths: [],
          valuesPaths: []
        }}
        onSubmit={(values: ProvideManifestInterface) => Promise.resolve(values)}
      >
        {formikProps => {
          formikRef.current = formikProps
          return (
            <Form>
              <Layout.Vertical width={320}>
                <div>
                  <FormInput.Text
                    name="manifestName"
                    label={getString('pipeline.manifestType.manifestIdentifier')}
                    placeholder={getString('pipeline.manifestType.manifestPlaceholder')}
                  />
                  {formikProps.touched.manifestName && !formikProps.values.manifestName ? (
                    <FormError
                      name={'manifestName'}
                      errorMessage={getString('validation.nameRequired')}
                      // className={css.formError}
                    />
                  ) : null}
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
                {formikProps.values?.gitFetchType === GitFetchTypes.Branch &&
                !formikProps.values.branch &&
                formikProps.touched.branch ? (
                  <FormError name={'branch'} errorMessage={getString('validation.branchName')} />
                ) : formikProps.values?.gitFetchType === GitFetchTypes.Commit &&
                  !formikProps.values.commitId &&
                  formikProps.touched.commitId ? (
                  <FormError name={'commitId'} errorMessage={getString('validation.commitId')} />
                ) : null}
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
