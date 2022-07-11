/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useContext } from 'react'
import { connect, FormikContextType } from 'formik'
import {
  Layout,
  Icon,
  Container,
  Text,
  DataTooltipInterface,
  FormikTooltipContext,
  HarnessDocTooltip,
  Tag
} from '@harness/uicore'
import { Color } from '@harness/design-system'
import { get, isPlainObject, defaultTo } from 'lodash-es'
import { FormGroup, Intent } from '@blueprintjs/core'
import { Scope } from '@common/interfaces/SecretsInterface'

import { useStrings } from 'framework/strings'
import useFileStoreModal from '@filestore/components/FileStoreComponent/FileStoreComponent'

import css from './FileStoreSelectField.module.scss'

export interface FileStoreSelectProps {
  name: string
  label?: string
  tooltipProps?: DataTooltipInterface
  placeholder?: string
  readonly?: boolean
  formik: FormikContextType<any>
  onChange: (value: string) => void
}

interface FormikFileStoreInput extends FileStoreSelectProps {
  formik: FormikContextType<any>
}

export interface FileStoreFieldData {
  path: string
  scope?: string
}

function FileStoreInput(props: FormikFileStoreInput): React.ReactElement {
  const { getString } = useStrings()
  const { formik, label, name, tooltipProps, placeholder, readonly = false, onChange } = props
  const fileStoreValue = get(formik?.values, name)
  const prepareFileStoreValue = (scopeType: string, path: string): string => {
    switch (scopeType) {
      case Scope.ACCOUNT:
      case Scope.ORG:
        return `${scopeType}:${path}`
      default:
        return `${path}`
    }
  }
  const modalFileStore = useFileStoreModal({
    applySelected: value => {
      const { scope, path } = value
      onChange(prepareFileStoreValue(scope, path))
    }
  })
  const placeholder_ = defaultTo(placeholder, getString('select'))

  const getScope = (fsValue: string): FileStoreFieldData => {
    const [scope, path] = (fsValue && fsValue.split(':')) || ['', '']
    switch (scope) {
      case Scope.ACCOUNT:
      case Scope.ORG:
        return {
          scope,
          path
        }
      default:
        return {
          scope: Scope.PROJECT,
          path: fsValue || ''
        }
    }
  }
  const { scope, path } = (fileStoreValue && getScope(fileStoreValue)) || {}
  const errorCheck = (): boolean =>
    ((get(formik?.touched, name) || (formik?.submitCount && formik?.submitCount > 0)) &&
      get(formik?.errors, name) &&
      !isPlainObject(get(formik?.errors, name))) as boolean

  const tooltipContext = useContext(FormikTooltipContext)
  const dataTooltipId =
    tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  return (
    <FormGroup
      helperText={errorCheck() ? get(formik?.errors, name) : null}
      intent={errorCheck() ? Intent.DANGER : Intent.NONE}
      style={{ width: '100%' }}
    >
      <Layout.Vertical>
        {label ? (
          <label className={'bp3-label'}>
            <HarnessDocTooltip tooltipId={dataTooltipId} labelText={label} />
          </label>
        ) : null}
        <Container
          flex={{ alignItems: 'center', justifyContent: 'space-between' }}
          className={css.container}
          onClick={() => {
            if (!readonly) {
              modalFileStore.openFileStoreModal()
            }
          }}
        >
          {fileStoreValue && path ? (
            <Container flex>
              <Text lineClamp={1} color={Color.GREY_900} padding={{ left: 'xsmall' }}>
                {path}
              </Text>
            </Container>
          ) : (
            <Text color={Color.GREY_500} padding={{ left: 'xsmall' }}>
              - {placeholder_} -
            </Text>
          )}
          <Container padding={{ right: 'small' }}>
            {fileStoreValue && scope ? <Tag>{scope.toUpperCase()}</Tag> : null}
            <Icon name="chevron-down" margin={{ right: 'small', left: 'small' }} />
          </Container>
        </Container>
      </Layout.Vertical>
    </FormGroup>
  )
}

export default connect<Omit<FormikFileStoreInput, 'formik'>>(FileStoreInput)
