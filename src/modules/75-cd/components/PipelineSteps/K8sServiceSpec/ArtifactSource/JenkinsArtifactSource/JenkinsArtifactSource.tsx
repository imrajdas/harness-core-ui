/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useRef, useState } from 'react'
import { cloneDeep, defaultTo, get, isEqual } from 'lodash-es'

import {
  FormInput,
  getMultiTypeFromValue,
  Layout,
  MultiSelectOption,
  MultiTypeInputType,
  SelectOption
} from '@wings-software/uicore'
import type { SubmenuSelectOption } from '@harness/uicore/dist/components/SelectWithSubmenu/SelectWithSubmenu'
import { PopoverInteractionKind } from '@blueprintjs/core'
import { ArtifactSourceBase, ArtifactSourceRenderProps } from '@cd/factory/ArtifactSourceFactory/ArtifactSourceBase'
import { FormMultiTypeConnectorField } from '@connectors/components/ConnectorReferenceField/FormMultiTypeConnectorField'
import {
  BuildDetails,
  JobDetails,
  SidecarArtifact,
  useGetArtifactPathForJenkins,
  useGetBuildsForJenkins,
  useGetJobDetailsForJenkins
} from 'services/cd-ng'

import { ArtifactToConnectorMap, ENABLED_ARTIFACT_TYPES } from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import { useStrings } from 'framework/strings'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { isFieldRuntime } from '../../K8sServiceSpecHelper'
import {
  getDefaultQueryParam,
  getImagePath,
  isArtifactSourceRuntime,
  isFieldfromTriggerTabDisabled,
  resetTags
} from '../artifactSourceUtils'
import css from '../../K8sServiceSpec.module.scss'

interface JenkinsRenderContent extends ArtifactSourceRenderProps {
  isTagsSelectionDisabled: (data: ArtifactSourceRenderProps) => boolean
}
const Content = (props: JenkinsRenderContent): React.ReactElement => {
  const {
    isPrimaryArtifactsRuntime,
    isSidecarRuntime,
    template,
    formik,
    path,
    initialValues,
    accountId,
    projectIdentifier,
    orgIdentifier,
    readonly,
    repoIdentifier,
    branch,
    stageIdentifier,
    isTagsSelectionDisabled,
    allowableTypes,
    fromTrigger,
    artifact,
    isSidecar,
    artifactPath
  } = props

  const { getString } = useStrings()
  const lastOpenedJob = useRef<any>(null)
  const { expressions } = useVariablesExpression()
  const [jobDetails, setJobDetails] = useState<SubmenuSelectOption[]>([])
  const selectedJobName = useRef<string | null>(null)
  const [artifactPaths, setArtifactPaths] = useState<SelectOption[]>([])
  const [build, setJenkinsBuilds] = useState<SelectOption[]>([])
  const commonParams = {
    accountIdentifier: accountId,
    projectIdentifier,
    orgIdentifier,
    repoIdentifier,
    branch
  }

  const connectorRefValue = getDefaultQueryParam(
    artifact?.spec?.connectorRef,
    get(initialValues?.artifacts, `${artifactPath}.spec.connectorRef`, '')
  )

  const jobNameValue = getDefaultQueryParam(
    artifact?.spec?.jobName,
    get(initialValues?.artifacts, `${artifactPath}.spec.jobName`, '')
  )

  const artifactPathValue = getDefaultQueryParam(
    artifact?.spec?.artifactPath,
    get(initialValues?.artifacts, `${artifactPath}.spec.artifactPath`, '')
  )

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
    jobName: encodeURIComponent(encodeURIComponent(jobNameValue))
  })

  const {
    refetch: refetchJenkinsBuild,
    data: jenkinsBuildResponse,
    loading: fetchingBuild
  } = useGetBuildsForJenkins({
    queryParams: {
      ...commonParams,
      connectorRef: connectorRefValue?.toString(),
      artifactPath: artifactPathValue || ''
    },
    jobName: encodeURIComponent(encodeURIComponent(jobNameValue))
  })

  useEffect(() => {
    refetchJobs({
      queryParams: {
        ...commonParams,
        connectorRef: connectorRefValue?.toString()
      }
    })
  }, [])

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
      setArtifactPaths(artifactPathResponseFormatted)
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
    const jobName = get(formik, `values.${path}.artifacts.${artifactPath}.spec.jobName`)
    if (jobName?.split('/').length > 1) {
      const parentJobName = jobName?.split('/')[0]
      const parentJob = jobDetails?.find(job => job.label === parentJobName)
      if (!parentJob?.submenuItems?.length) {
        refetchJobs({
          queryParams: {
            ...commonParams,
            connectorRef: connectorRefValue?.toString(),
            parentJobName
          }
        })
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

  const isFieldDisabled = (fieldName: string, isTag = false): boolean => {
    /* instanbul ignore else */
    if (
      readonly ||
      isFieldfromTriggerTabDisabled(
        fieldName,
        formik,
        stageIdentifier,
        fromTrigger,
        isSidecar ? (artifact as SidecarArtifact)?.identifier : undefined
      )
    ) {
      return true
    }
    if (isTag) {
      return isTagsSelectionDisabled(props)
    }
    return false
  }
  const isRuntime = isArtifactSourceRuntime(isPrimaryArtifactsRuntime, isSidecarRuntime, isSidecar as boolean)

  const getJobDetailsValue = (): SubmenuSelectOption | undefined => {
    const jobName = get(formik, `values.${path}.artifacts.${artifactPath}.spec.jobName`)
    if (jobName?.split('/').length > 1) {
      const parentJobName = jobName?.split('/')[0]
      const parentJob = jobDetails?.find(job => job.label === parentJobName)
      if (parentJob?.submenuItems?.length) {
        const targetChildJob = parentJob.submenuItems?.find(job => job.label === jobName)
        return targetChildJob as SubmenuSelectOption
      }
    }
    const existingJob = jobDetails.find(
      job => job.label === get(formik, `values.${path}.artifacts.${artifactPath}.spec.jobName`)
    ) as SubmenuSelectOption
    if (existingJob) return existingJob
    return {
      label: jobName,
      value: jobName
    } as SubmenuSelectOption
  }

  return (
    <>
      {isRuntime && (
        <Layout.Vertical key={artifactPath} className={css.inputWidth}>
          {isFieldRuntime(`artifacts.${artifactPath}.spec.connectorRef`, template) && (
            <FormMultiTypeConnectorField
              name={`${path}.artifacts.${artifactPath}.spec.connectorRef`}
              label={getString('pipelineSteps.deploy.inputSet.artifactServer')}
              selected={get(initialValues, `artifacts.${artifactPath}.spec.connectorRef`, '')}
              placeholder={''}
              accountIdentifier={accountId}
              projectIdentifier={projectIdentifier}
              orgIdentifier={orgIdentifier}
              width={391}
              setRefValue
              disabled={isFieldDisabled(`artifacts.${artifactPath}.spec.connectorRef`)}
              multiTypeProps={{
                allowableTypes,
                expressions
              }}
              onChange={() => resetTags(formik, `${path}.artifacts.${artifactPath}.spec.tag`)}
              className={css.connectorMargin}
              type={ArtifactToConnectorMap[defaultTo(artifact?.type, '')]}
              gitScope={{
                repo: defaultTo(repoIdentifier, ''),
                branch: defaultTo(branch, ''),
                getDefaultFromOtherRepo: true
              }}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.jobName`, template) && (
            <FormInput.SelectWithSubmenuTypeInput
              label={'Job Name'}
              name={`${path}.artifacts.${artifactPath}.spec.jobName`}
              placeholder={
                connectorRefValue && getMultiTypeFromValue(connectorRefValue) === MultiTypeInputType.FIXED
                  ? fetchingJobs
                    ? 'Fetching jobs...'
                    : fetchingJobsError?.message
                    ? fetchingJobsError?.message
                    : getString('select')
                  : getString('select')
              }
              value={getJobDetailsValue()}
              selectItems={jobDetails}
              selectWithSubmenuTypeInputProps={{
                allowableTypes,
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
                    formik.setFieldValue(`${path}.artifacts.${artifactPath}.spec.jobName`, newJobName.label)
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
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.artifactPath`, template) && (
            <FormInput.MultiTypeInput
              label={getString('pipeline.artifactPathLabel')}
              name={`${path}.artifacts.${artifactPath}.spec.artifactPath`}
              useValue
              placeholder={
                fetchingArtifacts ? getString('loading') : getString('pipeline.selectArtifactPathPlaceholder')
              }
              multiTypeInputProps={{
                onTypeChange: (type: MultiTypeInputType) =>
                  formik.setFieldValue(`${path}.artifacts.${artifactPath}.spec.artifactPath`, type),
                width: 500,
                expressions,
                allowableTypes,
                onChange: (newFilePath: any) => {
                  if (
                    getMultiTypeFromValue(selectedJobName.current as any) === MultiTypeInputType.FIXED &&
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
                  addClearBtn: !readonly,
                  items: defaultTo(artifactPaths, [])
                }
              }}
              selectItems={artifactPaths || []}
            />
          )}
          {isFieldRuntime(`artifacts.${artifactPath}.spec.build`, template) && (
            <FormInput.MultiTypeInput
              label={getString('pipeline.jenkinsBuild')}
              name={`${path}.artifacts.${artifactPath}.spec.build`}
              useValue
              placeholder={fetchingBuild ? getString('loading') : getString('pipeline.selectJenkinsBuildsPlaceholder')}
              multiTypeInputProps={{
                onTypeChange: (type: MultiTypeInputType) =>
                  formik.setFieldValue(`${path}.artifacts.${artifactPath}.spec.build`, type),
                width: 500,
                expressions,
                allowableTypes,
                selectProps: {
                  allowCreatingNewItems: true,
                  addClearBtn: !readonly,
                  items: defaultTo(build, [])
                }
              }}
              selectItems={build || []}
            />
          )}
        </Layout.Vertical>
      )}
    </>
  )
}

export class JenkinsArtifactSource extends ArtifactSourceBase<ArtifactSourceRenderProps> {
  protected artifactType = ENABLED_ARTIFACT_TYPES.Jenkins
  protected isSidecar = false

  isTagsSelectionDisabled(props: ArtifactSourceRenderProps): boolean {
    const { initialValues, artifactPath, artifact } = props

    const isImagePathPresent = getImagePath(
      artifact?.spec?.imagePath,
      get(initialValues, `artifacts.${artifactPath}.spec.imagePath`, '')
    )
    const isConnectorPresent = getDefaultQueryParam(
      artifact?.spec?.connectorRef,
      get(initialValues, `artifacts.${artifactPath}.spec.connectorRef`, '')
    )

    return !(isImagePathPresent && isConnectorPresent)
  }

  renderContent(props: ArtifactSourceRenderProps): JSX.Element | null {
    if (!props.isArtifactsRuntime) {
      return null
    }

    this.isSidecar = defaultTo(props.isSidecar, false)

    return <Content {...props} isTagsSelectionDisabled={this.isTagsSelectionDisabled.bind(this)} />
  }
}
