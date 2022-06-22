/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef } from 'react'
import { Button, ButtonSize, ButtonVariation, Container, Layout, Text } from '@wings-software/uicore'
import { Color } from '@wings-software/design-system'
import { defaultTo, isEqual } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { MonacoDiffEditor } from 'react-monaco-editor'
import { PageError, PageSpinner } from '@harness/uicore'
import { FontVariation } from '@harness/design-system'
import {
  getYamlDiffPromise as getYamlDiffPromiseForTemplate,
  ErrorNodeSummary,
  TemplateResponse
} from 'services/template-ng'
import {
  getIdentifierFromValue,
  getScopeBasedProjectPathParams,
  getScopeFromDTO
} from '@common/components/EntityReference/EntityReference'
import type { GitQueryParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getYamlDiffPromise as getYamlDiffPromiseForPipeline } from 'services/pipeline-ng'
import { Scope } from '@common/interfaces/SecretsInterface'
import { useStrings } from 'framework/strings'
import { yamlParse, yamlStringify } from '@common/utils/YamlHelperMethods'
import { useQueryParams } from '@common/hooks'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import CopyToClipboard from '@common/components/CopyToClipBoard/CopyToClipBoard'
import css from './YamlDiffView.module.scss'

export interface YamlDiffViewProps {
  errorNodeSummary?: ErrorNodeSummary
  resolvedTemplateResponses?: TemplateResponse[]
  onUpdate: () => Promise<void>
}

export function YamlDiffView({ errorNodeSummary, resolvedTemplateResponses = [], onUpdate }: YamlDiffViewProps) {
  const { getString } = useStrings()
  const { isGitSyncEnabled } = useAppStore()
  const params = useParams<ProjectPathProps>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()
  const editorRef = useRef<MonacoDiffEditor>(null)
  const [loading, setLoading] = React.useState<boolean>(false)
  const [error, setError] = React.useState<any>()
  const [originalYaml, setOriginalYaml] = React.useState<string>('')
  const [refreshedYaml, setRefreshedYaml] = React.useState<string>('')

  const isTemplateResolved = React.useMemo(
    () => !!resolvedTemplateResponses.find(item => isEqual(item, errorNodeSummary?.templateResponse)),
    [resolvedTemplateResponses, errorNodeSummary?.templateResponse]
  )

  const onNodeUpdate = () => {
    onUpdate().then(_ => {
      setOriginalYaml(refreshedYaml)
    })
  }

  const refetch = async () => {
    if (errorNodeSummary) {
      setLoading(true)
      setError(undefined)
      const templateResponse = errorNodeSummary.templateResponse
      if (templateResponse) {
        const templateRef = defaultTo(templateResponse.identifier, '')
        const scope = getScopeFromDTO(templateResponse)
        const defaultQueryParams = getScopeBasedProjectPathParams(params, scope)
        try {
          const response = await getYamlDiffPromiseForTemplate({
            queryParams: {
              ...defaultQueryParams,
              templateIdentifier: getIdentifierFromValue(templateRef),
              versionLabel: defaultTo(templateResponse.versionLabel, ''),
              branch,
              repoIdentifier,
              getDefaultFromOtherRepo: true
            }
          })
          if (response && response.status === 'SUCCESS') {
            setOriginalYaml(yamlStringify(yamlParse(defaultTo(response.data?.originalYaml, ''))))
            setRefreshedYaml(yamlStringify(yamlParse(defaultTo(response.data?.refreshedYaml, ''))))
          } else {
            throw response
          }
        } catch (err) {
          setError(err)
        } finally {
          setLoading(false)
        }
      } else {
        try {
          const response = await getYamlDiffPromiseForPipeline({
            queryParams: {
              ...getScopeBasedProjectPathParams(params, Scope.PROJECT),
              identifier: defaultTo(errorNodeSummary?.nodeInfo?.identifier, ''),
              branch,
              repoIdentifier,
              getDefaultFromOtherRepo: true
            }
          })
          if (response && response.status === 'SUCCESS') {
            setOriginalYaml(yamlStringify(yamlParse(defaultTo(response.data?.originalYaml, ''))))
            setRefreshedYaml(yamlStringify(yamlParse(defaultTo(response.data?.refreshedYaml, ''))))
          } else {
            throw response
          }
        } catch (err) {
          setError(err)
        } finally {
          setLoading(false)
        }
      }
    }
  }

  React.useEffect(() => {
    if (errorNodeSummary) {
      refetch()
    }
  }, [errorNodeSummary])

  return (
    <Container className={css.mainContainer} height={'100%'} background={Color.WHITE} border={{ radius: 4 }}>
      {loading && <PageSpinner />}
      {!loading && error && (
        <PageError message={(error.data as Error)?.message || error.message} onClick={() => refetch()} />
      )}
      {!error && originalYaml && refreshedYaml && (
        <Layout.Vertical height={'100%'}>
          <Container height={56}>
            <Layout.Horizontal height={'100%'}>
              <Container className={css.leftHeader} border={{ right: true }}>
                <Layout.Horizontal
                  height={'100%'}
                  flex={{ justifyContent: 'space-between', alignItems: 'center' }}
                  padding={{ left: 'xlarge', right: 'xlarge' }}
                >
                  <Text font={{ variation: FontVariation.H6 }}>
                    {getString('pipeline.reconcileDialog.originalYamlLabel')}
                  </Text>
                </Layout.Horizontal>
              </Container>
              <Container className={css.refreshedHeader}>
                <Layout.Horizontal
                  height={'100%'}
                  flex={{ justifyContent: 'space-between', alignItems: 'center' }}
                  padding={{ left: 'xlarge', right: 'xlarge' }}
                >
                  <Text font={{ variation: FontVariation.H6 }}>
                    {getString('pipeline.reconcileDialog.refreshedYamlLabel')}
                  </Text>
                  {!isTemplateResolved ? (
                    isGitSyncEnabled ? (
                      <CopyToClipboard content={refreshedYaml} showFeedback={true} />
                    ) : (
                      <Button
                        variation={ButtonVariation.PRIMARY}
                        text={getString('update')}
                        onClick={onNodeUpdate}
                        size={ButtonSize.SMALL}
                      />
                    )
                  ) : null}
                </Layout.Horizontal>
              </Container>
            </Layout.Horizontal>
          </Container>
          <MonacoDiffEditor
            width={'100%'}
            height={'calc(100% - 56px)'}
            language="yaml"
            original={originalYaml}
            value={refreshedYaml}
            options={{
              ignoreTrimWhitespace: true,
              minimap: { enabled: true },
              codeLens: true,
              renderSideBySide: true,
              lineNumbers: 'on',
              readOnly: true,
              inDiffEditor: true,
              scrollBeyondLastLine: false,
              enableSplitViewResizing: false,
              fontFamily: "'Roboto Mono', monospace",
              fontSize: 13
            }}
            ref={editorRef}
          />
        </Layout.Vertical>
      )}
    </Container>
  )
}
