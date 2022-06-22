/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Button, ButtonVariation, Container, Layout, Text, useToaster } from '@wings-software/uicore'
import { FontVariation } from '@harness/design-system'
import { Color } from '@wings-software/design-system'
import { clone, defaultTo, isEmpty, isEqual } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { PageSpinner } from '@harness/uicore'
import {
  refreshAndUpdateTemplateInputsPromise as refreshAndUpdateTemplate,
  refreshAllPromise as refreshAllTemplatePromise,
  ErrorNodeSummary,
  TemplateResponse
} from 'services/template-ng'
import { YamlDiffView } from '@pipeline/components/TemplateLibraryErrorHandling/YamlDiffView/YamlDiffView'
import { ErrorNode } from '@pipeline/components/TemplateLibraryErrorHandling/ErrorDirectory/ErrorNode'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { String, useStrings } from 'framework/strings'
import {
  refreshAndUpdateTemplateInputsPromise as refreshAndUpdatePipeline,
  refreshAllPromise as refreshAllPipelinePromise
} from 'services/pipeline-ng'
import { getScopeBasedProjectPathParams, getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useQueryParams } from '@common/hooks'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { getFirstLeafNode } from '@pipeline/components/TemplateLibraryErrorHandling/TemplateLibraryErrorHandlingUtils'
import css from './ReconcileDialog.module.scss'

export interface ReconcileDialogProps {
  templateInputsErrorNodeSummary: ErrorNodeSummary
  entity: 'Pipeline' | 'Template'
  setResolvedTemplateResponses: (resolvedTemplateInfos: TemplateResponse[]) => void
  reload: () => void
}

export function ReconcileDialog({
  templateInputsErrorNodeSummary,
  entity,
  setResolvedTemplateResponses: setResolvedTemplates,
  reload
}: ReconcileDialogProps) {
  const hasChildren = !isEmpty(templateInputsErrorNodeSummary.childrenErrorNodes)
  const [selectedErrorNodeSummary, setSelectedErrorNodeSummary] = React.useState<ErrorNodeSummary>()
  const [resolvedTemplateResponses, setResolvedTemplateResponses] = React.useState<TemplateResponse[]>([])
  const params = useParams<ProjectPathProps>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()
  const [loading, setLoading] = React.useState<boolean>(false)
  const { showError } = useToaster()
  const { isGitSyncEnabled } = useAppStore()
  const { getString } = useStrings()
  const { getRBACErrorMessage } = useRBACError()

  const [canEditTemplate] = usePermission({
    resource: {
      resourceType: ResourceType.TEMPLATE
    },
    permissions: [PermissionIdentifier.EDIT_TEMPLATE]
  })

  const updateButtonEnabled = React.useMemo(() => {
    if (isGitSyncEnabled) {
      return false
    } else if (entity === 'Pipeline' && hasChildren) {
      return canEditTemplate
    } else {
      return true
    }
  }, [])

  React.useEffect(() => {
    setResolvedTemplates(resolvedTemplateResponses)
  }, [resolvedTemplateResponses])

  React.useEffect(() => {
    setSelectedErrorNodeSummary(getFirstLeafNode(templateInputsErrorNodeSummary))
  }, [])

  const onUpdateAll = async (): Promise<void> => {
    setLoading(true)
    if (templateInputsErrorNodeSummary.templateResponse) {
      const scope = getScopeFromDTO(templateInputsErrorNodeSummary.templateResponse)
      try {
        const response = await refreshAllTemplatePromise({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, scope),
            templateIdentifier: defaultTo(templateInputsErrorNodeSummary.templateResponse.identifier, ''),
            versionLabel: defaultTo(templateInputsErrorNodeSummary.templateResponse.versionLabel, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          reload()
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'template.refresh.all.error')
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const response = await refreshAllPipelinePromise({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, Scope.PROJECT),
            identifier: defaultTo(templateInputsErrorNodeSummary?.nodeInfo?.identifier, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          reload()
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'pipeline.refresh.all.error')
      } finally {
        setLoading(false)
      }
    }
  }

  const onUpdateNode = async (): Promise<void> => {
    setLoading(true)
    if (selectedErrorNodeSummary?.templateResponse) {
      const scope = getScopeFromDTO(selectedErrorNodeSummary.templateResponse)
      try {
        const response = await refreshAndUpdateTemplate({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, scope),
            templateIdentifier: defaultTo(selectedErrorNodeSummary.templateResponse.identifier, ''),
            versionLabel: defaultTo(selectedErrorNodeSummary.templateResponse.versionLabel, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          if (isEqual(selectedErrorNodeSummary.nodeInfo, templateInputsErrorNodeSummary.nodeInfo)) {
            reload()
          } else if (selectedErrorNodeSummary.templateResponse) {
            setResolvedTemplateResponses([
              ...resolvedTemplateResponses,
              clone(selectedErrorNodeSummary.templateResponse)
            ])
          }
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'template.refresh.error')
      } finally {
        setLoading(false)
      }
    } else {
      try {
        const response = await refreshAndUpdatePipeline({
          queryParams: {
            ...getScopeBasedProjectPathParams(params, Scope.PROJECT),
            identifier: defaultTo(selectedErrorNodeSummary?.nodeInfo?.identifier, ''),
            branch,
            repoIdentifier,
            getDefaultFromOtherRepo: true
          },
          body: undefined
        })
        if (response && response.status === 'SUCCESS') {
          reload()
        } else {
          throw response
        }
      } catch (error) {
        showError(getRBACErrorMessage(error), undefined, 'pipeline.refresh.error')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <Container className={css.mainContainer} height={'100%'}>
      {loading && <PageSpinner />}
      <Layout.Vertical height={'100%'}>
        <Container
          border={{ bottom: true }}
          padding={{ top: 'large', right: 'xxxlarge', bottom: 'large', left: 'xxxlarge' }}
        >
          <Text font={{ variation: FontVariation.H4 }}>{getString('pipeline.reconcileDialog.title')}</Text>
        </Container>
        <Container
          className={css.contentContainer}
          background={Color.FORM_BG}
          padding={{ top: 'large', right: 'xxxlarge', bottom: 'xxxlarge', left: 'xxxlarge' }}
        >
          <Layout.Horizontal spacing={'huge'} height={'100%'}>
            <Container width={376}>
              <Layout.Vertical spacing={'xlarge'}>
                <Container>
                  <Layout.Vertical spacing={'medium'}>
                    <Text font={{ variation: FontVariation.H5 }}>{getString('pipeline.reconcileDialog.subtitle')}</Text>
                    <Text font={{ variation: FontVariation.BODY }}>
                      <String
                        stringID={
                          hasChildren
                            ? 'pipeline.reconcileDialog.unsyncedTemplateInfo'
                            : 'pipeline.reconcileDialog.updatedTemplateInfo'
                        }
                        vars={{
                          name: `${entity}: ${templateInputsErrorNodeSummary.nodeInfo?.name}`
                        }}
                        useRichText={true}
                      />
                    </Text>
                  </Layout.Vertical>
                </Container>
                <Button
                  text={
                    hasChildren
                      ? getString('pipeline.reconcileDialog.updateAllLabel')
                      : getString('pipeline.reconcileDialog.updateEntityLabel', { entity })
                  }
                  variation={ButtonVariation.PRIMARY}
                  width={248}
                  disabled={!updateButtonEnabled}
                  onClick={onUpdateAll}
                />
                {hasChildren && (
                  <ErrorNode
                    templateInputsErrorNodeSummary={templateInputsErrorNodeSummary}
                    resolvedTemplateResponses={resolvedTemplateResponses}
                    selectedErrorNodeSummary={selectedErrorNodeSummary}
                    setSelectedErrorNodeSummary={setSelectedErrorNodeSummary}
                  />
                )}
              </Layout.Vertical>
            </Container>
            <Container style={{ flex: 1 }}>
              <YamlDiffView
                errorNodeSummary={selectedErrorNodeSummary}
                resolvedTemplateResponses={resolvedTemplateResponses}
                onUpdate={onUpdateNode}
              />
            </Container>
          </Layout.Horizontal>
        </Container>
      </Layout.Vertical>
    </Container>
  )
}
