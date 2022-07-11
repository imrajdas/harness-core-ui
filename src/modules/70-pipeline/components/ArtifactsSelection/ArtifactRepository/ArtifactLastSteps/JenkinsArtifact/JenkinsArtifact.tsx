/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState, useRef } from 'react'
import {
  Formik,
  Layout,
  Button,
  StepProps,
  Text,
  ButtonVariation,
  MultiTypeInputType,
  SelectOption,
  getMultiTypeFromValue,
  FormInput,
  MultiSelectOption
} from '@wings-software/uicore'
import { Form } from 'formik'
import * as Yup from 'yup'
import { FontVariation } from '@harness/design-system'
import { cloneDeep, defaultTo, isEqual } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { PopoverInteractionKind } from '@blueprintjs/core'
import { useStrings } from 'framework/strings'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'

import {
  ConnectorConfigDTO,
  JobDetails,
  useGetArtifactPathForJenkins,
  useGetJobDetailsForJenkins,
  useGetBuildsForJenkins,
  BuildDetails
} from 'services/cd-ng'
import { getConnectorIdValue, getJenkinsFormData } from '@pipeline/components/ArtifactsSelection/ArtifactUtils'
import type {
  ArtifactType,
  JenkinsArtifactProps,
  JenkinsArtifactType
} from '@pipeline/components/ArtifactsSelection/ArtifactInterface'
import { getGenuineValue } from '@pipeline/components/PipelineSteps/Steps/JiraApproval/helper'
import type { SubmenuSelectOption } from '@pipeline/components/PipelineSteps/Steps/JenkinsStep/types'
import { ConfigureOptions } from '@common/components/ConfigureOptions/ConfigureOptions'
import { ArtifactIdentifierValidation, ModalViewFor } from '../../../ArtifactHelper'
import SideCarArtifactIdentifier from '../SideCarArtifactIdentifier'
import css from '../../ArtifactConnector.module.scss'

function FormComponent({
  context,
  expressions,
  allowableTypes,
  prevStepData,
  initialValues,
  previousStep,
  isReadonly = false,
  formik
}: any) {
  const { getString } = useStrings()
  const lastOpenedJob = useRef<any>(null)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const [jobDetails, setJobDetails] = useState<SubmenuSelectOption[]>([])
  const selectedJobName = useRef<string | null>(null)
  const [artifactPath, setFilePath] = useState<SelectOption[]>([])
  const [build, setJenkinsBuilds] = useState<SelectOption[]>([])
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }

  const connectorRefValue = getGenuineValue(prevStepData?.connectorId?.label)

  const {
    refetch: refetchJobs,
    data: jobsResponse,
    loading: fetchingJobs,
    error: fetchingJobsError
  } = useGetJobDetailsForJenkins({
    lazy: true,
    queryParams: {
      ...commonParams,
      connectorRef: connectorRefValue?.toString()
    }
  })

  const {
    refetch: refetchartifactPaths,
    data: artifactPathsResponse,
    loading: fetchingArtifacts
  } = useGetArtifactPathForJenkins({
    queryParams: {
      ...commonParams,
      connectorRef: connectorRefValue?.toString()
    },
    jobName: encodeURIComponent(encodeURIComponent(initialValues?.spec?.jobName as string))
  })

  const {
    refetch: refetchJenkinsBuild,
    data: jenkinsBuildResponse,
    loading: fetchingBuild
  } = useGetBuildsForJenkins({
    queryParams: {
      ...commonParams,
      connectorRef: connectorRefValue?.toString(),
      artifactPath: initialValues?.spec?.artifactPath || ''
    },
    jobName: encodeURIComponent(encodeURIComponent(initialValues?.spec?.jobName as string))
  })

  useEffect(() => {
    refetchJobs({
      queryParams: {
        ...commonParams,
        connectorRef: connectorRefValue?.toString()
      }
    })
  }, [prevStepData])

  useEffect(() => {
    if (artifactPathsResponse?.data) {
      const artifactPathResponseFormatted: MultiSelectOption[] = artifactPathsResponse?.data?.map(
        (artifactPathVal: string) => {
          return {
            label: artifactPathVal,
            value: artifactPathVal
          } as MultiSelectOption
        }
      )
      setFilePath(artifactPathResponseFormatted)
    }
  }, [artifactPathsResponse])

  useEffect(() => {
    if (jenkinsBuildResponse?.data) {
      const jenkinsBuildsResponseFormatted: MultiSelectOption[] = jenkinsBuildResponse?.data?.map(
        (jenkinsBuild: BuildDetails) => {
          return {
            label: jenkinsBuild.uiDisplayName,
            value: jenkinsBuild.number
          } as MultiSelectOption
        }
      )
      setJenkinsBuilds(jenkinsBuildsResponseFormatted)
    }
  }, [jenkinsBuildResponse])

  const getJobItems = (jobs: JobDetails[]): SubmenuSelectOption[] => {
    return jobs?.map(job => {
      return {
        label: job.jobName || '',
        value: job.url || '',
        submenuItems: [],
        hasSubItems: job.folder
      }
    })
  }

  useEffect(() => {
    if (typeof formik.values?.spec?.jobName === 'string' && jobDetails?.length) {
      const targetJob = jobsResponse?.data?.jobDetails?.find(job => job.jobName === initialValues?.spec.jobName)
      if (targetJob) {
        const jobObj = {
          label: targetJob?.jobName || '',
          value: targetJob?.url || '',
          submenuItems: [],
          hasSubItems: targetJob?.folder
        }
        formik.setValues({
          ...formik.values,
          spec: {
            ...formik.values.spec,
            jobName: jobObj as any
          }
        })
      } else {
        if (formik.values.spec.jobName?.split('/').length > 1) {
          const parentJobName = formik.values.spec.jobName?.split('/')[0]
          lastOpenedJob.current = parentJobName
          const parentJob = jobDetails?.find(job => job.label === parentJobName)
          if (parentJob?.submenuItems?.length) {
            const targetChildJob = parentJob.submenuItems?.find(job => job.label === formik.values?.spec?.jobName)
            formik.setValues({
              ...formik.values,
              spec: {
                ...formik.values.spec,
                jobName: targetChildJob as any
              }
            })
          } else {
            refetchJobs({
              queryParams: {
                ...commonParams,
                connectorRef: connectorRefValue?.toString(),
                parentJobName
              }
            })
          }
        }
      }
    }
  }, [jobDetails])

  useEffect(() => {
    if (lastOpenedJob.current) {
      setJobDetails((prevState: SubmenuSelectOption[]) => {
        const clonedJobDetails = cloneDeep(prevState)
        const parentJob = clonedJobDetails.find(obj => obj.value === lastOpenedJob.current)
        if (parentJob) {
          parentJob.submenuItems = [...getJobItems(jobsResponse?.data?.jobDetails || [])]
        }
        return clonedJobDetails
      })
    } else {
      const jobs = jobsResponse?.data?.jobDetails?.map(job => {
        return {
          label: job.jobName || '',
          value: job.url || '',
          submenuItems: [],
          hasSubItems: job.folder
        }
      })
      if (!isEqual(jobs, jobDetails)) {
        setJobDetails(jobs || [])
      }
    }
  }, [jobsResponse])

  return (
    <Form>
      <div className={css.connectorForm}>
        {context === ModalViewFor.SIDECAR && <SideCarArtifactIdentifier />}
        <div className={css.jenkinsFieldContainer}>
          <FormInput.SelectWithSubmenuTypeInput
            label={'Job Name'}
            name={'spec.jobName'}
            placeholder={
              connectorRefValue && getMultiTypeFromValue(connectorRefValue) === MultiTypeInputType.FIXED
                ? fetchingJobs
                  ? 'Fetching jobs...'
                  : fetchingJobsError?.message
                  ? fetchingJobsError?.message
                  : getString('select')
                : getString('select')
            }
            selectItems={jobDetails}
            selectWithSubmenuTypeInputProps={{
              expressions,
              width: 500,
              selectWithSubmenuProps: {
                loading: fetchingJobs,
                items: jobDetails,
                interactionKind: PopoverInteractionKind.CLICK,
                allowCreatingNewItems: true,
                onChange: (primaryValue, secondaryValue, type) => {
                  const newJobName =
                    type === MultiTypeInputType.FIXED && primaryValue && secondaryValue
                      ? secondaryValue
                      : primaryValue || ''
                  formik.setFieldValue('spec.jobName', newJobName)
                  setJenkinsBuilds([])
                  selectedJobName.current =
                    type === MultiTypeInputType.RUNTIME ? (newJobName as unknown as string) : newJobName.label
                  if (type === MultiTypeInputType.FIXED && newJobName?.label?.length) {
                    refetchartifactPaths({
                      queryParams: {
                        ...commonParams,
                        connectorRef: connectorRefValue?.toString()
                      },
                      pathParams: {
                        jobName: encodeURIComponent(encodeURIComponent(newJobName?.label))
                      }
                    })
                    refetchJenkinsBuild({
                      queryParams: {
                        ...commonParams,
                        connectorRef: connectorRefValue?.toString(),
                        artifactPath: ''
                      },
                      pathParams: {
                        jobName: encodeURIComponent(encodeURIComponent(selectedJobName.current || ''))
                      }
                    })
                  }
                },
                onOpening: (item: SelectOption) => {
                  lastOpenedJob.current = item.value
                  // TODO: To scroll the jobDetails component to its original height
                  // const indexOfParent = jobDetails.findIndex(obj => obj.value === item.value)
                  // const parentNode = document.getElementsByClassName('Select--menuItem')?.[indexOfParent]
                  // if (parentNode) {
                  //   parentJobY.current = parentNode.getBoundingClientRect()?.y
                  // }
                  refetchJobs({
                    queryParams: {
                      ...commonParams,
                      connectorRef: connectorRefValue?.toString(),
                      parentJobName: item.label
                    }
                  })
                }
              }
            }}
          />
          {getMultiTypeFromValue(formik.values.spec?.jobName) === MultiTypeInputType.RUNTIME && (
            <ConfigureOptions
              value={formik.values?.spec?.jobName as string}
              style={{ marginTop: 22 }}
              type="String"
              variableName="spec.jobName"
              showRequiredField={false}
              showDefaultField={false}
              showAdvanced={true}
              onChange={value => formik.setFieldValue('spec.jobName', value)}
              isReadonly={isReadonly}
            />
          )}
        </div>
        <div className={css.jenkinsFieldContainer}>
          <FormInput.MultiTypeInput
            label={getString('pipeline.artifactPathLabel')}
            name="spec.artifactPath"
            useValue
            placeholder={fetchingArtifacts ? getString('loading') : getString('pipeline.selectArtifactPathPlaceholder')}
            multiTypeInputProps={{
              onTypeChange: (type: MultiTypeInputType) => formik.setFieldValue('spec.artifactPath', type),
              width: 500,
              expressions,
              onChange: (newFilePath: any) => {
                if (
                  getMultiTypeFromValue(selectedJobName.current as any) !== MultiTypeInputType.RUNTIME &&
                  getMultiTypeFromValue(newFilePath.value) === MultiTypeInputType.FIXED
                ) {
                  refetchJenkinsBuild({
                    queryParams: {
                      ...commonParams,
                      connectorRef: connectorRefValue?.toString(),
                      artifactPath: newFilePath.value
                    },
                    pathParams: {
                      jobName: encodeURIComponent(encodeURIComponent(selectedJobName.current || ''))
                    }
                  })
                }
              },
              selectProps: {
                allowCreatingNewItems: true,
                addClearBtn: !isReadonly,
                items: defaultTo(artifactPath, [])
              },
              allowableTypes
            }}
            selectItems={artifactPath || []}
          />
          {getMultiTypeFromValue(formik.values?.spec?.artifactPath) === MultiTypeInputType.RUNTIME && (
            <div className={css.configureOptions}>
              <ConfigureOptions
                value={formik.values?.spec?.artifactPath}
                type="String"
                variableName="spec.artifactPath"
                showRequiredField={false}
                showDefaultField={false}
                showAdvanced={true}
                onChange={value => {
                  formik.setFieldValue('spec.artifactPath', value)
                }}
                isReadonly={isReadonly}
              />
            </div>
          )}
        </div>
        <div className={css.jenkinsFieldContainer}>
          <FormInput.MultiTypeInput
            label={getString('pipeline.jenkinsBuild')}
            name="spec.build"
            useValue
            placeholder={fetchingBuild ? getString('loading') : getString('pipeline.selectJenkinsBuildsPlaceholder')}
            multiTypeInputProps={{
              onTypeChange: (type: MultiTypeInputType) => formik.setFieldValue('spec.build', type),
              width: 500,
              expressions,
              selectProps: {
                allowCreatingNewItems: true,
                addClearBtn: !isReadonly,
                items: defaultTo(build, [])
              },
              allowableTypes
            }}
            selectItems={build || []}
          />
          {getMultiTypeFromValue(formik.values?.spec?.build) === MultiTypeInputType.RUNTIME && (
            <div className={css.configureOptions}>
              <ConfigureOptions
                value={formik.values?.spec?.build}
                type="String"
                variableName="spec.build"
                showRequiredField={false}
                showDefaultField={false}
                showAdvanced={true}
                onChange={value => {
                  formik.setFieldValue('spec.build', value)
                }}
                isReadonly={isReadonly}
              />
            </div>
          )}
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
  )
}

export function JenkinsArtifact(props: StepProps<ConnectorConfigDTO> & JenkinsArtifactProps): React.ReactElement {
  const { getString } = useStrings()
  const { context, handleSubmit, initialValues, prevStepData, selectedArtifact, artifactIdentifiers } = props

  const getInitialValues = (): JenkinsArtifactType => {
    return getJenkinsFormData(
      initialValues,
      selectedArtifact as ArtifactType,
      context === ModalViewFor.SIDECAR
    ) as JenkinsArtifactType
  }

  const submitFormData = (formData: JenkinsArtifactType, connectorId?: string): void => {
    handleSubmit({
      identifier: formData.identifier,
      spec: {
        connectorRef: connectorId,
        artifactPath: formData.spec.artifactPath,
        build: formData.spec.build,
        jobName:
          getMultiTypeFromValue(formData.spec?.jobName) === MultiTypeInputType.FIXED
            ? (formData.spec?.jobName as SelectOption).label
            : formData.spec?.jobName
      }
    })
  }

  const schemaObject = {
    spec: Yup.object().shape({
      jobName: Yup.lazy(value =>
        typeof value === 'object'
          ? Yup.object().required(getString('pipeline.jenkinsStep.validations.jobName')) // typeError is necessary here, otherwise we get a bad-looking yup error
          : Yup.string().required(getString('pipeline.jenkinsStep.validations.jobName'))
      ),
      artifactPath: Yup.string(),
      build: Yup.string().required('Build is a required Field')
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

  return (
    <Layout.Vertical spacing="medium" className={css.firstep}>
      <Text font={{ variation: FontVariation.H3 }} margin={{ bottom: 'medium' }}>
        {getString('pipeline.artifactsSelection.artifactDetails')}
      </Text>
      <Formik
        initialValues={getInitialValues()}
        formName="imagePath"
        validationSchema={context === ModalViewFor.SIDECAR ? sidecarSchema : primarySchema}
        onSubmit={formData => {
          submitFormData(
            {
              ...formData
            },
            getConnectorIdValue(prevStepData)
          )
        }}
      >
        {formik => {
          return <FormComponent {...props} formik={formik} />
        }}
      </Formik>
    </Layout.Vertical>
  )
}
