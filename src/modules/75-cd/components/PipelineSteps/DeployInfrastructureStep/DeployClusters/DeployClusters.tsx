/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, isEqual, isNil, uniqBy } from 'lodash-es'
import { connect, FormikProps } from 'formik'

import {
  FormInput,
  getMultiTypeFromValue,
  MultiSelectTypeInput,
  MultiTypeInputType,
  RUNTIME_INPUT_VALUE,
  SelectOption,
  useToaster
} from '@harness/uicore'

import { useStrings } from 'framework/strings'
import { ClusterResponse, ClusterYaml, useGetClusterList } from 'services/cd-ng'

import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { useDeepCompareEffect } from '@common/hooks'

import useRBACError from '@rbac/utils/useRBACError/useRBACError'

import type { DeployStageConfig } from '@pipeline/utils/DeployStageInterface'

import css from './DeployClusters.module.scss'

interface DeployClusterProps {
  formik?: FormikProps<DeployStageConfig>
  readonly?: boolean
  environmentIdentifier: string
  allowableTypes: MultiTypeInputType[]
  path?: string
}

function DeployClusters({ formik, readonly, environmentIdentifier, allowableTypes, path }: DeployClusterProps) {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const [firstLoad, setFirstLoad] = useState(true)

  const [clustersRefType, setClustersRefType] = useState<MultiTypeInputType>(
    getMultiTypeFromValue(formik?.values?.clusterRef)
  )

  const {
    data: clustersResponse,
    loading: clustersLoading,
    error: clustersError
  } = useGetClusterList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      environmentIdentifier
    }
  })

  const [clusters, setClusters] = useState<ClusterResponse[]>()
  const [clustersSelectOptions, setClustersSelectOptions] = useState<SelectOption[]>()
  const [selectedClusters, setSelectedClusters] = useState<SelectOption[]>()

  useDeepCompareEffect(() => {
    if (firstLoad && clustersSelectOptions?.length && path) {
      setFirstLoad(false)
      const { deployToAll, gitOpsClusters } = get(formik?.values, defaultTo(path, ''))

      if (deployToAll) {
        setSelectedClusters([clustersSelectOptions[0]])
      } else if (gitOpsClusters?.length) {
        const clusterIdentifiers = gitOpsClusters.map((cluster: ClusterYaml) => cluster.identifier)
        const newSelectedClusters = clustersSelectOptions.filter(
          option => clusterIdentifiers.indexOf(option.value) !== -1
        )
        setSelectedClusters(newSelectedClusters)
      }
    }
  }, [path, get(formik?.values, `${path}.gitOpsClusters`), clustersSelectOptions])

  useEffect(() => {
    if (!clustersLoading && !get(clustersResponse, 'data.empty')) {
      setClusters(get(clustersResponse, 'data.content', []))
    }
  }, [clustersLoading, clustersResponse])

  useEffect(() => {
    if (!isNil(clusters)) {
      setClustersSelectOptions([
        { label: getString('cd.pipelineSteps.environmentTab.allClustersSelected'), value: getString('all') },
        ...clusters.map(cluster => {
          return { label: defaultTo(cluster.clusterRef, ''), value: defaultTo(cluster.clusterRef, '') }
        })
      ])
    }
  }, [clusters])

  useEffect(() => {
    if (!isEmpty(clustersSelectOptions) && !isNil(clustersSelectOptions) && formik?.values?.clusterRef) {
      if (getMultiTypeFromValue(formik?.values?.clusterRef) === MultiTypeInputType.FIXED) {
        const allClusterOptions = [...clustersSelectOptions]
        allClusterOptions.push(...(formik?.values?.clusterRef as SelectOption[]))
        const filteredClusterOptions = uniqBy(allClusterOptions, 'value')

        if (!isEqual(clustersSelectOptions, filteredClusterOptions)) {
          setClustersSelectOptions(filteredClusterOptions)
        }
      }
    }
  }, [clustersSelectOptions])

  useEffect(() => {
    if (!isNil(clustersError)) {
      showError(getRBACErrorMessage(clustersError))
    }
  }, [clustersError])

  return (
    <div className={css.clusterMultiSelect}>
      {path ? (
        <MultiSelectTypeInput
          name={'test'}
          onChange={items => {
            if (items !== RUNTIME_INPUT_VALUE && (items as SelectOption[]).length !== 1) {
              const selectAllItemIndex = (items as SelectOption[]).findIndex(item => item.value === getString('all'))

              if (selectAllItemIndex === 0) {
                setSelectedClusters((items as SelectOption[]).slice(1))
                formik?.setFieldValue(
                  `${path}.gitOpsClusters`,
                  (items as SelectOption[]).slice(1).map(item => ({ identifier: item.value }))
                )
                formik?.setFieldValue(`${path}.deployToAll`, false)
              } else if (selectAllItemIndex === (items as SelectOption[]).length - 1) {
                setSelectedClusters((items as SelectOption[]).slice(-1))
                formik?.setFieldValue(`${path}.gitOpsClusters`, undefined)
                formik?.setFieldValue(`${path}.deployToAll`, true)
              } else {
                setSelectedClusters(items as SelectOption[])
                formik?.setFieldValue(
                  `${path}.gitOpsClusters`,
                  (items as SelectOption[]).map(item => ({ identifier: item.value }))
                )
                formik?.setFieldValue(`${path}.deployToAll`, false)
              }
            } else {
              setSelectedClusters(items as SelectOption[])
              if ((items as SelectOption[])[0].value === getString('all')) {
                formik?.setFieldValue(`${path}.gitOpsClusters`, undefined)
                formik?.setFieldValue(`${path}.deployToAll`, true)
              } else {
                formik?.setFieldValue(
                  `${path}.gitOpsClusters`,
                  (items as SelectOption[]).map(item => ({ identifier: item.value }))
                )
                formik?.setFieldValue(`${path}.deployToAll`, false)
              }
            }
          }}
          multiSelectProps={{
            items: defaultTo(clustersSelectOptions, []),
            disabled: clustersLoading,
            placeholder: clustersLoading
              ? getString('loading')
              : getString('cd.pipelineSteps.environmentTab.specifyGitOpsClusters')
          }}
          value={selectedClusters}
        />
      ) : (
        <FormInput.MultiSelectTypeInput
          label={getString('cd.pipelineSteps.environmentTab.specifyGitOpsClusters')}
          tooltipProps={{ dataTooltipId: 'specifyGitOpsClusters' }}
          name="clusterRef"
          disabled={readonly || (clustersRefType === MultiTypeInputType.FIXED && clustersLoading)}
          placeholder={
            clustersLoading ? getString('loading') : getString('cd.pipelineSteps.environmentTab.specifyGitOpsClusters')
          }
          multiSelectTypeInputProps={{
            onTypeChange: setClustersRefType,
            multiSelectProps: {
              items: defaultTo(clustersSelectOptions, [])
            },
            allowableTypes,
            onChange: items => {
              if (items !== RUNTIME_INPUT_VALUE && (items as SelectOption[]).length !== 1) {
                const selectAllItemIndex = (items as SelectOption[]).findIndex(item => item.value === getString('all'))

                if (selectAllItemIndex === 0) {
                  formik?.setFieldValue('clusterRef', (items as SelectOption[]).slice(1))
                } else if (selectAllItemIndex === (items as SelectOption[]).length - 1) {
                  formik?.setFieldValue('clusterRef', (items as SelectOption[]).slice(-1))
                } else {
                  formik?.setFieldValue('clusterRef', items)
                }
              } else {
                formik?.setFieldValue('clusterRef', items)
              }
            }
          }}
          selectItems={defaultTo(clustersSelectOptions, [])}
        />
      )}
    </div>
  )
}

export default connect(DeployClusters)
