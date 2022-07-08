/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect } from 'react'
import { FormInput, MultiTypeInputType } from '@wings-software/uicore'
import type { FormikProps } from 'formik'
import cx from 'classnames'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useStrings } from 'framework/strings'
import type { ContinousVerificationData } from '@cv/components/PipelineSteps/ContinousVerification/types'
import { defaultDeploymentTag, VerificationTypes } from './constants'
import { BaselineSelect, Duration, VerificationSensitivity } from '../VerificationJobFields/VerificationJobFields'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

export default function ConfigureFields(props: {
  formik: FormikProps<ContinousVerificationData>
  allowableTypes: MultiTypeInputType[]
}): React.ReactElement {
  const {
    formik: { values: formValues, setFieldValue },
    formik,
    allowableTypes
  } = props
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()

  const renderConfigOptions = (): JSX.Element => {
    switch (formValues?.spec?.type) {
      case VerificationTypes.LoadTest:
        return (
          <>
            <div className={cx(stepCss.formGroup)}>
              <VerificationSensitivity
                label={getString('sensitivity')}
                name={`spec.spec.sensitivity`}
                expressions={expressions}
                formik={formik}
                allowableTypes={allowableTypes}
              />
            </div>
            <div className={cx(stepCss.formGroup)}>
              <Duration
                name={`spec.spec.duration`}
                label={getString('duration')}
                expressions={expressions}
                formik={formik}
                allowableTypes={allowableTypes}
              />
            </div>
            <div className={cx(stepCss.formGroup)}>
              <BaselineSelect
                name={`spec.spec.baseline`}
                label={getString('connectors.cdng.baseline')}
                expressions={expressions}
                formik={formik}
                allowableTypes={allowableTypes}
              />
            </div>
          </>
        )
      case VerificationTypes.Bluegreen:
      case VerificationTypes.Canary:
      case VerificationTypes.Rolling:
        return (
          <>
            <div className={cx(stepCss.formGroup)}>
              <VerificationSensitivity
                label={getString('sensitivity')}
                name={`spec.spec.sensitivity`}
                expressions={expressions}
                formik={formik}
                allowableTypes={allowableTypes}
              />
            </div>
            <div className={cx(stepCss.formGroup)}>
              <Duration
                name={`spec.spec.duration`}
                label={getString('duration')}
                expressions={expressions}
                formik={formik}
                allowableTypes={allowableTypes}
              />
            </div>
            <div className={cx(stepCss.formGroup)}>
              {/* Note - This has to be removed for now but might be required in future, hence commenting the code */}
              {/* <TrafficSplit
                name={`spec.spec.trafficsplit`}
                label={getString('connectors.cdng.trafficsplit')}
                expressions={expressions}
                formik={formik}
              /> */}
            </div>
          </>
        )
      default:
        return <></>
    }
  }

  useEffect(() => {
    const deploymentTag = formValues?.spec?.spec?.deploymentTag || defaultDeploymentTag
    const updatedSpecs = {
      spec: {
        ...formValues.spec.spec,
        deploymentTag
      }
    }
    setFieldValue('spec', { ...formValues.spec, ...updatedSpecs })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      {renderConfigOptions()}
      <div className={cx(stepCss.formGroup)}>
        <FormInput.MultiTextInput
          label={getString('connectors.cdng.artifactTag')}
          name="spec.spec.deploymentTag"
          multiTextInputProps={{ expressions, allowableTypes }}
        />
      </div>
    </>
  )
}
