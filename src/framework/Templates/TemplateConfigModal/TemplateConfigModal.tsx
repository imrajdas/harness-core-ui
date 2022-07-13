/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Dispatch, SetStateAction, useContext, useState } from 'react'
import * as Yup from 'yup'
import { defaultTo, isEmpty, isEqual, omit, unset } from 'lodash-es'
import type { FormikProps } from 'formik'
import {
  Button,
  ButtonVariation,
  Container,
  Formik,
  FormikForm,
  FormInput,
  Icon,
  Layout,
  Select,
  SelectOption,
  Text
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import produce from 'immer'
import { Classes } from '@blueprintjs/core'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { NameIdDescriptionTags } from '@common/components/NameIdDescriptionTags/NameIdDescriptionTags'
import RbacButton from '@rbac/components/Button/Button'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import type { EntityGitDetails, NGTemplateInfoConfig } from 'services/template-ng'
import { TemplatePreview } from '@templates-library/components/TemplatePreview/TemplatePreview'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { PageSpinner } from '@common/components'
import type { UseSaveSuccessResponse } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import GitContextForm, { IGitContextFormProps } from '@common/components/GitContextForm/GitContextForm'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { GitSyncStoreProvider } from 'framework/GitRepoStore/GitSyncStoreContext'
import { IdentifierSchema, NameSchema } from '@common/utils/Validation'
import { regexVersionLabel } from '@common/utils/StringUtils'
import type { Error } from 'services/cd-ng'
import { Scope } from '@common/interfaces/SecretsInterface'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { TemplateStudioPathProps } from '@common/interfaces/RouteInterfaces'
import { DefaultNewTemplateId, DefaultNewVersionLabel } from '../templates'
import css from './TemplateConfigModal.module.scss'

export enum Fields {
  Name = 'name',
  Identifier = 'identifier',
  Description = 'description',
  Tags = 'tags',
  VersionLabel = 'versionLabel',
  Repo = 'repo',
  Branch = 'branch'
}

export interface PromiseExtraArgs {
  isEdit?: boolean
  updatedGitDetails?: EntityGitDetails
  comment?: string
}

export interface ModalProps {
  title: string
  disabledFields?: Fields[]
  shouldGetComment?: boolean
  promise: (values: NGTemplateInfoConfig, extraInfo: PromiseExtraArgs) => Promise<UseSaveSuccessResponse>
  onSuccess?: (values: NGTemplateInfoConfig) => void
  onFailure?: (error: Error) => void
  lastPublishedVersion?: string
}

export interface TemplateConfigValues extends NGTemplateInfoConfigWithGitDetails {
  comment: string
}

export interface NGTemplateInfoConfigWithGitDetails extends NGTemplateInfoConfig {
  repo?: string
  branch?: string
}

export interface ConfigModalProps {
  initialValues: NGTemplateInfoConfig
  onClose: () => void
  modalProps: ModalProps
  gitDetails?: IGitContextFormProps
  allowScopeChange?: boolean
  submitButtonLabel: string
}

interface BasicDetailsInterface extends ConfigModalProps {
  setPreviewValues: Dispatch<SetStateAction<NGTemplateInfoConfigWithGitDetails>>
}

const MAX_VERSION_LABEL_LENGTH = 63

const BasicTemplateDetails = (props: BasicDetailsInterface): JSX.Element => {
  const { getString } = useStrings()

  const {
    initialValues,
    setPreviewValues,
    onClose,
    modalProps,
    gitDetails,
    allowScopeChange = false,
    submitButtonLabel
  } = props
  const {
    title,
    disabledFields = [],
    shouldGetComment = false,
    promise,
    onSuccess,
    onFailure,
    lastPublishedVersion
  } = modalProps
  const { isGitSyncEnabled } = useAppStore()
  const currentTemplateType = initialValues.type
  const formName = `create${currentTemplateType}Template`
  const [loading, setLoading] = React.useState<boolean>()
  const { isReadonly } = useContext(TemplateContext)
  const pathParams = useParams<TemplateStudioPathProps>()
  const { orgIdentifier, projectIdentifier } = pathParams
  const scope = getScopeFromDTO(pathParams)
  const [formInitialValues, setFormInitialValues] = React.useState<TemplateConfigValues>(
    initialValues as TemplateConfigValues
  )
  const SCOPE_OPTIONS: SelectOption[] = [
    {
      value: Scope.ACCOUNT,
      label: getString('account')
    },
    {
      value: Scope.ORG,
      label: getString('orgLabel')
    },
    {
      value: Scope.PROJECT,
      label: getString('projectLabel')
    }
  ]

  const onSubmit = React.useCallback(
    (values: TemplateConfigValues) => {
      setLoading(true)
      promise(omit(values, 'repo', 'branch', 'comment'), {
        isEdit: false,
        ...(!isEmpty(values.repo) && { updatedGitDetails: { repoIdentifier: values.repo, branch: values.branch } }),
        ...(!isEmpty(values.comment) && { comment: values.comment })
      })
        .then(response => {
          setLoading(false)
          if (response && response.status === 'SUCCESS') {
            onSuccess?.(values)
            onClose()
          } else {
            throw response
          }
        })
        .catch(error => {
          setLoading(false)
          onFailure?.(error)
        })
    },
    [onSuccess, onClose, onFailure]
  )

  const onScopeChange = React.useCallback(
    (item: SelectOption, formik: FormikProps<TemplateConfigValues>) => {
      formik.setValues(
        produce(formik.values, draft => {
          draft.projectIdentifier = item.value === Scope.PROJECT ? projectIdentifier : undefined
          draft.orgIdentifier = item.value === Scope.ACCOUNT ? undefined : orgIdentifier
          if (item.value === Scope.PROJECT) {
            draft.repo = gitDetails?.repoIdentifier
            draft.branch = gitDetails?.branch
          } else {
            unset(draft, 'repo')
            unset(draft, 'branch')
          }
        })
      )
    },
    [projectIdentifier, orgIdentifier, gitDetails]
  )

  const versionLabelText = getString('templatesLibrary.createNewModal.versionLabel')

  React.useEffect(() => {
    const newInitialValues = produce(initialValues as TemplateConfigValues, draft => {
      if (isEmpty(initialValues.name)) {
        draft.name = getString('templatesLibrary.createNewModal.namePlaceholder', { entity: initialValues.type })
      }
      if (isEqual(initialValues.identifier, DefaultNewTemplateId)) {
        draft.identifier = getString('templatesLibrary.createNewModal.identifierPlaceholder', {
          entity: initialValues.type.toLowerCase()
        })
      }
      if (isEqual(initialValues.versionLabel, DefaultNewVersionLabel)) {
        unset(draft, 'versionLabel')
      }
      draft.comment = ''
      draft.repo = gitDetails?.repoIdentifier
      draft.branch = gitDetails?.branch
    })
    setFormInitialValues(newInitialValues)
  }, [initialValues])

  React.useEffect(() => {
    setPreviewValues(formInitialValues)
  }, [formInitialValues])

  return (
    <Container width={'55%'} className={css.basicDetails} background={Color.FORM_BG} padding={'huge'}>
      {loading && <PageSpinner />}
      <Text
        color={Color.GREY_800}
        font={{ weight: 'bold', size: 'medium' }}
        margin={{ bottom: 'xlarge', left: 0, right: 0 }}
      >
        {defaultTo(title, '')}
      </Text>
      <Formik<TemplateConfigValues>
        initialValues={formInitialValues}
        onSubmit={onSubmit}
        validate={values => {
          setPreviewValues(values)
        }}
        formName={formName}
        enableReinitialize={true}
        validationSchema={Yup.object().shape({
          name: NameSchema({
            requiredErrorMsg: getString('common.validation.fieldIsRequired', {
              name: getString('templatesLibrary.createNewModal.nameError')
            })
          }),
          identifier: IdentifierSchema(),
          versionLabel: Yup.string()
            .trim()
            .required(
              getString('common.validation.fieldIsRequired', {
                name: versionLabelText
              })
            )
            .matches(
              regexVersionLabel,
              getString('common.validation.fieldMustStartWithAlphanumericAndCanNotHaveSpace', {
                name: versionLabelText
              })
            )
            .max(
              MAX_VERSION_LABEL_LENGTH,
              getString('common.validation.fieldCannotbeLongerThanN', {
                name: versionLabelText,
                n: MAX_VERSION_LABEL_LENGTH
              })
            )
        })}
      >
        {(formik: FormikProps<TemplateConfigValues>) => {
          return (
            <FormikForm>
              <Layout.Vertical spacing={'huge'}>
                <Container>
                  <Layout.Vertical spacing={'small'}>
                    <Container>
                      <Layout.Vertical>
                        <NameIdDescriptionTags
                          tooltipProps={{ dataTooltipId: formName }}
                          formikProps={formik}
                          identifierProps={{
                            isIdentifierEditable: !disabledFields.includes(Fields.Identifier) && !isReadonly,
                            inputGroupProps: { disabled: disabledFields.includes(Fields.Name) || isReadonly }
                          }}
                          className={css.nameIdDescriptionTags}
                          descriptionProps={{
                            disabled: disabledFields.includes(Fields.Description) || isReadonly
                          }}
                          tagsProps={{
                            disabled: disabledFields.includes(Fields.Tags) || isReadonly
                          }}
                        />
                        <FormInput.Text
                          name="versionLabel"
                          placeholder={getString('templatesLibrary.createNewModal.versionPlaceholder')}
                          label={versionLabelText}
                          disabled={disabledFields.includes(Fields.VersionLabel) || isReadonly}
                        />
                        {lastPublishedVersion && (
                          <Container
                            border={{ radius: 4, color: Color.BLUE_100 }}
                            background={Color.BLUE_100}
                            flex={{ alignItems: 'center' }}
                            padding={'small'}
                            margin={{ bottom: 'medium' }}
                          >
                            <Layout.Horizontal spacing="small" flex={{ justifyContent: 'start' }}>
                              <Icon name="info-messaging" size={18} />
                              <Text color={Color.BLACK} font={{ weight: 'semi-bold', size: 'small' }}>
                                {getString('templatesLibrary.createNewModal.lastPublishedVersion')}
                              </Text>
                              <Text
                                lineClamp={1}
                                color={Color.BLACK}
                                font={{ size: 'small' }}
                                margin={{ left: 'none' }}
                              >
                                {lastPublishedVersion}
                              </Text>
                            </Layout.Horizontal>
                          </Container>
                        )}
                        {allowScopeChange && scope === Scope.PROJECT && (
                          <Container className={Classes.FORM_GROUP} width={160} margin={{ bottom: 'medium' }}>
                            <label className={Classes.LABEL}>
                              {getString('templatesLibrary.templateSettingsModal.scopeLabel')}
                            </label>
                            <Select
                              value={SCOPE_OPTIONS.find(item => item.value === getScopeFromDTO(formik.values))}
                              items={SCOPE_OPTIONS}
                              onChange={item => onScopeChange(item, formik)}
                            />
                          </Container>
                        )}
                        {shouldGetComment && (
                          <FormInput.TextArea
                            name="comment"
                            label={getString('optionalField', {
                              name: getString('common.commentModal.commentLabel')
                            })}
                            textArea={{
                              className: css.comment
                            }}
                          />
                        )}
                      </Layout.Vertical>
                    </Container>
                    {isGitSyncEnabled && isEmpty(gitDetails) && getScopeFromDTO(formik.values) === Scope.PROJECT && (
                      <GitSyncStoreProvider>
                        <GitContextForm formikProps={formik as any} />
                      </GitSyncStoreProvider>
                    )}
                  </Layout.Vertical>
                </Container>
                <Container>
                  <Layout.Horizontal spacing="small" flex={{ alignItems: 'flex-end', justifyContent: 'flex-start' }}>
                    <RbacButton
                      text={submitButtonLabel}
                      type="submit"
                      variation={ButtonVariation.PRIMARY}
                      permission={{
                        permission: PermissionIdentifier.EDIT_TEMPLATE,
                        resource: {
                          resourceType: ResourceType.TEMPLATE
                        }
                      }}
                    />
                    <Button text={getString('cancel')} variation={ButtonVariation.TERTIARY} onClick={onClose} />
                  </Layout.Horizontal>
                </Container>
              </Layout.Vertical>
            </FormikForm>
          )
        }}
      </Formik>
    </Container>
  )
}

export const TemplateConfigModal = (props: ConfigModalProps): JSX.Element => {
  const { initialValues, modalProps, ...rest } = props
  const [previewValues, setPreviewValues] = useState<NGTemplateInfoConfigWithGitDetails>({
    ...props.initialValues,
    repo: rest.gitDetails?.repoIdentifier,
    branch: rest.gitDetails?.branch
  })
  const { isGitSyncEnabled } = useAppStore()

  const content = (
    <Layout.Horizontal>
      <BasicTemplateDetails
        initialValues={initialValues}
        modalProps={modalProps}
        setPreviewValues={setPreviewValues}
        {...rest}
      />
      <TemplatePreview previewValues={previewValues} />
      <Button
        className={css.closeIcon}
        iconProps={{ size: 24, color: Color.GREY_500 }}
        icon="cross"
        variation={ButtonVariation.ICON}
        onClick={props.onClose}
      />
    </Layout.Horizontal>
  )
  return isGitSyncEnabled ? <GitSyncStoreProvider>{content}</GitSyncStoreProvider> : content
}
