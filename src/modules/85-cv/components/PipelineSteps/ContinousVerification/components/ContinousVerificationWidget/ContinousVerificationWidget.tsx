/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Formik } from '@wings-software/uicore'

import * as Yup from 'yup'
import type { FormikErrors, FormikProps } from 'formik'

import { isEmpty } from 'lodash-es'
import { StepFormikFowardRef, setFormikRef } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'

import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { ContinousVerificationData } from '../../types'
import type { ContinousVerificationWidgetProps } from './types'
import { ContinousVerificationWidgetSections } from './components/ContinousVerificationWidgetSections/ContinousVerificationWidgetSections'
import { getMonitoredServiceRefFromType, validateMonitoredService } from './ContinousVerificationWidget.utils'

/**
 * Spec
 * https://harness.atlassian.net/wiki/spaces/LEARNING/pages/1762656555/Change+intelligence+-+CDNG+integration
 */

export function ContinousVerificationWidget(
  { initialValues, onUpdate, isNewStep, stepViewType, onChange, allowableTypes }: ContinousVerificationWidgetProps,
  formikRef: StepFormikFowardRef
): JSX.Element {
  const values = {
    ...initialValues,
    spec: {
      ...initialValues.spec,
      ...(initialValues?.spec?.monitoredService && { initialMonitoredService: initialValues?.spec?.monitoredService })
    }
  }
  const { getString } = useStrings()
  const { CVNG_TEMPLATE_VERIFY_STEP } = useFeatureFlags()

  const validateForm = (formData: ContinousVerificationData): FormikErrors<ContinousVerificationData> => {
    let errors: FormikErrors<ContinousVerificationData> = {}
    const {
      healthSources = [],
      monitoredService: { type },
      monitoredService,
      initialMonitoredService
    } = formData?.spec || {}

    const monitoredServiceRef = getMonitoredServiceRefFromType(monitoredService, type, formData)
    const { monitoredServiceTemplateRef = '', templateInputs = {} as unknown } = monitoredService?.spec || {}
    const { templateInputs: initialTemplateInputs = {} } = initialMonitoredService?.spec || {}
    const templateInputsToValidate = (!isEmpty(initialTemplateInputs) ? initialTemplateInputs : templateInputs) as any
    errors = validateMonitoredService(
      type,
      stepViewType,
      monitoredServiceRef,
      errors,
      healthSources,
      getString,
      monitoredServiceTemplateRef,
      templateInputsToValidate,
      templateInputs
    )
    return errors
  }

  const defaultCVSchema = Yup.object().shape({
    ...getNameAndIdentifierSchema(getString, stepViewType),
    timeout: Yup.string().when(['spec.spec.duration.value'], {
      is: durationValue => durationValue?.length,
      then: getDurationValidationSchema({ minimum: '40m' }).required(
        getString('connectors.cdng.validations.timeoutValidation')
      )
    }),
    spec: Yup.object().shape({
      type: Yup.string().required(getString('connectors.cdng.validations.verificationTypeRequired')),
      spec: Yup.object().shape({
        duration: Yup.string().required(getString('connectors.cdng.validations.durationRequired')),
        sensitivity: Yup.string().required(getString('connectors.cdng.validations.sensitivityRequired')),
        deploymentTag: Yup.string().required(getString('connectors.cdng.validations.deploymentTagRequired'))
      })
    })
  })

  return (
    <Formik<ContinousVerificationData>
      onSubmit={submit => {
        onUpdate?.(submit)
      }}
      validate={data => {
        if (CVNG_TEMPLATE_VERIFY_STEP) {
          const errors = validateForm(data)
          if (!isEmpty(errors)) {
            onChange?.(data)
            return errors
          } else {
            onChange?.(data)
          }
        } else {
          onChange?.(data)
        }
      }}
      formName="cvData"
      initialValues={values}
      validationSchema={defaultCVSchema}
    >
      {(formik: FormikProps<ContinousVerificationData>) => {
        setFormikRef(formikRef, formik)
        return (
          <ContinousVerificationWidgetSections
            formik={formik}
            isNewStep={isNewStep}
            stepViewType={stepViewType}
            allowableTypes={allowableTypes}
          />
        )
      }}
    </Formik>
  )
}

export const ContinousVerificationWidgetWithRef = React.forwardRef(ContinousVerificationWidget)
