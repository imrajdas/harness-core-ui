/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Accordion, Formik, MultiTypeInputType } from '@wings-software/uicore'
import * as Yup from 'yup'
import type { FormikProps } from 'formik'

import { getDurationValidationSchema } from '@common/components/MultiTypeDuration/MultiTypeDuration'
import { setFormikRef, StepFormikFowardRef, StepViewType } from '@pipeline/components/AbstractSteps/Step'
import { useStrings } from 'framework/strings'
import { ApprovalRejectionCriteriaType } from '@pipeline/components/PipelineSteps/Steps/Common/types'

import { getNameAndIdentifierSchema } from '@pipeline/components/PipelineSteps/Steps/StepsValidateUtils'
import { CustomApprovalFormData, variableSchema } from './types'
import BaseCustomApproval from './BaseCustomApproval'
import OptionalConfiguration from './OptionalConfiguration'

import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

/**
 * Spec
 * https://harness.atlassian.net/wiki/spaces/CDNG/pages/1203634286/Shell+Script
 */

interface CustomApprovalWidgetProps {
  initialValues: CustomApprovalFormData
  onUpdate?: (data: CustomApprovalFormData) => void
  onChange?: (data: CustomApprovalFormData) => void
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
  stepViewType?: StepViewType
  isNewStep?: boolean
}

export function CustomApprovalWidget(
  {
    initialValues,
    onUpdate,
    onChange,
    allowableTypes,
    isNewStep = true,
    readonly,
    stepViewType
  }: CustomApprovalWidgetProps,
  formikRef: StepFormikFowardRef
): JSX.Element {
  const { getString } = useStrings()

  const validationSchema = Yup.object().shape({
    ...getNameAndIdentifierSchema(getString, stepViewType),
    timeout: getDurationValidationSchema({ minimum: '10s' }).required(getString('validation.timeout10SecMinimum')),
    spec: Yup.object().shape({
      retryInterval: getDurationValidationSchema({ minimum: '10s' }).required(
        getString('pipeline.customApprovalStep.validation.minimumRetryIntervalIs10Secs')
      ),
      scriptTimeout: getDurationValidationSchema({ minimum: '10s' }).required(
        getString('pipeline.customApprovalStep.validation.minimumScriptTimeoutIs10Secs')
      ),
      source: Yup.object().shape({
        spec: Yup.object().shape({
          script: Yup.string().trim().required(getString('common.scriptRequired'))
        })
      }),
      environmentVariables: variableSchema(getString),
      outputVariables: Yup.array()
        .min(1, getString('pipeline.customApprovalStep.validation.atLeastOneOutputVariableIsRequired'))
        .of(
          Yup.object({
            name: Yup.string().required(getString('common.validation.nameIsRequired')),
            value: Yup.string().required(getString('common.validation.valueIsRequired')),
            type: Yup.string().trim().required(getString('common.validation.typeIsRequired'))
          })
        ),
      approvalCriteria: Yup.object().shape({
        spec: Yup.object().when('type', {
          is: ApprovalRejectionCriteriaType.KeyValues,
          then: Yup.object().shape({
            conditions: Yup.array()
              .min(1, getString('pipeline.approvalCriteria.validations.approvalCriteriaCondition'))
              .of(
                Yup.object().shape({
                  key: Yup.string().required(getString('common.validation.fieldIsRequired', { name: 'Field' })),
                  value: Yup.string().trim().required(getString('common.validation.valueIsRequired'))
                })
              )
          }),
          otherwise: Yup.object().shape({
            expression: Yup.string().trim().required(getString('pipeline.approvalCriteria.validations.expression'))
          })
        })
      })
    })
  })

  return (
    <Formik<CustomApprovalFormData>
      onSubmit={submit => {
        onUpdate?.(submit)
      }}
      validate={formValues => {
        onChange?.(formValues)
      }}
      formName="CustomApprovalForm"
      initialValues={initialValues}
      validationSchema={validationSchema}
    >
      {(formik: FormikProps<CustomApprovalFormData>) => {
        // this is required
        setFormikRef(formikRef, formik)

        return (
          <React.Fragment>
            <BaseCustomApproval
              isNewStep={isNewStep}
              stepViewType={stepViewType}
              formik={formik}
              readonly={readonly}
              allowableTypes={allowableTypes}
            />
            <Accordion className={stepCss.accordion}>
              <Accordion.Panel
                id="optional-config"
                summary={getString('common.optionalConfig')}
                details={<OptionalConfiguration formik={formik} readonly={readonly} allowableTypes={allowableTypes} />}
              />
            </Accordion>
          </React.Fragment>
        )
      }}
    </Formik>
  )
}

export const CustomApprovalWidgetWithRef = React.forwardRef(CustomApprovalWidget)
