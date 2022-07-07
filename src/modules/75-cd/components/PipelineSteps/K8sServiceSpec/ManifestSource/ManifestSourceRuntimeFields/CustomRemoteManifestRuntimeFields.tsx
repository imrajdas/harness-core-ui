/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { FormInput } from '@harness/uicore'
import type { ManifestSourceRenderProps } from '@cd/factory/ManifestSourceFactory/ManifestSourceBase'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'
import { MonacoTextField } from '@common/components/MonacoTextField/MonacoTextField'
import MultiTypeDelegateSelector from '@common/components/MultiTypeDelegateSelector/MultiTypeDelegateSelector'
import { isFieldRuntime } from '../../K8sServiceSpecHelper'
import { isFieldfromTriggerTabDisabled } from '../ManifestSourceUtils'
import css from '../../KubernetesManifests/KubernetesManifests.module.scss'

const CustomRemoteManifestRuntimeFields = ({
  template,
  path,
  manifestPath,
  manifest,
  fromTrigger,
  allowableTypes,
  projectIdentifier,
  orgIdentifier,
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
      {isFieldRuntime(`${manifestPath}.spec.store.spec.filePath`, template) && (
        <div className={css.verticalSpacingInput}>
          <FormInput.MultiTextInput
            disabled={isFieldDisabled(`${manifestPath}.spec.store.spec.filePath`)}
            name={`${path}.${manifestPath}.spec.store.spec.filePath`}
            multiTextInputProps={{
              expressions,
              allowableTypes
            }}
            label={getString('pipeline.manifestType.customRemoteExtractedFileLocation')}
          />
        </div>
      )}
      {isFieldRuntime(`${manifestPath}.spec.store.spec.extractionScript`, template) && (
        <div className={css.verticalSpacingInput}>
          <MultiTypeFieldSelector
            name={'extractionScript'}
            label={getString('pipeline.manifestType.customRemoteExtractionScript')}
            allowedTypes={allowableTypes}
            style={{ width: 450 }}
            skipRenderValueInExpressionLabel
            expressionRender={() => (
              <MonacoTextField
                name={'extractionScript'}
                expressions={expressions}
                height={80}
                fullScreenAllowed
                fullScreenTitle={getString('pipeline.manifestType.customRemoteExtractionScript')}
              />
            )}
          >
            <MonacoTextField
              name={'extractionScript'}
              expressions={expressions}
              height={80}
              fullScreenAllowed
              fullScreenTitle={getString('pipeline.manifestType.customRemoteExtractionScript')}
            />
          </MultiTypeFieldSelector>
        </div>
      )}
      {isFieldRuntime(`${manifestPath}.spec.store.spec.delegateSelectors`, template) && (
        <div className={css.verticalSpacingInput}>
          <MultiTypeDelegateSelector
            expressions={expressions}
            inputProps={{ projectIdentifier, orgIdentifier }}
            allowableTypes={allowableTypes}
            name={`${path}.spec.store.spec.delegateSelectors`}
            disabled={readonly}
          />
        </div>
      )}
    </>
  )
}
export default CustomRemoteManifestRuntimeFields
