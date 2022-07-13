/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import * as Yup from 'yup'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { illegalIdentifiers, regexEmail, regexIdentifier, regexName } from '@common/utils/StringUtils'
interface EmailProps {
  allowMultiple?: boolean
  emailSeparator?: string
}

export interface NameIdDescriptionTagsType {
  identifier: string
  name: string
  description?: string
  tags?: {
    [key: string]: string
  }
}

export function NameSchemaWithoutHook(
  getString: UseStringsReturn['getString'],
  config?: { requiredErrorMsg?: string }
): Yup.Schema<string> {
  return Yup.string()
    .trim()
    .required(config?.requiredErrorMsg ? config?.requiredErrorMsg : getString('common.validation.nameIsRequired'))
    .matches(regexName, getString('common.validation.namePatternIsNotValid'))
}

export function NameSchema(config?: { requiredErrorMsg?: string }): Yup.Schema<string> {
  const { getString } = useStrings()
  return NameSchemaWithoutHook(getString, config)
}

export function IdentifierSchemaWithOutName(
  getString: UseStringsReturn['getString'],
  config?: { requiredErrorMsg?: string; regexErrorMsg?: string }
): Yup.Schema<string | undefined> {
  return Yup.string()
    .trim()
    .matches(regexIdentifier, config?.regexErrorMsg ? config?.regexErrorMsg : getString('validation.validIdRegex'))
    .required(config?.requiredErrorMsg ? config?.requiredErrorMsg : getString('validation.identifierRequired'))
    .notOneOf(illegalIdentifiers)
}

export function IdentifierSchemaWithoutHook(
  getString: UseStringsReturn['getString'],
  config?: { requiredErrorMsg?: string; regexErrorMsg?: string }
): Yup.Schema<string | undefined> {
  return Yup.string().when('name', {
    is: val => val?.length,
    then: IdentifierSchemaWithOutName(getString, config)
  })
}

export function IdentifierSchema(config?: {
  requiredErrorMsg?: string
  regexErrorMsg?: string
}): Yup.Schema<string | undefined> {
  const { getString } = useStrings()
  return IdentifierSchemaWithoutHook(getString, config)
}

export function EmailSchema(emailProps: EmailProps = {}): Yup.Schema<string> {
  const { getString } = useStrings()

  if (emailProps.allowMultiple)
    return Yup.string()
      .trim()
      .required(getString('common.validation.email.required'))
      .test(
        'email',
        getString('common.validation.email.format'),
        value =>
          value &&
          value.split(emailProps.emailSeparator).every((emailString: string) => {
            const emailStringTrim = emailString.trim()
            return emailStringTrim ? Yup.string().email().isValidSync(emailStringTrim) : false
          })
      )

  return Yup.string()
    .trim()
    .required(getString('common.validation.email.required'))
    .email(getString('common.validation.email.format'))
}
export function EmailSchemaWithoutRequired(emailProps: EmailProps = {}): Yup.Schema<string | undefined> {
  const { getString } = useStrings()

  if (emailProps.allowMultiple)
    return Yup.string()
      .trim()
      .test('email', getString('common.validation.email.format'), value =>
        value
          ? value.split(emailProps.emailSeparator).every((emailString: string) => {
              const emailStringTrim = emailString.trim()
              return emailStringTrim ? Yup.string().email().isValidSync(emailStringTrim) : false
            })
          : true
      )

  return Yup.string().trim().email(getString('common.validation.email.format'))
}

export function URLValidationSchema(): Yup.Schema<string | undefined> {
  const { getString } = useStrings()
  return Yup.string()
    .trim()
    .required(getString('common.validation.urlIsRequired'))
    .url(getString('validation.urlIsNotValid'))
}
export function URLValidationSchemaWithoutRequired(): Yup.Schema<string | undefined> {
  const { getString } = useStrings()
  return Yup.string().trim().url(getString('validation.urlIsNotValid'))
}

export const isEmail = (email: string): boolean => {
  return regexEmail.test(String(email).toLowerCase())
}

export const ConnectorRefSchema = (config?: { requiredErrorMsg?: string }): Yup.MixedSchema => {
  const { getString } = useStrings()
  return Yup.mixed().required(
    config?.requiredErrorMsg ? config?.requiredErrorMsg : getString('pipelineSteps.build.create.connectorRequiredError')
  )
}
