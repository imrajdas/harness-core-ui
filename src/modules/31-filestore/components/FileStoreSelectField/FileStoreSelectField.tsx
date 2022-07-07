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
import { FileStoreNodeTypes } from '@filestore/interfaces/FileStore'
import folderImage from '@filestore/images/closed-folder.svg'

import css from './FileStoreSelectField.module.scss'

export interface FileStoreSelectProps {
  name: string
  label?: string
  tooltipProps?: DataTooltipInterface
  placeholder?: string
  readonly?: boolean
  formik: FormikContextType<any>
}

interface FormikFileStoreInput extends FileStoreSelectProps {
  formik: FormikContextType<any>
}

const FileStoreInput: React.FC<FormikFileStoreInput> = (props: FileStoreSelectProps) => {
  const { getString } = useStrings()
  const { formik, label, name, tooltipProps, placeholder, readonly = false } = props
  const fileStoreValue = get(formik.values, name)
  const modalFileStore = useFileStoreModal({
    applySelected: value => formik.setFieldValue(name, value)
  })
  const placeholder_ = defaultTo(placeholder, getString('select'))

  const getScope = (scopeType: string): string => {
    switch (scopeType) {
      case Scope.ACCOUNT:
        return getString('account')
      case Scope.ORG:
        return getString('orgLabel')
      case Scope.PROJECT:
        return getString('projectLabel')
      default:
        return getString('account')
    }
  }

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
          {fileStoreValue?.name ? (
            <Container flex>
              {fileStoreValue?.type && fileStoreValue.type === FileStoreNodeTypes.FOLDER && (
                <img alt="folder" src={folderImage} style={{ marginRight: 8, marginLeft: 4 }} />
              )}
              <Text lineClamp={1} color={Color.GREY_900} padding={{ left: 'xsmall' }}>
                {fileStoreValue?.name}
              </Text>
            </Container>
          ) : (
            <Text color={Color.GREY_500} padding={{ left: 'xsmall' }}>
              - {placeholder_} -
            </Text>
          )}
          <Container padding={{ right: 'small' }}>
            {fileStoreValue?.scope ? <Tag>{getScope(fileStoreValue?.scope).toUpperCase()}</Tag> : null}
            <Icon name="chevron-down" margin={{ right: 'small', left: 'small' }} />
          </Container>
        </Container>
      </Layout.Vertical>
    </FormGroup>
  )
}

export default connect<Omit<FormikFileStoreInput, 'formik'>>(FileStoreInput)
