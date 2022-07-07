/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { isEmpty } from 'lodash-es'
import cx from 'classnames'
import { FormikForm, MultiTypeInputType, getMultiTypeFromValue, FormInput } from '@harness/uicore'
import { connect, FormikContextType } from 'formik'
import { useStrings } from 'framework/strings'
import { FormMultiTypeDurationField } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import type { AzureTrafficShiftData, AzureTrafficShiftProps } from './AzureTrafficShiftInterface.types'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

const isRuntime = (value: string): boolean => getMultiTypeFromValue(value) === MultiTypeInputType.RUNTIME

export function AzureTrafficShiftInputSetRef<T extends AzureTrafficShiftData = AzureTrafficShiftData>(
  props: AzureTrafficShiftProps<T> & { formik?: FormikContextType<any> }
): React.ReactElement {
  const { inputSetData, readonly, allowableTypes } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  return (
    <FormikForm>
      {
        /* istanbul ignore next */
        isRuntime(inputSetData?.template?.timeout as string) && (
          <div className={cx(stepCss.formGroup, stepCss.md)}>
            <FormMultiTypeDurationField
              label={getString('pipelineSteps.timeoutLabel')}
              name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}timeout`}
              disabled={readonly}
              multiTypeDurationProps={{
                enableConfigureOptions: false,
                allowableTypes,
                expressions,
                disabled: readonly
              }}
            />
          </div>
        )
      }
      {
        /* istanbul ignore next */
        isRuntime(inputSetData?.template?.spec?.traffic as string) && (
          <div className={cx(stepCss.formGroup, stepCss.md)}>
            <FormInput.MultiTextInput
              label={getString('pipeline.traffic')}
              name={`${isEmpty(inputSetData?.path) ? '' : `${inputSetData?.path}.`}traffic`}
              disabled={readonly}
              multiTextInputProps={{
                expressions,
                disabled: readonly,
                allowableTypes
              }}
            />
          </div>
        )
      }
    </FormikForm>
  )
}

const AzureTrafficShiftInputSet = connect(AzureTrafficShiftInputSetRef)
export default AzureTrafficShiftInputSet
