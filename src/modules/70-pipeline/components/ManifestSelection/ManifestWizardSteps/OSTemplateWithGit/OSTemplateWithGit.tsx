/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  Layout,
  Button,
  FormInput,
  Formik,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Text,
  StepProps,
  Accordion,
  ButtonVariation
} from '@wings-software/uicore'
import cx from 'classnames'
import { Form } from 'formik'
import * as Yup from 'yup'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { FontVariation } from '@harness/design-system'
import { get, isEmpty, set } from 'lodash-es'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { FormMultiTypeCheckboxField } from '@common/components'
import { useStrings } from 'framework/strings'
import type { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'
import type { OpenShiftTemplateGITDataType } from '../../ManifestInterface'
import {
  gitFetchTypeList,
  GitFetchTypes,
  GitRepoName,
  ManifestDataType,
  ManifestIdentifierValidation,
  ManifestStoreMap
} from '../../Manifesthelper'
import GitRepositoryName from '../GitRepositoryName/GitRepositoryName'
import { getRepositoryName } from '../ManifestUtils'
import DragnDropPaths from '../../DragnDropPaths'
import css from '../ManifestWizardSteps.module.scss'
import templateCss from './OSTemplateWithGit.module.scss'

interface OpenshiftTemplateWithGITPropType {
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  initialValues: ManifestConfig
  handleSubmit: (data: ManifestConfigWrapper) => void
  manifestIdsList: Array<string>
  isReadonly?: boolean
}

function OpenShiftTemplateWithGit({
  stepName,
  initialValues,
  handleSubmit,
  expressions,
  allowableTypes,
  prevStepData,
  previousStep,
  manifestIdsList,
  isReadonly = false
}: StepProps<ConnectorConfigDTO> & OpenshiftTemplateWithGITPropType): React.ReactElement {
  const { getString } = useStrings()
  const isActiveAdvancedStep: boolean = initialValues?.spec?.skipResourceVersioning || initialValues?.spec?.commandFlags
  const gitConnectionType: string = prevStepData?.store === ManifestStoreMap.Git ? 'connectionType' : 'type'
  const connectionType =
    prevStepData?.connectorRef?.connector?.spec?.[gitConnectionType] === GitRepoName.Repo ||
    prevStepData?.urlType === GitRepoName.Repo
      ? GitRepoName.Repo
      : GitRepoName.Account

  const accountUrl =
    connectionType === GitRepoName.Account
      ? prevStepData?.connectorRef
        ? prevStepData?.connectorRef?.connector?.spec?.url
        : prevStepData?.url
      : null

  const getInitialValues = (): OpenShiftTemplateGITDataType => {
    const specValues = get(initialValues, 'spec.store.spec', null)

    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        paths: specValues.paths,
        repoName: getRepositoryName(prevStepData, initialValues),
        path:
          getMultiTypeFromValue(specValues?.paths) === MultiTypeInputType.RUNTIME
            ? specValues.paths
            : specValues.paths[0],
        paramsPaths:
          typeof initialValues?.spec?.paramsPaths === 'string'
            ? initialValues?.spec?.paramsPaths
            : initialValues?.spec?.paramsPaths?.map((path: string) => ({ path, uuid: uuid(path, nameSpace()) })),
        skipResourceVersioning: initialValues?.spec?.skipResourceVersioning
      }
    }
    return {
      identifier: '',
      branch: undefined,
      commitId: undefined,
      gitFetchType: 'Branch',
      path: '',
      skipResourceVersioning: false,
      repoName: getRepositoryName(prevStepData, initialValues)
    }
  }

  const submitFormData = (formData: OpenShiftTemplateGITDataType & { store?: string; connectorRef?: string }): void => {
    const manifestObj: ManifestConfigWrapper = {
      manifest: {
        identifier: formData.identifier,
        type: ManifestDataType.OpenshiftTemplate,
        spec: {
          store: {
            type: formData?.store,
            spec: {
              connectorRef: formData?.connectorRef,
              gitFetchType: formData?.gitFetchType,
              paths:
                getMultiTypeFromValue(formData?.path) === MultiTypeInputType.RUNTIME ? formData?.path : [formData?.path]
            }
          },
          paramsPaths:
            typeof formData?.paramsPaths === 'string'
              ? formData?.paramsPaths
              : formData?.paramsPaths?.map((path: { path: string }) => path.path),
          skipResourceVersioning: formData?.skipResourceVersioning
        }
      }
    }
    if (connectionType === GitRepoName.Account) {
      set(manifestObj, 'manifest.spec.store.spec.repoName', formData?.repoName)
    }

    if (manifestObj?.manifest?.spec?.store) {
      if (formData?.gitFetchType === 'Branch') {
        set(manifestObj, 'manifest.spec.store.spec.branch', formData?.branch)
      } else if (formData?.gitFetchType === 'Commit') {
        set(manifestObj, 'manifest.spec.store.spec.commitId', formData?.commitId)
      }
    }
    handleSubmit(manifestObj)
  }

  return (
    <Layout.Vertical spacing="medium" className={css.manifestStore}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'small' }}>
        {stepName}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="osTemplateWithGit"
        validationSchema={Yup.object().shape({
          ...ManifestIdentifierValidation(manifestIdsList, initialValues?.identifier, getString('pipeline.uniqueName')),
          path: Yup.string().trim().required(getString('pipeline.manifestType.osTemplatePathRequired')),
          branch: Yup.string().when('gitFetchType', {
            is: 'Branch',
            then: Yup.string().trim().required(getString('validation.branchName'))
          }),
          commitId: Yup.string().when('gitFetchType', {
            is: 'Commit',
            then: Yup.string().trim().required(getString('validation.commitId'))
          }),
          repoName: Yup.string().test('repoName', getString('common.validation.repositoryName'), value => {
            if (
              connectionType === GitRepoName.Repo ||
              getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED
            ) {
              return true
            }
            return !isEmpty(value) && value?.length > 0
          }),
          paramsPaths: Yup.lazy((value): Yup.Schema<unknown> => {
            if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
              return Yup.array().of(
                Yup.object().shape({
                  path: Yup.string().min(1).required(getString('pipeline.manifestType.pathRequired'))
                })
              )
            }
            return Yup.string().required(getString('pipeline.manifestType.pathRequired'))
          })
        })}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData,
            connectorRef: prevStepData?.connectorRef
              ? getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED
                ? prevStepData?.connectorRef
                : prevStepData?.connectorRef?.value
              : prevStepData?.identifier
              ? prevStepData?.identifier
              : ''
          })
        }}
      >
        {(formik: { setFieldValue: (a: string, b: string) => void; values: OpenShiftTemplateGITDataType }) => (
          <Form>
            <div className={templateCss.templateForm}>
              <FormInput.Text
                name="identifier"
                label={getString('pipeline.manifestType.manifestIdentifier')}
                placeholder={getString('pipeline.manifestType.manifestPlaceholder')}
                className={templateCss.halfWidth}
              />

              {!!(connectionType === GitRepoName.Account && accountUrl) && (
                <GitRepositoryName
                  accountUrl={accountUrl}
                  expressions={expressions}
                  allowableTypes={allowableTypes}
                  fieldValue={formik.values?.repoName}
                  changeFieldValue={(value: string) => formik.setFieldValue('repoName', value)}
                  isReadonly={isReadonly}
                />
              )}
              <Layout.Horizontal flex spacing="huge" margin={{ top: 'small', bottom: 'small' }}>
                <div className={templateCss.halfWidth}>
                  <FormInput.Select
                    name="gitFetchType"
                    label={getString('pipeline.manifestType.gitFetchTypeLabel')}
                    items={gitFetchTypeList}
                  />
                </div>

                {formik.values?.gitFetchType === GitFetchTypes.Branch && (
                  <div
                    className={cx(templateCss.halfWidth, {
                      [templateCss.runtimeInput]:
                        getMultiTypeFromValue(formik.values?.branch) === MultiTypeInputType.RUNTIME
                    })}
                  >
                    <FormInput.MultiTextInput
                      label={getString('pipelineSteps.deploy.inputSet.branch')}
                      placeholder={getString('pipeline.manifestType.branchPlaceholder')}
                      multiTextInputProps={{ expressions, allowableTypes }}
                      name="branch"
                    />
                    {getMultiTypeFromValue(formik.values?.branch) === MultiTypeInputType.RUNTIME && (
                      <ConfigureOptions
                        value={formik.values?.branch as string}
                        type="String"
                        variableName="branch"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => formik.setFieldValue('branch', value)}
                        isReadonly={isReadonly}
                      />
                    )}
                  </div>
                )}

                {formik.values?.gitFetchType === GitFetchTypes.Commit && (
                  <div
                    className={cx(templateCss.halfWidth, {
                      [templateCss.runtimeInput]:
                        getMultiTypeFromValue(formik.values?.commitId) === MultiTypeInputType.RUNTIME
                    })}
                  >
                    <FormInput.MultiTextInput
                      label={getString('pipeline.manifestType.commitId')}
                      placeholder={getString('pipeline.manifestType.commitPlaceholder')}
                      multiTextInputProps={{ expressions, allowableTypes }}
                      name="commitId"
                    />
                    {getMultiTypeFromValue(formik.values?.commitId) === MultiTypeInputType.RUNTIME && (
                      <ConfigureOptions
                        value={formik.values?.commitId as string}
                        type="String"
                        variableName="commitId"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => formik.setFieldValue('commitId', value)}
                        isReadonly={isReadonly}
                      />
                    )}
                  </div>
                )}
              </Layout.Horizontal>

              <Layout.Horizontal flex spacing="huge" margin={{ bottom: 'small' }}>
                <div
                  className={cx(templateCss.halfWidth, {
                    [templateCss.runtimeInput]:
                      getMultiTypeFromValue(formik.values?.path) === MultiTypeInputType.RUNTIME
                  })}
                >
                  <FormInput.MultiTextInput
                    label={getString('pipeline.manifestType.osTemplatePath')}
                    placeholder={getString('pipeline.manifestType.osTemplatePathPlaceHolder')}
                    name="path"
                    multiTextInputProps={{ expressions, allowableTypes }}
                  />
                  {getMultiTypeFromValue(formik.values?.path) === MultiTypeInputType.RUNTIME && (
                    <ConfigureOptions
                      value={formik.values?.path as string}
                      type="String"
                      variableName="path"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => formik.setFieldValue('path', value)}
                      isReadonly={isReadonly}
                    />
                  )}
                </div>
              </Layout.Horizontal>
              <div className={templateCss.halfWidth}>
                <DragnDropPaths
                  formik={formik}
                  expressions={expressions}
                  allowableTypes={allowableTypes}
                  fieldPath="paramsPaths"
                  pathLabel={getString('pipeline.manifestType.paramsYamlPath')}
                  placeholder={getString('pipeline.manifestType.manifestPathPlaceholder')}
                  defaultValue={{ path: '', uuid: uuid('', nameSpace()) }}
                />
              </div>
              <Accordion
                activeId={isActiveAdvancedStep ? getString('advancedTitle') : ''}
                className={cx(templateCss.advancedStepOpen)}
              >
                <Accordion.Panel
                  id={getString('advancedTitle')}
                  addDomId={true}
                  summary={getString('advancedTitle')}
                  details={
                    <Layout.Horizontal
                      flex={{ justifyContent: 'flex-start', alignItems: 'center' }}
                      margin={{ bottom: 'huge' }}
                    >
                      <FormMultiTypeCheckboxField
                        name="skipResourceVersioning"
                        label={getString('skipResourceVersion')}
                        multiTypeTextbox={{ expressions, allowableTypes }}
                        className={cx(templateCss.halfWidth, templateCss.checkbox)}
                      />
                      {getMultiTypeFromValue(formik.values?.skipResourceVersioning) === MultiTypeInputType.RUNTIME && (
                        <ConfigureOptions
                          value={(formik.values?.skipResourceVersioning || '') as string}
                          type="String"
                          variableName="skipResourceVersioning"
                          showRequiredField={false}
                          showDefaultField={false}
                          showAdvanced={true}
                          onChange={value => formik.setFieldValue('skipResourceVersioning', value)}
                          style={{ alignSelf: 'center', marginTop: 11 }}
                          className={css.addmarginTop}
                          isReadonly={isReadonly}
                        />
                      )}
                    </Layout.Horizontal>
                  }
                />
              </Accordion>
            </div>

            <Layout.Horizontal spacing="medium" className={css.saveBtn}>
              <Button
                variation={ButtonVariation.SECONDARY}
                text={getString('back')}
                icon="chevron-left"
                onClick={() => previousStep?.(prevStepData)}
              />
              <Button
                variation={ButtonVariation.PRIMARY}
                type="submit"
                text={getString('submit')}
                rightIcon="chevron-right"
              />
            </Layout.Horizontal>
          </Form>
        )}
      </Formik>
    </Layout.Vertical>
  )
}

export default OpenShiftTemplateWithGit
