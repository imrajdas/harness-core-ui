/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { FormInput, Layout, MultiTypeInputType } from '@harness/uicore'
import { Form, FormikContextType, FormikProps } from 'formik'
import React, { useEffect, useRef } from 'react'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { useStrings } from 'framework/strings'
import DragnDropPaths from '@pipeline/components/ManifestSelection/DragnDropPaths'
import type { ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'
import { gitFetchTypeList, GitFetchTypes } from '../DeployProvisioningWizard/Constants'
// import css from '../DeployProvisioningWizard/DeployProvisioningWizard.module.scss'
export interface ProvideManifestRef {
  values: ProvideManifestInterface
  validate: () => boolean
  submitForm?: FormikProps<ProvideManifestInterface>['submitForm']
}
export interface ProvideManifestInterface {
  identifier?: string
  branch?: string | undefined
  commitId?: string | undefined
  gitFetchType?: 'Branch' | 'Commit'
  paths?: any
  valuesPaths?: any
}

interface ProvideManifestProps {
  initialValues: ManifestConfig
  disableNextBtn: () => void
  enableNextBtn: () => void
  onSuccess?: (value: ManifestConfigWrapper) => void
  formikProps: FormikProps<any>
}

export type ProvideManifestForwardRef =
  | ((instance: ProvideManifestRef | null) => void)
  | React.MutableRefObject<ProvideManifestRef | null>
  | null

const ProvideManifestRef = (props: ProvideManifestProps, forwardRef: ProvideManifestForwardRef): React.ReactElement => {
  const { getString } = useStrings()
  const {
    // disableNextBtn, enableNextBtn,
    formikProps
  } = props
  const formikRef = useRef<FormikContextType<ProvideManifestInterface>>()

  const validateProvideManifestDetails = React.useCallback((): any => {
    const { identifier } = formikRef?.current?.values || {}
    if (!identifier) return false
    return true
  }, [])

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
        validate: validateProvideManifestDetails,
        submitForm: formikRef?.current?.submitForm
      }
    }
  }

  useEffect(() => {
    if (formikRef.current?.values) {
      setForwardRef({
        values: formikRef.current.values
      })
    }
  }, [formikRef.current?.values])

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
            defaultValue={{ path: '', uuid: uuid('', nameSpace()) }}
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
            defaultValue={{ path: '', uuid: uuid('', nameSpace()) }}
          />
        </div>
      </Layout.Vertical>
    </Form>
  )
}

export const ProvideManifest = React.forwardRef(ProvideManifestRef)
