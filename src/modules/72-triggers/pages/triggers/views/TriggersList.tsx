/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useState } from 'react'
import { Button, ButtonVariation, TextInput } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { useParams, useHistory } from 'react-router-dom'
import { HelpPanel, HelpPanelType } from '@harness/help-panel'
import { useStrings } from 'framework/strings'
import { Page } from '@common/exports'
import routes from '@common/RouteDefinitions'
import { useGetTriggerListForTarget } from 'services/pipeline-ng'
import { useGetListOfBranchesWithStatus } from 'services/cd-ng'
import { useQueryParams } from '@common/hooks'
import { AddDrawer } from '@common/components'
import { AddDrawerMapInterface, DrawerContext } from '@common/components/AddDrawer/AddDrawer'
import type { GitQueryParams, PipelineType } from '@common/interfaces/RouteInterfaces'
import { usePermission } from '@rbac/hooks/usePermission'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { ENABLED_ARTIFACT_TYPES } from '@pipeline/components/ArtifactsSelection/ArtifactHelper'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { TriggersListSection, GoToEditWizardInterface } from './TriggersListSection'

import { TriggerTypes } from '../utils/TriggersWizardPageUtils'
import { getCategoryItems, ItemInterface, TriggerDataInterface } from '../utils/TriggersListUtils'
import css from './TriggersList.module.scss'

interface TriggersListPropsInterface {
  onNewTriggerClick: (val: TriggerDataInterface) => void
  isPipelineInvalid?: boolean
  gitAwareForTriggerEnabled?: boolean
}

export default function TriggersList(props: TriggersListPropsInterface & GitQueryParams): JSX.Element {
  const { onNewTriggerClick, isPipelineInvalid, gitAwareForTriggerEnabled } = props
  const { branch, repoIdentifier, connectorRef, repoName, storeType } = useQueryParams<GitQueryParams>()

  const { projectIdentifier, orgIdentifier, accountId, pipelineIdentifier, module } = useParams<
    PipelineType<{
      projectIdentifier: string
      orgIdentifier: string
      accountId: string
      pipelineIdentifier: string
    }>
  >()
  const [searchParam, setSearchParam] = useState('')
  const { getString } = useStrings()

  const { NG_AZURE } = useFeatureFlags()

  const getCategories = (): AddDrawerMapInterface => {
    const categories = getCategoryItems(getString)

    return {
      ...categories,
      categories: categories?.categories?.map(category => {
        return {
          ...category,
          items:
            category.categoryValue === 'Artifact'
              ? category?.items?.filter(item => {
                  switch (item.value) {
                    case ENABLED_ARTIFACT_TYPES.Acr:
                      return NG_AZURE
                    default:
                      return true
                  }
                })
              : category?.items
        }
      })
    }
  }

  const {
    data: triggerListResponse,
    error,
    refetch,
    loading
  } = useGetTriggerListForTarget({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      targetIdentifier: pipelineIdentifier,
      searchTerm: searchParam
    },
    debounce: 300
  })
  const triggerList = triggerListResponse?.data?.content || undefined
  const history = useHistory()
  const [isEditable] = usePermission(
    {
      resourceScope: {
        projectIdentifier: projectIdentifier,
        orgIdentifier: orgIdentifier,
        accountIdentifier: accountId
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineIdentifier
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE],
      options: {
        skipCache: true
      }
    },
    [projectIdentifier, orgIdentifier, accountId, pipelineIdentifier]
  )

  const { data: branchesWithStatusData, refetch: getDefaultBranchName } = useGetListOfBranchesWithStatus({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      yamlGitConfigIdentifier: repoIdentifier,
      page: 0,
      size: 20
    },
    lazy: true
  })

  // should be disabled when project is git sync enabled & the branch in the URL is not the default branch name
  const [incompatibleGitSyncBranch, setIncompatibleGitSyncBranch] = React.useState(false)

  React.useEffect(() => {
    if (repoIdentifier) {
      getDefaultBranchName()
    }
  }, [repoIdentifier])

  React.useEffect(() => {
    if (
      branchesWithStatusData?.data?.defaultBranch &&
      branchesWithStatusData?.data?.defaultBranch?.branchName !== branch
    ) {
      setIncompatibleGitSyncBranch(true)
    } else {
      setIncompatibleGitSyncBranch(false)
    }
  }, [branchesWithStatusData])

  const goToEditWizard = ({ triggerIdentifier, triggerType }: GoToEditWizardInterface): void => {
    history.push(
      routes.toTriggersWizardPage({
        accountId,
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier,
        triggerIdentifier,
        triggerType,
        module,
        repoIdentifier,
        branch,
        connectorRef,
        repoName,
        storeType
      })
    )
  }
  const goToDetails = ({ triggerIdentifier }: GoToEditWizardInterface): void => {
    /* istanbul ignore next */
    history.push(
      routes.toTriggersDetailPage({
        accountId,
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier,
        triggerIdentifier,
        module,
        repoIdentifier,
        branch,
        connectorRef,
        repoName,
        storeType
      })
    )
  }

  const [openDrawer, hideDrawer] = useModalHook(() => {
    /* istanbul ignore next */
    const onSelect = (val: ItemInterface): void => {
      if (val?.categoryValue) {
        hideDrawer()
        onNewTriggerClick({
          triggerType: val.categoryValue,
          sourceRepo: (val.categoryValue === TriggerTypes.WEBHOOK && val.value) || undefined,
          artifactType: (val.categoryValue === TriggerTypes.ARTIFACT && val.value) || undefined,
          manifestType: (val.categoryValue === TriggerTypes.MANIFEST && val.value) || undefined
        })
      }
    }

    return (
      <AddDrawer
        addDrawerMap={getCategories()}
        onSelect={onSelect}
        onClose={hideDrawer}
        drawerContext={DrawerContext.STUDIO}
      />
    )
  })
  const buttonProps = incompatibleGitSyncBranch
    ? {
        tooltip: getString('triggers.tooltip.defaultGitSyncBranchOnly')
      }
    : {}

  return (
    <>
      <HelpPanel referenceId="triggers" type={HelpPanelType.FLOATING_CONTAINER} />
      <Page.SubHeader>
        <Button
          disabled={!isEditable || incompatibleGitSyncBranch || isPipelineInvalid}
          tooltip={isPipelineInvalid ? getString('pipeline.cannotAddTriggerInvalidPipeline') : ''}
          text={getString('triggers.newTrigger')}
          variation={ButtonVariation.PRIMARY}
          onClick={openDrawer}
          {...buttonProps}
        ></Button>
        <TextInput
          leftIcon="thinner-search"
          leftIconProps={{ name: 'thinner-search', size: 14, color: Color.GREY_700 }}
          placeholder={getString('search')}
          data-name="search"
          wrapperClassName={css.searchWrapper}
          value={searchParam}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchParam(e.target.value.trim())
          }}
        />
      </Page.SubHeader>

      <Page.Body
        loading={loading}
        error={error?.message}
        retryOnError={() => refetch()}
        noData={
          !searchParam
            ? {
                when: () => (Array.isArray(triggerList) && triggerList.length === 0) || incompatibleGitSyncBranch,
                icon: 'yaml-builder-trigger',
                message: getString('triggers.aboutTriggers'),
                buttonText: getString('triggers.addNewTrigger'),
                onClick: openDrawer,
                buttonDisabled: !isEditable || incompatibleGitSyncBranch || isPipelineInvalid,
                buttonDisabledTooltip: isPipelineInvalid ? getString('pipeline.cannotAddTriggerInvalidPipeline') : ''
              }
            : {
                when: () => Array.isArray(triggerList) && triggerList.length === 0,
                icon: 'yaml-builder-trigger',
                message: getString('triggers.noTriggersFound')
              }
        }
      >
        <TriggersListSection
          data={triggerList}
          refetchTriggerList={refetch}
          goToEditWizard={goToEditWizard}
          goToDetails={goToDetails}
          isPipelineInvalid={isPipelineInvalid}
          gitAwareForTriggerEnabled={gitAwareForTriggerEnabled}
        />
      </Page.Body>
    </>
  )
}
