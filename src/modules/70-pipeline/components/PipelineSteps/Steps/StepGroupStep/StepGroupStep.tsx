/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { IconName, Formik, FormInput } from '@wings-software/uicore'
import * as Yup from 'yup'
import cx from 'classnames'
import type { FormikProps } from 'formik'
import { NameSchema } from '@common/utils/Validation'
import type { StepViewType, StepProps, StepFormikFowardRef } from '@pipeline/components/AbstractSteps/Step'
import { setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import type { StepGroupElementConfig } from 'services/cd-ng'
import { StepType } from '@pipeline/components/PipelineSteps/PipelineStepInterface'
import { PipelineStep } from '@pipeline/components/PipelineSteps/PipelineStep'
import { useStrings } from 'framework/strings'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface StepGroupWidgetProps {
  initialValues: StepGroupElementConfig
  isNewStep?: boolean
  onUpdate?: (data: StepGroupElementConfig) => void
  stepViewType?: StepViewType
}

function StepGroupWidget(
  props: StepGroupWidgetProps,
  formikRef: StepFormikFowardRef<StepGroupElementConfig>
): React.ReactElement {
  const { initialValues, onUpdate, isNewStep = true } = props
  const { getString } = useStrings()
  return (
    <>
      <Formik<StepGroupElementConfig>
        onSubmit={values => {
          onUpdate?.(values)
        }}
        formName="stepGroup"
        initialValues={initialValues}
        validationSchema={Yup.object().shape({
          name: NameSchema()
        })}
      >
        {(formik: FormikProps<StepGroupElementConfig>) => {
          setFormikRef(formikRef, formik)
          return (
            <div className={cx(stepCss.formGroup, stepCss.md)}>
              <FormInput.InputWithIdentifier inputLabel={getString('name')} isIdentifierEditable={isNewStep} />
            </div>
          )
        }}
      </Formik>
    </>
  )
}
const StepGroupWidgetRef = React.forwardRef(StepGroupWidget)
export class StepGroupStep extends PipelineStep<StepGroupElementConfig> {
  renderStep(props: StepProps<StepGroupElementConfig>): JSX.Element {
    const { initialValues, onUpdate, stepViewType, formikRef, isNewStep } = props

    return (
      <StepGroupWidgetRef
        initialValues={initialValues}
        onUpdate={onUpdate}
        isNewStep={isNewStep}
        stepViewType={stepViewType}
        ref={formikRef}
      />
    )
  }

  constructor() {
    super()
    this._hasDelegateSelectionVisible = true
  }
  validateInputSet(): Record<string, any> {
    return {}
  }
  protected type = StepType.StepGroup
  protected stepName = 'Step Group'
  protected stepIcon: IconName = 'step-group'
  protected stepPaletteVisible = false

  protected defaultValues: StepGroupElementConfig = {
    identifier: '',
    name: '',
    steps: []
  }
}
