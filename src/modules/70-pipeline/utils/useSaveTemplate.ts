/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { cloneDeep, defaultTo, isEmpty, omit } from 'lodash-es'
import { parse } from 'yaml'
import { useHistory, useParams } from 'react-router-dom'
import { VisualYamlSelectedView as SelectedView } from '@wings-software/uicore'
import {
  createTemplatePromise,
  EntityGitDetails,
  NGTemplateInfoConfig,
  TemplateSummaryResponse,
  updateExistingTemplateLabelPromise
} from 'services/template-ng'
import { AppStoreContext } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useToaster } from '@common/exports'
import { UseSaveSuccessResponse, useSaveToGitDialog } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import type { SaveToGitFormInterface } from '@common/components/SaveToGitForm/SaveToGitForm'
import { DefaultNewTemplateId } from 'framework/Templates/templates'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import routes from '@common/RouteDefinitions'
import type { GitQueryParams, ModulePathParams, TemplateStudioPathProps } from '@common/interfaces/RouteInterfaces'
import { useQueryParams } from '@common/hooks'
import type { PromiseExtraArgs } from 'framework/Templates/TemplateConfigModal/TemplateConfigModal'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'

export interface FetchTemplateUnboundProps {
  forceFetch?: boolean
  forceUpdate?: boolean
  signal?: AbortSignal
  repoIdentifier?: string
  branch?: string
}

declare global {
  interface WindowEventMap {
    TEMPLATE_SAVED: CustomEvent<TemplateSummaryResponse>
  }
}

interface SaveTemplateObj {
  template: NGTemplateInfoConfig
}

interface UseSaveTemplateReturnType {
  saveAndPublish: (
    updatedTemplate: NGTemplateInfoConfig,
    extraInfo: PromiseExtraArgs
  ) => Promise<UseSaveSuccessResponse>
}

export interface TemplateContextMetadata {
  template: NGTemplateInfoConfig
  yamlHandler?: YamlBuilderHandlerBinding
  gitDetails?: EntityGitDetails
  setLoading?: (loading: boolean) => void
  fetchTemplate?: (args: FetchTemplateUnboundProps) => Promise<void>
  deleteTemplateCache?: (gitDetails?: EntityGitDetails) => Promise<void>
  view?: string
  isPipelineStudio?: boolean
  stableVersion?: string
  fireSuccessEvent?: boolean
}

export function useSaveTemplate(TemplateContextMetadata: TemplateContextMetadata): UseSaveTemplateReturnType {
  const {
    template,
    yamlHandler,
    gitDetails,
    setLoading,
    fetchTemplate,
    deleteTemplateCache,
    view,
    isPipelineStudio,
    stableVersion,
    fireSuccessEvent
  } = TemplateContextMetadata
  const { isGitSyncEnabled } = React.useContext(AppStoreContext)
  const { templateIdentifier, templateType, projectIdentifier, orgIdentifier, accountId, module } = useParams<
    TemplateStudioPathProps & ModulePathParams
  >()
  const { branch } = useQueryParams<GitQueryParams>()
  const { getString } = useStrings()
  const { showSuccess, showError, clear } = useToaster()
  const { getRBACErrorMessage } = useRBACError()
  const history = useHistory()
  const isYaml = view === SelectedView.YAML

  const navigateToLocation = (
    newTemplateId: string,
    versionLabel: string,
    updatedGitDetails?: SaveToGitFormInterface
  ): void => {
    history.replace(
      routes.toTemplateStudio({
        projectIdentifier,
        orgIdentifier,
        accountId,
        module,
        templateType: templateType,
        templateIdentifier: newTemplateId,
        versionLabel: versionLabel,
        repoIdentifier: updatedGitDetails?.repoIdentifier,
        branch: updatedGitDetails?.branch
      })
    )
  }

  const stringifyTemplate = React.useCallback(
    (temp: NGTemplateInfoConfig) => yamlStringify(JSON.parse(JSON.stringify({ template: temp })), { version: '1.1' }),
    []
  )

  const updateExistingLabel = async (
    comments?: string,
    updatedGitDetails?: SaveToGitFormInterface,
    lastObject?: { lastObjectId?: string }
  ): Promise<UseSaveSuccessResponse> => {
    try {
      const response = await updateExistingTemplateLabelPromise({
        templateIdentifier: template.identifier,
        versionLabel: template.versionLabel,
        body: stringifyTemplate(omit(cloneDeep(template), 'repo', 'branch')),
        queryParams: {
          accountIdentifier: accountId,
          projectIdentifier,
          orgIdentifier,
          comments,
          ...(updatedGitDetails ?? {}),
          ...(lastObject?.lastObjectId ? lastObject : {}),
          ...(updatedGitDetails && updatedGitDetails.isNewBranch ? { baseBranch: branch } : {})
        },
        requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
      })
      setLoading?.(false)
      if (response && response.status === 'SUCCESS') {
        if (!isGitSyncEnabled) {
          clear()
          showSuccess(getString('common.template.updateTemplate.templateUpdated'))
        }
        await fetchTemplate?.({ forceFetch: true, forceUpdate: true })
        if (updatedGitDetails?.isNewBranch) {
          navigateToLocation(template.identifier, template.versionLabel, updatedGitDetails)
        }
        return { status: response.status }
      } else {
        throw response
      }
    } catch (error) {
      clear()
      if (!isGitSyncEnabled) {
        showError(getRBACErrorMessage(error), undefined, 'template.update.template.error')
        return { status: 'FAILURE' }
      } else {
        throw error
      }
    }
  }

  const saveAndPublishTemplate = async (
    latestTemplate: NGTemplateInfoConfig,
    comments = '',
    isEdit = false,
    updatedGitDetails?: SaveToGitFormInterface,
    lastObject?: { lastObjectId?: string }
  ): Promise<UseSaveSuccessResponse> => {
    if (!isGitSyncEnabled) {
      setLoading?.(true)
    }
    if (isEdit) {
      return updateExistingLabel(comments, updatedGitDetails, lastObject)
    } else {
      try {
        const response = await createTemplatePromise({
          body: stringifyTemplate(omit(cloneDeep(latestTemplate), 'repo', 'branch')),
          queryParams: {
            accountIdentifier: accountId,
            projectIdentifier,
            orgIdentifier,
            comments,
            ...(updatedGitDetails ?? {}),
            ...(updatedGitDetails && updatedGitDetails.isNewBranch ? { baseBranch: branch } : {})
          },
          requestOptions: { headers: { 'Content-Type': 'application/yaml' } }
        })
        if (!isGitSyncEnabled) {
          setLoading?.(false)
        }
        if (response && response.status === 'SUCCESS') {
          if (fireSuccessEvent && response.data?.templateResponseDTO) {
            window.dispatchEvent(new CustomEvent('TEMPLATE_SAVED', { detail: response.data.templateResponseDTO }))
          }
          if (!isGitSyncEnabled) {
            clear()
            showSuccess(getString('common.template.saveTemplate.publishTemplate'))
          }
          await deleteTemplateCache?.()
          if (!isPipelineStudio) {
            navigateToLocation(latestTemplate.identifier, latestTemplate.versionLabel, updatedGitDetails)
          }
          return { status: response.status }
        } else {
          throw response
        }
      } catch (error) {
        clear()
        if (!isGitSyncEnabled) {
          showError(getRBACErrorMessage(error), undefined, 'template.save.template.error')
          return { status: 'FAILURE' }
        } else {
          throw error
        }
      }
    }
  }

  const saveAngPublishWithGitInfo = async (
    updatedGitDetails: SaveToGitFormInterface,
    payload?: SaveTemplateObj,
    objectId?: string,
    isEdit = false
  ): Promise<UseSaveSuccessResponse> => {
    let latestTemplate: NGTemplateInfoConfig = payload?.template || template

    if (isYaml && yamlHandler) {
      try {
        latestTemplate = payload?.template || (parse(yamlHandler.getLatestYaml()).pipeline as NGTemplateInfoConfig)
      } /* istanbul ignore next */ catch (err) {
        showError(getRBACErrorMessage(err), undefined, 'template.save.gitinfo.error')
      }
    }

    const response = await saveAndPublishTemplate(
      latestTemplate,
      '',
      isEdit,
      omit(updatedGitDetails, 'name', 'identifier'),
      templateIdentifier !== DefaultNewTemplateId ? { lastObjectId: objectId } : {}
    )
    return {
      status: response?.status
    }
  }

  const { openSaveToGitDialog } = useSaveToGitDialog<SaveTemplateObj>({
    onSuccess: (
      gitData: SaveToGitFormInterface,
      payload?: SaveTemplateObj,
      objectId?: string,
      isEdit = false
    ): Promise<UseSaveSuccessResponse> =>
      saveAngPublishWithGitInfo(gitData, payload, objectId || gitDetails?.objectId || '', isEdit)
  })

  const getUpdatedGitDetails = (
    currGitDetails: EntityGitDetails,
    latestTemplate: NGTemplateInfoConfig,
    isEdit: boolean | undefined = false
  ): EntityGitDetails => ({
    ...currGitDetails,
    ...(!isEdit && {
      filePath: `${defaultTo(latestTemplate.identifier, '')}_${defaultTo(latestTemplate.versionLabel, '').replace(
        /[^a-zA-Z0-9-_]/g,
        ''
      )}.yaml`
    })
  })

  const saveAndPublish = React.useCallback(
    async (updatedTemplate: NGTemplateInfoConfig, extraInfo: PromiseExtraArgs): Promise<UseSaveSuccessResponse> => {
      const { isEdit, comment } = extraInfo
      const latestTemplate: NGTemplateInfoConfig = defaultTo(updatedTemplate, template)

      // if Git sync enabled then display modal
      if (isGitSyncEnabled) {
        if (isEmpty(gitDetails?.repoIdentifier) || isEmpty(gitDetails?.branch)) {
          clear()
          showError(getString('pipeline.gitExperience.selectRepoBranch'))
          return Promise.reject(getString('pipeline.gitExperience.selectRepoBranch'))
        } else {
          openSaveToGitDialog({
            isEditing: defaultTo(isEdit, false),
            resource: {
              type: 'Template',
              name: latestTemplate.name,
              identifier: latestTemplate.identifier,
              gitDetails: gitDetails ? getUpdatedGitDetails(gitDetails, latestTemplate, isEdit) : {}
            },
            payload: { template: omit(latestTemplate, 'repo', 'branch') }
          })
          return Promise.resolve({ status: 'SUCCESS' })
        }
      } else {
        return saveAndPublishTemplate(latestTemplate, comment, isEdit)
      }
    },
    [
      template,
      templateIdentifier,
      gitDetails,
      isGitSyncEnabled,
      isYaml,
      yamlHandler,
      showError,
      showSuccess,
      stableVersion
    ]
  )

  return {
    saveAndPublish
  }
}
