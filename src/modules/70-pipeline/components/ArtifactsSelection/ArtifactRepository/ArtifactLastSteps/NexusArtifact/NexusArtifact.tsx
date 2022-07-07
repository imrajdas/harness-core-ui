/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useCallback, useEffect, useState } from 'react'
import {
  Formik,
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiTypeInputType,
  Button,
  StepProps,
  Text,
  ButtonVariation
} from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { Form } from 'formik'
import * as Yup from 'yup'
import { defaultTo, isEmpty, merge } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'

import { ConnectorConfigDTO, DockerBuildDetailsDTO, useGetBuildDetailsForNexusArtifact } from 'services/cd-ng'
import {
  checkIfQueryParamsisNotEmpty,
  getArtifactFormData,
  getConnectorIdValue,
  getFinalArtifactFormObj,
  repositoryFormat,
  resetTag,
  shouldFetchTags
} from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { ArtifactType, ImagePathProps, ImagePathTypes, RepositoryPortOrServer } from '../../../ArtifactInterface'
import { ArtifactIdentifierValidation, ModalViewFor, repositoryPortOrServer } from '../../../ArtifactHelper'
import ArtifactImagePathTagView from '../ArtifactImagePathTagView/ArtifactImagePathTagView'
import SideCarArtifactIdentifier from '../SideCarArtifactIdentifier'
import css from '../../ArtifactConnector.module.scss'

export function NexusArtifact({
  context,
  handleSubmit,
  expressions,
  allowableTypes,
  prevStepData,
  initialValues,
  previousStep,
  artifactIdentifiers,
  isReadonly = false,
  selectedArtifact
}: StepProps<ConnectorConfigDTO> & ImagePathProps<ImagePathTypes>): React.ReactElement {
  const { getString } = useStrings()
  const [lastQueryData, setLastQueryData] = useState({ artifactPath: '', repository: '' })
  const [tagList, setTagList] = useState<DockerBuildDetailsDTO[] | undefined>([])
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()

  const schemaObject = {
    artifactPath: Yup.string().trim().required(getString('pipeline.artifactsSelection.validation.artifactPath')),
    repository: Yup.string().trim().required(getString('common.git.validation.repoRequired')),
    tagType: Yup.string().required(),
    tagRegex: Yup.string().when('tagType', {
      is: 'regex',
      then: Yup.string().trim().required(getString('pipeline.artifactsSelection.validation.tagRegex'))
    }),
    tag: Yup.mixed().when('tagType', {
      is: 'value',
      then: Yup.mixed().required(getString('pipeline.artifactsSelection.validation.tag'))
    }),
    repositoryPortorRepositoryURL: Yup.string().required(),
    repositoryUrl: Yup.string().when('repositoryPortorRepositoryURL', {
      is: 'repositoryUrl',
      then: Yup.string().required(getString('pipeline.artifactsSelection.validation.repositoryUrl'))
    }),
    repositoryPort: Yup.string().when('repositoryPortorRepositoryURL', {
      is: 'repositoryPort',
      then: Yup.string().required(getString('pipeline.artifactsSelection.validation.repositoryPort'))
    })
  }

  const primarySchema = Yup.object().shape(schemaObject)
  const sidecarSchema = Yup.object().shape({
    ...schemaObject,
    ...ArtifactIdentifierValidation(
      artifactIdentifiers,
      initialValues?.identifier,
      getString('pipeline.uniqueIdentifier')
    )
  })

  const getConnectorRefQueryData = (): string => {
    return defaultTo(prevStepData?.connectorId?.value, prevStepData?.identifier)
  }

  const {
    data,
    loading: nexusBuildDetailsLoading,
    refetch: refetchNexusTag,
    error: nexusTagError
  } = useGetBuildDetailsForNexusArtifact({
    queryParams: {
      artifactPath: lastQueryData.artifactPath,
      repository: lastQueryData.repository,
      repositoryFormat,
      connectorRef: getConnectorRefQueryData(),
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    },
    lazy: true,
    debounce: 300
  })

  useEffect(() => {
    if (checkIfQueryParamsisNotEmpty(Object.values(lastQueryData))) {
      refetchNexusTag()
    }
  }, [lastQueryData, refetchNexusTag])

  useEffect(() => {
    if (nexusTagError) {
      setTagList([])
    } else if (Array.isArray(data?.data?.buildDetailsList)) {
      setTagList(data?.data?.buildDetailsList)
    }
  }, [data?.data?.buildDetailsList, nexusTagError])

  const canFetchTags = useCallback(
    (artifactPath: string, repository: string): boolean => {
      return !!(
        lastQueryData.artifactPath !== artifactPath ||
        lastQueryData.repository !== repository ||
        shouldFetchTags(prevStepData, [artifactPath, repository])
      )
    },
    [lastQueryData, prevStepData]
  )
  const fetchTags = useCallback(
    (artifactPath = '', repository = ''): void => {
      if (canFetchTags(artifactPath, repository)) {
        setLastQueryData({ artifactPath, repository })
      }
    },
    [canFetchTags]
  )

  const isTagDisabled = useCallback((formikValue): boolean => {
    return !checkIfQueryParamsisNotEmpty([formikValue.artifactPath, formikValue.repository])
  }, [])

  const getInitialValues = useCallback((): ImagePathTypes => {
    const values = getArtifactFormData(
      initialValues,
      selectedArtifact as ArtifactType,
      context === ModalViewFor.SIDECAR
    )

    merge(values, {
      repositoryPortorRepositoryURL: !isEmpty(values?.repositoryPort)
        ? RepositoryPortOrServer.RepositoryPort
        : RepositoryPortOrServer.RepositoryUrl
    })
    return values
  }, [context, initialValues, selectedArtifact])

  const submitFormData = (formData: ImagePathTypes & { connectorId?: string }): void => {
    const repositoryPortOrServerData =
      formData?.repositoryPortorRepositoryURL === RepositoryPortOrServer.RepositoryPort
        ? { repositoryPort: formData?.repositoryPort }
        : { repositoryUrl: formData?.repositoryUrl }

    const artifactObj = getFinalArtifactFormObj(formData, context === ModalViewFor.SIDECAR)
    merge(artifactObj.spec, {
      repository: formData?.repository,
      repositoryFormat,
      ...repositoryPortOrServerData
    })
    handleSubmit(artifactObj)
  }

  return (
    <Layout.Vertical spacing="medium" className={css.firstep}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {getString('pipeline.artifactsSelection.artifactDetails')}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="nexusArtifact"
        validationSchema={context === ModalViewFor.SIDECAR ? sidecarSchema : primarySchema}
        onSubmit={formData => {
          submitFormData({
            ...prevStepData,
            ...formData,
            tag: defaultTo(formData?.tag?.value, formData?.tag),
            connectorId: getConnectorIdValue(prevStepData)
          })
        }}
      >
        {formik => (
          <Form>
            <div className={css.connectorForm}>
              {context === ModalViewFor.SIDECAR && <SideCarArtifactIdentifier />}

              <div className={css.tagGroup}>
                <FormInput.RadioGroup
                  name="repositoryPortorRepositoryURL"
                  radioGroup={{ inline: true }}
                  items={repositoryPortOrServer}
                  className={css.radioGroup}
                />
              </div>

              {formik.values?.repositoryPortorRepositoryURL === RepositoryPortOrServer.RepositoryUrl && (
                <div className={css.imagePathContainer}>
                  <FormInput.MultiTextInput
                    label={getString('repositoryUrlLabel')}
                    name="repositoryUrl"
                    placeholder={getString('pipeline.repositoryUrlPlaceholder')}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                  />

                  {getMultiTypeFromValue(formik.values.repositoryUrl) === MultiTypeInputType.RUNTIME && (
                    <div className={css.configureOptions}>
                      <ConfigureOptions
                        style={{ alignSelf: 'center' }}
                        value={formik.values?.repositoryUrl as string}
                        type={getString('string')}
                        variableName="repositoryUrl"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => {
                          formik.setFieldValue('repositoryUrl', value)
                        }}
                        isReadonly={isReadonly}
                      />
                    </div>
                  )}
                </div>
              )}

              {formik.values?.repositoryPortorRepositoryURL === RepositoryPortOrServer.RepositoryPort && (
                <div className={css.imagePathContainer}>
                  <FormInput.MultiTextInput
                    label={getString('pipeline.artifactsSelection.repositoryPort')}
                    name="repositoryPort"
                    placeholder={getString('pipeline.artifactsSelection.repositoryPortPlaceholder')}
                    multiTextInputProps={{
                      expressions,
                      allowableTypes
                    }}
                  />

                  {getMultiTypeFromValue(formik.values.repositoryPort) === MultiTypeInputType.RUNTIME && (
                    <div className={css.configureOptions}>
                      <ConfigureOptions
                        style={{ alignSelf: 'center' }}
                        value={formik.values?.repositoryPort as unknown as string}
                        type={getString('string')}
                        variableName="repositoryPort"
                        showRequiredField={false}
                        showDefaultField={false}
                        showAdvanced={true}
                        onChange={value => {
                          formik.setFieldValue('repositoryPort', value)
                        }}
                        isReadonly={isReadonly}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className={css.imagePathContainer}>
                <FormInput.MultiTextInput
                  label={getString('repository')}
                  name="repository"
                  placeholder={getString('pipeline.artifactsSelection.repositoryPlaceholder')}
                  multiTextInputProps={{
                    expressions,
                    allowableTypes
                  }}
                  onChange={() => {
                    tagList?.length && setTagList([])
                    resetTag(formik)
                  }}
                />

                {getMultiTypeFromValue(formik.values.repository) === MultiTypeInputType.RUNTIME && (
                  <div className={css.configureOptions}>
                    <ConfigureOptions
                      style={{ alignSelf: 'center' }}
                      value={formik.values?.repository as string}
                      type={getString('string')}
                      variableName="repository"
                      showRequiredField={false}
                      showDefaultField={false}
                      showAdvanced={true}
                      onChange={value => {
                        formik.setFieldValue('repository', value)
                      }}
                      isReadonly={isReadonly}
                    />
                  </div>
                )}
              </div>

              <ArtifactImagePathTagView
                selectedArtifact={selectedArtifact as ArtifactType}
                formik={formik}
                expressions={expressions}
                allowableTypes={allowableTypes}
                isReadonly={isReadonly}
                connectorIdValue={getConnectorIdValue(prevStepData)}
                fetchTags={artifactPath => fetchTags(artifactPath, formik?.values?.repository)}
                buildDetailsLoading={nexusBuildDetailsLoading}
                tagError={nexusTagError}
                tagList={tagList}
                setTagList={setTagList}
                tagDisabled={isTagDisabled(formik?.values)}
                isArtifactPath={true}
              />
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

export default NexusArtifact
