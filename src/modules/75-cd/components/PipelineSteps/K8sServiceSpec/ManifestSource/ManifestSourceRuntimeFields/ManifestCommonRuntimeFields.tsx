/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { ManifestSourceRenderProps } from '@cd/factory/ManifestSourceFactory/ManifestSourceBase'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { FileSelectList } from '@filestore/components/FileStoreList/FileStoreList'
import { SELECT_FILES_TYPE } from '@filestore/utils/constants'
import { isFieldRuntime } from '../../K8sServiceSpecHelper'
import { isFieldfromTriggerTabDisabled } from '../ManifestSourceUtils'
import css from '../../KubernetesManifests/KubernetesManifests.module.scss'

const ManifestCommonRuntimeFields = ({
  template,
  path,
  manifestPath,
  manifest,
  fromTrigger,
  readonly,
  formik,
  stageIdentifier
}: ManifestSourceRenderProps): React.ReactElement => {
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const isFieldDisabled = (fieldName: string): boolean => {
    // /* instanbul ignore else */
    if (readonly) {
      return true
    }
    return isFieldfromTriggerTabDisabled(
      fieldName,
      formik,
      stageIdentifier,
      manifest?.identifier as string,
      fromTrigger
    )
  }
  return (
    <>
      {isFieldRuntime(`${manifestPath}.spec.store.spec.files`, template) && (
        <div className={css.verticalSpacingInput}>
          <FileSelectList
            labelClassName={css.listLabel}
            label={getString('resourcePage.fileStore')}
            name={`${path}.${manifestPath}.spec.store.spec.files`}
            placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.files`)}
            style={{ marginBottom: 'var(--spacing-small)' }}
            expressions={expressions}
            isNameOfArrayType
            type={SELECT_FILES_TYPE.FILE_STORE}
            formik={formik}
          />
        </div>
      )}
    </>
  )
}
export default ManifestCommonRuntimeFields
