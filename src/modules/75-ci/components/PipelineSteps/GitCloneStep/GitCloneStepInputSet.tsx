/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { connect } from 'formik'
import { getMultiTypeFromValue, MultiTypeInputType, FormikForm, RUNTIME_INPUT_VALUE } from '@wings-software/uicore'
import { useStrings } from 'framework/strings'
import StepCommonFieldsInputSet from '@ci/components/PipelineSteps/StepCommonFields/StepCommonFieldsInputSet'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { getConnectorRefWidth, isRuntimeInput, shouldRenderRunTimeInputView } from '@pipeline/utils/CIUtils'
import { Connectors } from '@connectors/constants'
import type { GitCloneStepProps } from './GitCloneStep'
import { CIStep } from '../CIStep/CIStep'
import { CIStepOptionalConfig } from '../CIStep/CIStepOptionalConfig'
import css from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'
import type { CodeBaseType } from '@pipeline/components/PipelineInputSetForm/CICodebaseInputSetForm'
import { get } from 'lodash-es'
import { useQueryParams } from '@common/hooks'
import type { GitQueryParams } from '@common/interfaces/RouteInterfaces'
import {
  CodebaseRuntimeInputsInterface,
  runtimeInputGearWidth
} from '@pipeline/components/PipelineStudio/RightBar/RightBarUtils'

export const GitCloneStepInputSetBasic: React.FC<GitCloneStepProps> = ({
  template,
  path,
  readonly,
  stepViewType,
  formik
}) => {
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const [connectionType, setConnectionType] = React.useState('')
  const [connectorUrl, setConnectorUrl] = React.useState('')
  const { expressions } = useVariablesExpression()
  console.log(template?.spec)

  // setFormikRef?.(formikRef, formik)
  const connectorWidth = getConnectorRefWidth('DefaultView')
  const connectorRefValue = formik.values.spec?.connectorRef
  const isConnectorRuntimeInput = isRuntimeInput(connectorRefValue)
  const codeBaseTypePath = `spec.build.type`
  const [codeBaseType, setCodeBaseType] = React.useState<CodeBaseType | string | undefined>(
    get(formik?.values, codeBaseTypePath)
  )
  const codebaseConnector = formik.values?.spec?.connectorRef

  const [codebaseRuntimeInputs, setCodebaseRuntimeInputs] = React.useState<CodebaseRuntimeInputsInterface>({
    ...(isRuntimeInput(codebaseConnector) && { connectorRef: true, repoName: true })
  })
  React.useEffect(() => {
    if (formik?.values?.spec?.connectorRef === RUNTIME_INPUT_VALUE) {
      const newValuesSpec = { ...formik?.values?.spec }
      newValuesSpec.repoName = RUNTIME_INPUT_VALUE
      // newValuesSpec.build
      // const newBuildValue = { ...formik?.values?.spec?.build }
      // newBuildValue.spec = RUNTIME_INPUT_VALUE
      // spec.build and reponame
      // formik?.setFieldValue(buildPath, RUNTIME_INPUT_VALUE)
      formik?.setValues({ ...formik?.values, spec: newValuesSpec })
      // set build as <+input>
      setCodeBaseType(undefined)
    }
  }, [formik?.values?.spec?.connectorRef])
  return (
    <FormikForm className={css.removeBpPopoverWrapperTopMargin}>
      <CIStep
        readonly={readonly}
        stepViewType={stepViewType}
        enableFields={{
          ...(getMultiTypeFromValue(template?.description) === MultiTypeInputType.RUNTIME && {
            description: {}
          }),
          ...(getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME && {
            'spec.connectorRef': {
              label: { labelKey: 'pipelineSteps.connectorLabel', tooltipId: 'connector' },
              type: [Connectors.GCP, Connectors.AWS, Connectors.DOCKER]
            }
          }),
          ...(getMultiTypeFromValue(template?.spec?.connectorRef) === MultiTypeInputType.RUNTIME && {
            'spec.connectorAndRepo': {
              connectorUrl,
              connectionType,
              connectorWidth: isConnectorRuntimeInput ? connectorWidth - runtimeInputGearWidth : connectorWidth,
              setConnectionType,
              setConnectorUrl,
              repoIdentifier,
              branch,
              isReadonly: readonly,
              setCodebaseRuntimeInputs,
              codebaseRuntimeInputs,
              connectorAndRepoNamePath: 'spec'
            }
          })
        }}
        path={path || ''}
        isInputSetView={true}
        template={template}
      />
      <CIStepOptionalConfig
        readonly={readonly}
        enableFields={{
          ...(getMultiTypeFromValue(template?.spec?.depth) === MultiTypeInputType.RUNTIME && {
            'spec.depth': {}
          }),
          ...(shouldRenderRunTimeInputView(template?.spec?.sslVerify) && {
            'spec.sslVerify': {}
          })
        }}
        stepViewType={stepViewType}
        path={path || ''}
        formik={formik}
        isInputSetView={true}
        template={template}
      />
      <StepCommonFieldsInputSet path={path} readonly={readonly} template={template} stepViewType={stepViewType} />
    </FormikForm>
  )
}

const GitCloneStepInputSet = connect(GitCloneStepInputSetBasic)
export { GitCloneStepInputSet }
