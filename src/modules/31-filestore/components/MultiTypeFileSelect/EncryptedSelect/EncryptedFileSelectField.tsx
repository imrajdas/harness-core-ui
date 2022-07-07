import React from 'react'
import { connect, FormikContextType } from 'formik'
import { Link } from 'react-router-dom'

import { Layout, Icon, Text } from '@harness/uicore'
import { Color } from '@harness/design-system'
import { get, isPlainObject } from 'lodash-es'
import { FormGroup, Intent } from '@blueprintjs/core'
import useCreateOrSelectSecretModal from '@secrets/modals/CreateOrSelectSecretModal/useCreateOrSelectSecretModal'
import { Scope } from '@common/interfaces/SecretsInterface'

import { useStrings } from 'framework/strings'

import css from './EncryptedFileSelectField.module.scss'

interface SelectEncryptedProps {
  name: string
  formik: FormikContextType<any>
  onChange: (newValue: any) => void
  readonly?: boolean
  placeholder?: string
  allowSelection?: boolean
  value: string
}

interface FormikFileSelectInput extends SelectEncryptedProps {
  formik: FormikContextType<any>
}

interface EncryptedData {
  scope: string
  identifier: string
}

function EncryptedFileSelectField(props: SelectEncryptedProps): React.ReactElement {
  const { getString } = useStrings()
  const { formik, name, readonly = false, onChange, value = '' } = props
  const secretValue = get(formik.values, name) || ''

  const { openCreateOrSelectSecretModal } = useCreateOrSelectSecretModal(
    {
      type: 'SecretFile',
      onSuccess: secretVal => {
        const { projectIdentifier, orgIdentifier, identifier } = secretVal
        let result = `${Scope.ACCOUNT}.${identifier}`
        if (orgIdentifier) {
          result = `${Scope.ORG}.${identifier}`
        }
        if (projectIdentifier) {
          result = `${Scope.PROJECT}.${identifier}`
        }
        onChange(result)
      }
    },
    []
  )

  const data = React.useMemo(() => {
    const getData = (encryptedValue: string): EncryptedData => {
      const [scopeValue, encryptedIdentifier] = typeof encryptedValue === 'string' ? value.split('.') : ['', '']
      const commonProps = {
        identifier: encryptedIdentifier
      }
      switch (scopeValue) {
        case Scope.ACCOUNT:
          return {
            ...commonProps,
            scope: getString('account')
          }
        case Scope.ORG:
          return {
            ...commonProps,
            scope: getString('orgLabel')
          }
        default:
          return {
            scope: '',
            identifier: value
          }
      }
    }
    return getData(secretValue)
  }, [value, name])

  const errorCheck = (): boolean =>
    ((get(formik?.touched, name) || (formik?.submitCount && formik?.submitCount > 0)) &&
      get(formik?.errors, name) &&
      !isPlainObject(get(formik?.errors, name))) as boolean

  return (
    <FormGroup
      helperText={errorCheck() ? get(formik?.errors, name) : null}
      intent={errorCheck() ? Intent.DANGER : Intent.NONE}
      style={{ width: '100%' }}
    >
      <Layout.Vertical className={css.container}>
        <Link
          to="#"
          className={css.containerLink}
          data-testid={name}
          onClick={e => {
            if (!readonly) {
              e.preventDefault()
              openCreateOrSelectSecretModal()
            }
          }}
        >
          <Icon size={24} height={12} name={'key-main'} />
          <Text
            color={Color.PRIMARY_7}
            flex={{ alignItems: 'center', justifyContent: 'flex-start', inline: false }}
            padding="small"
            className={css.containerLinkText}
          >
            {data.identifier ? <div>{data.identifier}</div> : <div>{getString('secrets.secret.configureSecret')}</div>}
          </Text>
        </Link>
      </Layout.Vertical>
    </FormGroup>
  )
}

export default connect<Omit<FormikFileSelectInput, 'formik'>>(EncryptedFileSelectField)
