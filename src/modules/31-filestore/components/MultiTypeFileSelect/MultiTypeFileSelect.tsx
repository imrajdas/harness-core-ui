import React, { CSSProperties, ReactChild } from 'react'
import {
  MultiTypeInputType,
  getMultiTypeFromValue,
  FormError,
  FormikTooltipContext,
  DataTooltipInterface,
  HarnessDocTooltip,
  FormInput,
  Container
} from '@harness/uicore'
import { IFormGroupProps, Intent, FormGroup } from '@blueprintjs/core'
import { FormikContextType, connect } from 'formik'
import { get } from 'lodash-es'
import { errorCheck } from '@common/utils/formikHelpers'
import MultiTypeSelectorButton from '@common/components/MultiTypeSelectorButton/MultiTypeSelectorButton'

import css from './MultiTypeFileSelect.module.scss'

export interface MultiTypeFieldSelectorProps extends Omit<IFormGroupProps, 'label' | 'placeholder'> {
  children: Exclude<React.ReactNode, null | undefined>
  name: string
  label: string | ReactChild
  defaultValueToReset?: unknown
  style?: CSSProperties
  disableTypeSelection?: boolean
  skipRenderValueInExpressionLabel?: boolean
  expressionRender?(): React.ReactNode
  allowedTypes?: MultiTypeInputType[]
  useExecutionTimeInput?: boolean
  isOptional?: boolean
  optionalLabel?: string
  tooltipProps?: DataTooltipInterface
  disableMultiSelectBtn?: boolean
  onTypeChange?: (type: MultiTypeInputType) => void
  hideError?: boolean
  supportListOfExpressions?: boolean
  index?: number
  defaultType?: string
  value?: string
  localId?: string
  changed?: boolean
  values?: string | string[]
  isInputField?: boolean
}

export interface ConnectedMultiTypeFieldSelectorProps extends MultiTypeFieldSelectorProps {
  formik: FormikContextType<any>
}

export function MultiTypeFileSelect(props: ConnectedMultiTypeFieldSelectorProps): React.ReactElement | null {
  const {
    formik,
    label,
    name,
    children,
    defaultValueToReset,
    disableTypeSelection,
    allowedTypes = [MultiTypeInputType.FIXED, MultiTypeInputType.RUNTIME],
    expressionRender,
    skipRenderValueInExpressionLabel,
    isOptional,
    disableMultiSelectBtn,
    hideError,
    optionalLabel = '(optional)',
    onTypeChange,
    supportListOfExpressions,
    useExecutionTimeInput,
    defaultType,
    changed,
    localId,
    values,
    ...restProps
  } = props
  const error = get(formik?.errors, name)
  const hasError = errorCheck(name, formik) && typeof error === 'string'
  const showError = hasError && !hideError
  const labelText = !isOptional ? label : `${label} ${optionalLabel}`
  const {
    intent = showError ? Intent.DANGER : Intent.NONE,
    helperText = showError ? <FormError name={name} errorMessage={get(formik?.errors, name)} /> : null,
    disabled,
    ...rest
  } = restProps

  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    props.tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  const value: string = get(formik?.values, name, '')

  const [type, setType] = React.useState(getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions))

  function handleChange(newType: MultiTypeInputType): void {
    setType(newType)
    onTypeChange?.(newType)

    if (newType === type) {
      return
    }
  }

  if (
    type === MultiTypeInputType.RUNTIME &&
    getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions) !== MultiTypeInputType.RUNTIME
  ) {
    setType(getMultiTypeFromValue(value, allowedTypes, supportListOfExpressions))
  }

  return (
    <FormGroup
      {...rest}
      labelFor={name}
      helperText={helperText}
      intent={intent}
      disabled={disabled}
      label={
        <Container flex>
          <HarnessDocTooltip tooltipId={dataTooltipId} labelText={labelText} />
        </Container>
      }
    >
      <Container flex>
        {disableTypeSelection || type === MultiTypeInputType.FIXED ? (
          children
        ) : type === MultiTypeInputType.EXPRESSION && typeof expressionRender === 'function' ? (
          <div className={css.expressionWrapper}>{expressionRender()}</div>
        ) : type === MultiTypeInputType.RUNTIME && typeof value === 'string' ? (
          <FormInput.Text className={css.runtimeDisabled} name={name} disabled label="" />
        ) : null}
        {disableTypeSelection ? null : (
          <MultiTypeSelectorButton
            allowedTypes={allowedTypes}
            type={type}
            onChange={handleChange}
            disabled={disableMultiSelectBtn}
          />
        )}
      </Container>
    </FormGroup>
  )
}

export default connect<MultiTypeFieldSelectorProps>(MultiTypeFileSelect)
