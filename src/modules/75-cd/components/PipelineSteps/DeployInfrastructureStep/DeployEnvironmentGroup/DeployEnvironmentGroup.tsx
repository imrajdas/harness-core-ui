/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { defaultTo, get, isEmpty, isNil } from 'lodash-es'
import { connect, FormikProps } from 'formik'

import { FormInput, getMultiTypeFromValue, Layout, MultiTypeInputType, SelectOption, useToaster } from '@harness/uicore'

import { useStrings } from 'framework/strings'
import { EnvironmentGroupResponse, EnvironmentGroupResponseDTO, useGetEnvironmentGroupList } from 'services/cd-ng'

import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'

import { useMutateAsGet } from '@common/hooks'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'

import type { DeployStageConfig } from '@pipeline/utils/DeployStageInterface'

import css from '../DeployInfrastructureStep.module.scss'

interface DeployEnvironmentGroupProps {
  initialValues: DeployStageConfig
  formik?: FormikProps<DeployStageConfig>
  readonly?: boolean
  allowableTypes: MultiTypeInputType[]
  serviceRef?: string
  path?: string
}

function DeployEnvironmentGroup({
  initialValues,
  readonly,
  formik,
  allowableTypes,
  path
}: DeployEnvironmentGroupProps) {
  const { accountId, projectIdentifier, orgIdentifier } = useParams<PipelinePathProps>()
  const { getString } = useStrings()
  const { showError } = useToaster()
  const { getRBACErrorMessage } = useRBACError()

  const {
    data: environmentGroupsResponse,
    loading: environmentGroupsLoading,
    error: environmentGroupsError
  } = useMutateAsGet(useGetEnvironmentGroupList, {
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    body: {
      filterType: 'EnvironmentGroup'
    }
  })

  const [environmentGroups, setEnvironmentGroups] = useState<EnvironmentGroupResponseDTO[]>()
  const [environmentGroupsSelectOptions, setEnvironmentGroupsSelectOptions] = useState<SelectOption[]>()

  useEffect(() => {
    if (!environmentGroupsLoading && !get(environmentGroupsResponse, 'data.empty')) {
      setEnvironmentGroups(
        defaultTo(
          get(environmentGroupsResponse, 'data.content', [])?.map((envGroupObj: EnvironmentGroupResponse) => ({
            ...envGroupObj.envGroup
          })),
          []
        )
      )
    }
  }, [environmentGroupsLoading, environmentGroupsResponse])

  useEffect(() => {
    if (!isNil(environmentGroups)) {
      setEnvironmentGroupsSelectOptions(
        environmentGroups.map(envGroup => {
          return { label: defaultTo(envGroup.name, ''), value: defaultTo(envGroup.identifier, '') }
        })
      )
    }
  }, [environmentGroups])

  useEffect(() => {
    if (
      !isEmpty(environmentGroupsSelectOptions) &&
      !isNil(environmentGroupsSelectOptions) &&
      initialValues.environmentGroup?.envGroupRef
    ) {
      if (getMultiTypeFromValue(initialValues.environmentGroup?.envGroupRef) === MultiTypeInputType.FIXED) {
        const existingEnvironmentGroup = environmentGroupsSelectOptions.find(
          envGroup => envGroup.value === initialValues.environmentGroup?.envGroupRef
        )
        if (initialValues.isEnvGroup) {
          if (!existingEnvironmentGroup) {
            if (!readonly) {
              formik?.setFieldValue('environmentGroup?.envGroupRef', '')
            } else {
              const options = [...environmentGroupsSelectOptions]
              options.push({
                label: initialValues.environmentGroup?.envGroupRef,
                value: initialValues.environmentGroup?.envGroupRef
              } as SelectOption)
              setEnvironmentGroupsSelectOptions(options)
            }
          } else {
            formik?.setFieldValue('environmentGroup?.envGroupRef', existingEnvironmentGroup)
          }
        }
      }
    }
  }, [environmentGroupsSelectOptions])

  useEffect(() => {
    if (!isNil(environmentGroupsError)) {
      showError(getRBACErrorMessage(environmentGroupsError))
    }
  }, [environmentGroupsError])

  return (
    <Layout.Horizontal
      className={css.formRow}
      spacing="medium"
      flex={{ alignItems: 'flex-start', justifyContent: 'flex-start' }}
    >
      <FormInput.MultiTypeInput
        label={getString('cd.pipelineSteps.environmentTab.specifyYourEnvironmentGroup')}
        tooltipProps={{ dataTooltipId: 'specifyYourEnvironmentGroup' }}
        name={`${path}.envGroupRef`}
        useValue
        disabled={readonly}
        placeholder={
          environmentGroupsLoading
            ? getString('loading')
            : getString('cd.pipelineSteps.environmentTab.selectEnvironmentGroup')
        }
        multiTypeInputProps={{
          width: 280,
          selectProps: {
            addClearBtn: !readonly,
            items: defaultTo(environmentGroupsSelectOptions, [])
          },
          allowableTypes
        }}
        selectItems={defaultTo(environmentGroupsSelectOptions, [])}
      />
    </Layout.Horizontal>
  )
}

export default connect(DeployEnvironmentGroup)
