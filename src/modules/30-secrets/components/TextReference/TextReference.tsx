/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import cx from 'classnames'
import { get, isPlainObject } from 'lodash-es'
import { FormikContextType, connect } from 'formik'
import { Classes, FormGroup, Intent } from '@blueprintjs/core'
import { FormInput, Layout, Container, FormikTooltipContext, DataTooltipInterface } from '@wings-software/uicore'
import type { StringsMap } from 'stringTypes'

import { useStrings } from 'framework/strings'
import StringWithTooltip from '@common/components/StringWithTooltip/StringWithTooltip'
import { useToaster } from '@common/exports'
import SecretInput from '@secrets/components/SecretInput/SecretInput'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'

import { getSecretV2Promise } from 'services/cd-ng'
import css from './TextReference.module.scss'

export enum ValueType {
  TEXT = 'TEXT',
  ENCRYPTED = 'ENCRYPTED'
}

export interface TextReferenceInterface {
  value: string
  type: ValueType
}
interface TextReferenceProps {
  name: string
  label?: string
  className?: string
  type?: string
  allowSelection?: boolean
  privateSecret?: boolean
  placeHolder?: string
  stringId?: keyof StringsMap
}

interface FormikTextReference extends TextReferenceProps {
  formik: FormikContextType<any>
  tooltipProps?: DataTooltipInterface
}

const errorCheck = (name: string, formik?: FormikContextType<any>) =>
  (get(formik?.touched, name) || (formik?.submitCount && formik?.submitCount > 0)) &&
  get(formik?.errors, name) &&
  !isPlainObject(get(formik?.errors, name))

const TextReference: React.FC<FormikTextReference> = props => {
  const { getString } = useStrings()
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { showError } = useToaster()
  const { formik, name, allowSelection, privateSecret } = props
  const [username, setUsername] = useState<TextReferenceInterface>({
    value: formik.values[`${name}textField`] || formik.values[`${name}`]?.value,
    type: ValueType.TEXT
  })
  const hasError = errorCheck(props.name, formik)

  useEffect(() => {
    if (props.type) {
      formik.setFieldValue(`${name}fieldType`, props.type)
    } else {
      formik.setFieldValue(`${name}fieldType`, ValueType.TEXT)
    }
  }, [props.type])

  useEffect(() => {
    if (formik.values[`${name}fieldType`] === ValueType.TEXT) {
      formik.setFieldValue(name, username)
      formik.setFieldValue(`${name}textField`, username?.value)
    }
  }, [formik.values[`${name}fieldType`]])

  useEffect(() => {
    if (formik.values[`${name}secretField`]) {
      formik.setFieldValue(props.name, {
        value: formik.values[`${name}secretField`].referenceString,
        type: ValueType.ENCRYPTED
      })
    }
  }, [formik.values[`${name}secretField`]])

  const getSecretInfo = async (secretString: string) => {
    let val
    try {
      const response = await getSecretV2Promise({
        identifier: secretString.indexOf('.') < 0 ? secretString : secretString.split('.')[1],
        queryParams: {
          accountIdentifier: accountId,
          orgIdentifier: orgIdentifier,
          projectIdentifier: projectIdentifier
        }
      })

      val = {
        identifier: response.data?.secret.identifier,
        name: response.data?.secret.name || secretString.split('.')[1],
        referenceString: secretString,
        accountIdentifier: accountId,
        orgIdentifier: orgIdentifier,
        projectIdentifier: projectIdentifier
      }
    } catch (e) {
      showError(e.message)
    }

    return val
  }
  useEffect(() => {
    const type = get(formik.values, `${props.name}.type`)
    if (type === ValueType.TEXT) {
      formik.setFieldValue(`${name}textField`, get(formik.values, `${props.name}.value`))
    } else if (type === ValueType.ENCRYPTED) {
      getSecretInfo(get(formik.values, `${props.name}.value`)).then(data => {
        formik.setFieldValue(`${name}secretField`, data)
      })
    }
  }, [])

  const tooltipContext = React.useContext(FormikTooltipContext)
  const dataTooltipId =
    props.tooltipProps?.dataTooltipId || (tooltipContext?.formName ? `${tooltipContext?.formName}_${name}` : '')

  return (
    <FormGroup helperText={hasError ? get(formik?.errors, name) : null} intent={hasError ? Intent.DANGER : Intent.NONE}>
      <Layout.Vertical className={props.className}>
        <div className={css.label}>
          {props.stringId && (
            <StringWithTooltip
              tooltipId={dataTooltipId}
              stringId={props.stringId}
              className={cx(Classes.LABEL, css.stringWithTooltipLabel)}
            />
          )}
          <FormInput.DropDown
            name={`${name}fieldType`}
            items={[
              { label: getString('plaintext'), value: ValueType.TEXT },
              { label: getString('encrypted'), value: ValueType.ENCRYPTED }
            ]}
            onChange={() => {
              formik.setFieldValue(props.name, undefined)
              formik.setFieldValue(`${name}textField`, undefined)
              formik.setFieldValue(`${name}secretField`, undefined)
            }}
            dropDownProps={{
              isLabel: true,
              filterable: false,
              minWidth: 'unset'
            }}
          />
        </div>
        {get(formik.values, `${name}fieldType`) === ValueType.TEXT ? (
          <FormInput.Text
            name={`${name}textField`}
            placeholder={props.placeHolder}
            onChange={e => {
              if ((e.target as any).value === '') {
                formik.setFieldValue(props.name, undefined)
              } else {
                formik.setFieldValue(props.name, {
                  value: (e.target as any).value,
                  type: ValueType.TEXT
                })
                setUsername({ value: (e.target as any).value, type: ValueType.TEXT })
              }
            }}
            className={css.textCss}
          />
        ) : (
          <Container className={css.secretField}>
            <SecretInput name={`${name}secretField`} allowSelection={allowSelection} privateSecret={privateSecret} />
          </Container>
        )}
      </Layout.Vertical>
    </FormGroup>
  )
}

export default connect<Omit<FormikTextReference, 'formik'>>(TextReference)
