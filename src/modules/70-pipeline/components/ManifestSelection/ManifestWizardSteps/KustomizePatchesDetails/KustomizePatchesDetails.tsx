/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback } from 'react'
import {
  Text,
  Layout,
  Button,
  FormInput,
  StepProps,
  getMultiTypeFromValue,
  MultiTypeInputType,
  Formik,
  ButtonVariation,
  Icon
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { Form, FieldArray, FieldArrayRenderProps } from 'formik'
import { get, isEmpty, set } from 'lodash-es'
import { FontVariation } from '@harness/design-system'
import cx from 'classnames'
import { v4 as nameSpace, v5 as uuid } from 'uuid'
import { useStrings } from 'framework/strings'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import type { ConnectorConfigDTO, ManifestConfig, ManifestConfigWrapper } from 'services/cd-ng'

import MultiTypeFieldSelector from '@common/components/MultiTypeFieldSelector/MultiTypeFieldSelector'

import type { KustomizePatchDataType, ManifestTypes } from '../../ManifestInterface'

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
import css from '../ManifestWizardSteps.module.scss'
import helmcss from '../HelmWithGIT/HelmWithGIT.module.scss'

interface KustomizePathPropTypes {
  key?: string
  name?: string
  stepName: string
  expressions: string[]
  allowableTypes: MultiTypeInputType[]
  initialValues: ManifestConfig
  handleSubmit: (data: ManifestConfigWrapper) => void
  manifestIdsList: Array<string>
  selectedManifest: ManifestTypes | null
  isReadonly?: boolean
}

const submitKustomizePatchData = (
  formData: KustomizePatchDataType & { store?: string; connectorRef?: string },
  connectionType: string
) => {
  const manifestObj: ManifestConfigWrapper = {
    manifest: {
      identifier: formData.identifier,
      type: ManifestDataType.KustomizePatches,
      spec: {
        store: {
          type: formData?.store,
          spec: {
            connectorRef: formData?.connectorRef,
            gitFetchType: formData?.gitFetchType,
            paths:
              typeof formData?.paths === 'string' ? formData?.paths : formData?.paths?.map((path: any) => path.path)
          }
        }
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
  return manifestObj
}

const renderBranch = (
  formik: any,
  isReadonly: boolean,
  label: string,
  placeholder: string,
  expressions?: any,
  allowableTypes?: MultiTypeInputType[]
) => {
  return (
    <div
      className={cx(helmcss.halfWidth, {
        [helmcss.runtimeInput]: getMultiTypeFromValue(formik.values?.branch) === MultiTypeInputType.RUNTIME
      })}
    >
      <FormInput.MultiTextInput
        label={label}
        placeholder={placeholder}
        multiTextInputProps={{ expressions, allowableTypes }}
        name="branch"
      />
      {getMultiTypeFromValue(formik.values?.branch) === MultiTypeInputType.RUNTIME && (
        <ConfigureOptions
          style={{ alignSelf: 'center' }}
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
  )
}

const renderCommitId = (
  formik: any,
  isReadonly: boolean,
  label: string,
  placeholder: string,
  expressions?: any,
  allowableTypes?: MultiTypeInputType[]
) => {
  return (
    <div
      className={cx(helmcss.halfWidth, {
        [helmcss.runtimeInput]: getMultiTypeFromValue(formik.values?.commitId) === MultiTypeInputType.RUNTIME
      })}
    >
      <FormInput.MultiTextInput
        label={label}
        placeholder={placeholder}
        multiTextInputProps={{ expressions, allowableTypes }}
        name="commitId"
      />
      {getMultiTypeFromValue(formik.values?.commitId) === MultiTypeInputType.RUNTIME && (
        <ConfigureOptions
          style={{ alignSelf: 'center' }}
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
  )
}

const renderPathArr = ({
  index,
  selectedManifest,
  manifestPathPlaceholder,
  pathPlaceholder,
  expressions,
  allowableTypes
}: {
  index: number
  selectedManifest: string | null
  manifestPathPlaceholder: string
  pathPlaceholder: string
  expressions: any
  allowableTypes: MultiTypeInputType[]
}) => {
  return (
    <>
      <Icon name="drag-handle-vertical" className={css.drag} />
      <Text width={12}>{`${index + 1}.`}</Text>
      <FormInput.MultiTextInput
        label={''}
        placeholder={selectedManifest === ManifestDataType.KustomizePatches ? manifestPathPlaceholder : pathPlaceholder}
        name={`paths[${index}].path`}
        style={{ width: 275 }}
        multiTextInputProps={{
          expressions,
          allowableTypes: allowableTypes.filter(allowedType => allowedType !== MultiTypeInputType.RUNTIME)
        }}
      />
    </>
  )
}

function KustomizePatchDetails({
  stepName,
  expressions,
  allowableTypes,
  initialValues,
  selectedManifest,
  prevStepData,
  previousStep,
  isReadonly = false,
  handleSubmit,
  manifestIdsList
}: StepProps<ConnectorConfigDTO> & KustomizePathPropTypes): React.ReactElement {
  const { getString } = useStrings()
  const gitConnectionType: string = prevStepData?.store === ManifestStoreMap.Git ? 'connectionType' : 'type'
  const connectionType =
    prevStepData?.connectorRef?.connector?.spec?.[gitConnectionType] === GitRepoName.Repo ||
    prevStepData?.urlType === GitRepoName.Repo
      ? GitRepoName.Repo
      : GitRepoName.Account

  const onDragStart = useCallback((event: React.DragEvent<HTMLDivElement>, index: number) => {
    event.dataTransfer.setData('data', index.toString())
    event.currentTarget.classList.add(css.dragging)
  }, [])

  const onDragEnd = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove(css.dragging)
  }, [])

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.currentTarget.classList.remove(css.dragOver)
  }, [])

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    /* istanbul ignore else */
    if (event.preventDefault) {
      event.preventDefault()
    }
    event.currentTarget.classList.add(css.dragOver)
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>, arrayHelpers: FieldArrayRenderProps, droppedIndex: number) => {
      /* istanbul ignore else */
      if (event.preventDefault) {
        event.preventDefault()
      }
      const data = event.dataTransfer.getData('data')
      /* istanbul ignore else */
      if (data) {
        const index = parseInt(data, 10)
        arrayHelpers.swap(index, droppedIndex)
      }
      event.currentTarget.classList.remove(css.dragOver)
    },
    []
  )

  const accountUrl =
    connectionType === GitRepoName.Account
      ? prevStepData?.connectorRef
        ? prevStepData?.connectorRef?.connector?.spec?.url
        : prevStepData?.url
      : null

  const submitFormData = (formData: KustomizePatchDataType & { store?: string; connectorRef?: string }): void => {
    const manifestObj = submitKustomizePatchData(formData, connectionType)
    handleSubmit(manifestObj)
  }

  const getInitialValues = (): KustomizePatchDataType => {
    const specValues = get(initialValues, 'spec.store.spec', null)

    if (specValues) {
      return {
        ...specValues,
        identifier: initialValues.identifier,
        repoName: getRepositoryName(prevStepData, initialValues),
        paths:
          typeof specValues.paths === 'string'
            ? specValues.paths
            : specValues.paths.map((path: string) => ({
                id: uuid('', nameSpace()),
                path: path
              }))
      }
    }
    return {
      identifier: '',
      branch: undefined,
      commitId: undefined,
      repoName: getRepositoryName(prevStepData, initialValues),
      gitFetchType: 'Branch',
      paths: [{ path: '', id: uuid('', nameSpace()) }]
    }
  }
  const defaultValueToReset = [{ path: '', uuid: uuid('', nameSpace()) }]

  return (
    <Layout.Vertical spacing="xxlarge" padding="small" className={css.manifestStore}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {stepName}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="kustomizePath"
        validationSchema={Yup.object().shape({
          ...ManifestIdentifierValidation(manifestIdsList, initialValues?.identifier, getString('pipeline.uniqueName')),
          branch: Yup.string().when('gitFetchType', {
            is: 'Branch',
            then: Yup.string().trim().required(getString('validation.branchName'))
          }),
          commitId: Yup.string().when('gitFetchType', {
            is: 'Commit',
            then: Yup.string().trim().required(getString('validation.commitId'))
          }),
          paths: Yup.lazy((value): Yup.Schema<unknown> => {
            if (getMultiTypeFromValue(value as any) === MultiTypeInputType.FIXED) {
              return Yup.array().of(
                Yup.object().shape({
                  path: Yup.string().min(1).required(getString('pipeline.manifestType.pathRequired'))
                })
              )
            }
            return Yup.string().required(getString('pipeline.manifestType.pathRequired'))
          }),
          repoName: Yup.string().test('repoName', getString('common.validation.repositoryName'), value => {
            if (
              connectionType === GitRepoName.Repo ||
              getMultiTypeFromValue(prevStepData?.connectorRef) !== MultiTypeInputType.FIXED
            ) {
              return true
            }
            return !isEmpty(value) && value?.length > 0
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
        {(formik: { setFieldValue: (a: string, b: string) => void; values: KustomizePatchDataType }) => (
          <Form>
            <div className={helmcss.helmGitForm}>
              <Layout.Horizontal flex spacing="huge">
                <div className={helmcss.halfWidth}>
                  <FormInput.Text
                    name="identifier"
                    label={getString('pipeline.manifestType.manifestIdentifier')}
                    placeholder={getString('pipeline.manifestType.manifestPlaceholder')}
                  />
                </div>
              </Layout.Horizontal>
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
                <div className={helmcss.halfWidth}>
                  <FormInput.Select
                    name="gitFetchType"
                    label={getString('pipeline.manifestType.gitFetchTypeLabel')}
                    items={gitFetchTypeList}
                  />
                </div>
                {formik.values?.gitFetchType === GitFetchTypes.Branch &&
                  renderBranch(
                    formik,
                    isReadonly,
                    getString('pipelineSteps.deploy.inputSet.branch'),
                    getString('pipeline.manifestType.branchPlaceholder'),
                    expressions,
                    allowableTypes
                  )}

                {formik.values?.gitFetchType === GitFetchTypes.Commit &&
                  renderCommitId(
                    formik,
                    isReadonly,
                    getString('pipeline.manifestType.commitId'),
                    getString('pipeline.manifestType.commitPlaceholder'),
                    expressions,
                    allowableTypes
                  )}
              </Layout.Horizontal>
              <div className={css.halfWidth}>
                <MultiTypeFieldSelector
                  defaultValueToReset={defaultValueToReset}
                  name={'paths'}
                  label={
                    <Text>
                      {selectedManifest === ManifestDataType.KustomizePatches
                        ? getString('fileFolderPathText')
                        : getString('common.git.filePath')}
                    </Text>
                  }
                >
                  <FieldArray
                    name="paths"
                    render={arrayHelpers => (
                      <Layout.Vertical>
                        {formik.values?.paths?.map((path: { path: string; uuid: string }, index: number) => (
                          <Layout.Horizontal
                            key={path.uuid}
                            flex={{ distribution: 'space-between' }}
                            style={{ alignItems: 'end' }}
                          >
                            <Layout.Horizontal
                              spacing="medium"
                              style={{ alignItems: 'baseline' }}
                              draggable={true}
                              onDragStart={event => {
                                onDragStart(event, index)
                              }}
                              onDragEnd={onDragEnd}
                              onDragOver={onDragOver}
                              onDragLeave={onDragLeave}
                              onDrop={event => onDrop(event, arrayHelpers, index)}
                            >
                              {renderPathArr({
                                index,
                                selectedManifest,
                                manifestPathPlaceholder: getString('pipeline.manifestType.manifestPathPlaceholder'),
                                pathPlaceholder: getString('pipeline.manifestType.pathPlaceholder'),
                                expressions,
                                allowableTypes
                              })}

                              {formik.values?.paths?.length > 1 && (
                                <Button minimal icon="main-trash" onClick={() => arrayHelpers.remove(index)} />
                              )}
                            </Layout.Horizontal>
                          </Layout.Horizontal>
                        ))}
                        <span>
                          <Button
                            text={getString('addFileText')}
                            variation={ButtonVariation.LINK}
                            className={css.addFileButton}
                            onClick={() => arrayHelpers.push({ path: '', uuid: uuid('', nameSpace()) })}
                          />
                        </span>
                      </Layout.Vertical>
                    )}
                  />
                </MultiTypeFieldSelector>
              </div>
            </div>
            <Layout.Horizontal spacing="medium">
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

export default KustomizePatchDetails
