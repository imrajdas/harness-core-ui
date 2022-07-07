/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Text,
  HarnessDocTooltip,
  Layout,
  Container,
  MultiTypeInputType,
  getMultiTypeFromValue
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { isEmpty, get, set } from 'lodash-es'
import produce from 'immer'
import { connect, FormikContextType } from 'formik'
import cx from 'classnames'
import type { StageElementConfig } from 'services/pipeline-ng'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { MultiTypeExecutionCondition } from '@common/components/MultiTypeExecutionCondition/MultiTypeExecutionCondition'
import DelegateSelectorPanel from '@pipeline/components/PipelineSteps/AdvancedSteps/DelegateSelectorPanel/DelegateSelectorPanel'
import { useStrings } from 'framework/strings'
import { getDefaultMonacoConfig } from '@common/components/MonacoTextField/MonacoTextField'
import MonacoEditor from '@common/components/MonacoEditor/MonacoEditor'
import { yamlParse, yamlStringify } from '@common/utils/YamlHelperMethods'
import css from './PipelineInputSetForm.module.scss'
import stepCss from '@pipeline/components/PipelineSteps/Steps/Steps.module.scss'

interface StageAdvancedInputSetFormProps {
  deploymentStageTemplate?: StageElementConfig
  path: string
  readonly?: boolean
  stageIdentifier?: string
  allowableTypes?: MultiTypeInputType[]
  delegateSelectors?: string[] | string
}

interface ConditionalExecutionFormProps {
  readonly?: boolean
  path: string
  allowableTypes?: MultiTypeInputType[]
  formik?: FormikContextType<any>
}

function ConditionalExecutionFormInternal(props: ConditionalExecutionFormProps): React.ReactElement {
  const { readonly, path, allowableTypes, formik } = props
  const { getString } = useStrings()
  const conditionValue = get(formik?.values, path)
  const { expressions } = useVariablesExpression()
  const [multiType, setMultiType] = useState<MultiTypeInputType>(getMultiTypeFromValue(conditionValue))

  return (
    <Container margin={{ bottom: 'medium' }}>
      <Layout.Vertical flex={{ alignItems: 'flex-start' }}>
        <Text
          color={Color.GREY_600}
          margin={{ bottom: 'small' }}
          className={css.conditionalExecutionTitle}
          font={{ weight: 'semi-bold' }}
        >
          {getString('pipeline.conditionalExecution.title')}
        </Text>
        <Text width="85%" color={Color.GREY_500} margin={{ bottom: 'small' }} font={{ size: 'small' }}>
          {getString('pipeline.conditionalExecution.conditionLabel')}
          <HarnessDocTooltip tooltipId="conditionalExecution" useStandAlone={true} />
        </Text>
        <Container width="100%">
          <MultiTypeExecutionCondition
            path={path}
            allowableTypes={allowableTypes}
            multiType={multiType}
            setMultiType={setMultiType}
            readonly={readonly}
            expressions={expressions}
          />
        </Container>
      </Layout.Vertical>
    </Container>
  )
}

export const ConditionalExecutionForm = connect(ConditionalExecutionFormInternal)

export interface StrategyFormInternalProps {
  readonly?: boolean
  path: string
}

export function StrategyFormInternal(
  props: StrategyFormInternalProps & { formik: FormikContextType<any> }
): React.ReactElement {
  const { readonly, path, formik } = props
  const { getString } = useStrings()

  const value = yamlStringify(get(formik.values, path, '')).replace(': null\n', ': \n')

  function handleChange(newValue: string): void {
    try {
      const parsed = yamlParse(newValue)
      formik.setValues(
        produce(formik.values, (draft: any) => {
          set(draft, path, parsed)
        })
      )
    } catch (e) {
      // empty block
    }
  }

  function preventSubmit(e: React.KeyboardEvent): void {
    if (e.key === 'Enter') {
      e.stopPropagation()
    }
  }

  return (
    <div className={css.strategyContainer} onKeyDown={preventSubmit}>
      <Text
        color={Color.GREY_600}
        margin={{ bottom: 'small' }}
        className={css.conditionalExecutionTitle}
        font={{ weight: 'semi-bold' }}
      >
        {getString('pipeline.loopingStrategy.title')}
      </Text>
      <div className={css.editor}>
        <MonacoEditor
          height={300}
          options={getDefaultMonacoConfig(!!readonly)}
          language="yaml"
          value={value}
          onChange={handleChange}
        />
      </div>
    </div>
  )
}

export const StrategyForm = connect<StrategyFormInternalProps>(StrategyFormInternal)

export function StageAdvancedInputSetForm({
  deploymentStageTemplate,
  path,
  readonly,
  stageIdentifier,
  allowableTypes,
  delegateSelectors = []
}: StageAdvancedInputSetFormProps): React.ReactElement {
  const { getString } = useStrings()
  return (
    <>
      <div id={`Stage.${stageIdentifier}.Advanced`} className={cx(css.accordionSummary)}>
        <div className={css.inputheader}>{getString('advancedTitle')}</div>
        {!isEmpty(/* istanbul ignore next */ delegateSelectors) && (
          <div className={cx(css.nestedAccordions, stepCss.formGroup, stepCss.md)}>
            <DelegateSelectorPanel
              isReadonly={readonly || false}
              allowableTypes={allowableTypes}
              name={`${path}.delegateSelectors`}
            />
          </div>
        )}

        {!isEmpty(/* istanbul ignore next */ deploymentStageTemplate?.when?.condition) && (
          <div className={cx(css.nestedAccordions, stepCss.formGroup, stepCss.md)}>
            <ConditionalExecutionForm
              readonly={readonly}
              path={`${path}.when.condition`}
              allowableTypes={allowableTypes}
            />
          </div>
        )}
        {!isEmpty(deploymentStageTemplate?.strategy) && (
          <div className={cx(css.nestedAccordions, stepCss.formGroup, stepCss.md)}>
            <StrategyForm readonly={readonly} path={`${path}.strategy`} />
          </div>
        )}
      </div>
    </>
  )
}
