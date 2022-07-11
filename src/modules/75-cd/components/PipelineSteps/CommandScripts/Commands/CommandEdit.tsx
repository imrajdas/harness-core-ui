/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import * as Yup from 'yup'
import type { FormikProps } from 'formik'
import {
  Button,
  ButtonVariation,
  Container,
  Formik,
  FormikForm,
  FormInput,
  MultiTypeInputType,
  SelectOption
} from '@harness/uicore'
import { useStrings } from 'framework/strings'
import { NameSchema } from '@common/utils/Validation'
import { NameId } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import { CommandType, commandTypeOptions, CommandUnitType } from '../CommandScriptsTypes'
import { CopyCommandEdit } from './CopyCommandEdit'
import { ScriptCommandEdit } from './ScriptCommandEdit'
import css from './CommandEdit.module.scss'

interface CommandEditProps {
  isEdit: boolean
  initialValues: CommandUnitType
  allowableTypes: MultiTypeInputType[]
  readonly?: boolean
  onAddEditCommand: (commandData: CommandUnitType) => void
  onCancelClick: () => void
}

export function CommandEdit(props: CommandEditProps): React.ReactElement {
  const { isEdit, initialValues, onAddEditCommand, readonly, allowableTypes, onCancelClick } = props

  const { getString } = useStrings()

  const validationSchema = Yup.object().shape({
    name: NameSchema({ requiredErrorMsg: getString('validation.nameRequired') }),
    type: Yup.string().trim().required(getString('common.validation.typeIsRequired')),
    spec: Yup.object().when('type', {
      is: CommandType.Copy,
      then: Yup.object().shape({
        sourceType: Yup.string().trim().required(getString('cd.steps.commands.validation.sourceTypeRequired')),
        destinationPath: Yup.string().trim().required(getString('cd.steps.commands.validation.destinationPathRequired'))
      }),
      otherwise: Yup.object().shape({
        workingDirectory: Yup.string()
          .trim()
          .required(getString('common.validation.fieldIsRequired', { name: getString('workingDirectory') })),
        shell: Yup.string()
          .trim()
          .required(getString('common.validation.fieldIsRequired', { name: getString('scriptType') })),
        source: Yup.object().shape({
          type: Yup.string()
            .trim()
            .required(getString('common.validation.fieldIsRequired', { name: getString('typeLabel') })),
          spec: Yup.object().shape({
            script: Yup.string()
              .trim()
              .required(getString('common.validation.fieldIsRequired', { name: getString('script') }))
          })
        }),
        tailFiles: Yup.array().of(
          Yup.object().shape({
            tailFile: Yup.string()
              .trim()
              .required(
                getString('common.validation.fieldIsRequired', { name: getString('cd.steps.commands.fileToTail') })
              ),

            tailPattern: Yup.string()
              .trim()
              .required(
                getString('common.validation.fieldIsRequired', { name: getString('cd.steps.commands.patternToSearch') })
              )
          })
        )
      })
    })
  })

  return (
    <Formik<CommandUnitType>
      initialValues={initialValues}
      formName="commandUnit"
      validationSchema={validationSchema}
      onSubmit={onAddEditCommand}
    >
      {(formik: FormikProps<CommandUnitType>) => (
        <FormikForm>
          <Container className={css.commandUnitForm}>
            <Container width={320}>
              <NameId inputGroupProps={{ disabled: readonly }} identifierProps={{ isIdentifierEditable: !isEdit }} />
            </Container>

            <FormInput.Select
              name="type"
              label={getString('pipeline.fieldLabels.commandType')}
              placeholder={getString('pipeline.fieldPlaceholders.commandType')}
              disabled={readonly}
              items={commandTypeOptions}
              onChange={(selected: SelectOption) => {
                formik.setFieldValue('type', selected.value)
                formik.setFieldValue('spec.shell', 'Bash')
                formik.setFieldValue('spec.source.type', 'Inline')
              }}
            />

            {formik.values.type === CommandType.Copy && (
              <CopyCommandEdit formik={formik} allowableTypes={allowableTypes} />
            )}
            {formik.values.type === CommandType.Script && (
              <ScriptCommandEdit formik={formik} allowableTypes={allowableTypes} />
            )}
          </Container>

          <Container className={css.footerContainer}>
            <Button
              variation={ButtonVariation.PRIMARY}
              type="submit"
              text={isEdit ? getString('edit') : getString('add')}
            />
            &nbsp; &nbsp;
            <Button
              variation={ButtonVariation.TERTIARY}
              text={getString('cancel')}
              onClick={() => {
                onCancelClick()
              }}
            />
          </Container>
        </FormikForm>
      )}
    </Formik>
  )
}
