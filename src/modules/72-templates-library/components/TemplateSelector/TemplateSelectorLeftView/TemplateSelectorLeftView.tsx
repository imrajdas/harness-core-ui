/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Container,
  DropDown,
  ExpandingSearchInput,
  ExpandingSearchInputHandle,
  GridListToggle,
  Layout,
  PageError,
  SelectOption,
  Text,
  Views
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { defaultTo } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Breadcrumbs } from '@common/components/Breadcrumbs/Breadcrumbs'
import type { GitQueryParams, ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { TemplateSummaryResponse, useGetTemplateList } from 'services/template-ng'
import { useStrings } from 'framework/strings'
import { PageSpinner } from '@common/components'
import { useMutateAsGet, useQueryParams } from '@common/hooks'
import { TemplateListType } from '@templates-library/pages/TemplatesPage/TemplatesPageUtils'
import TemplatesView from '@templates-library/pages/TemplatesPage/views/TemplatesView/TemplatesView'
import { Scope } from '@common/interfaces/SecretsInterface'
import routes from '@common/RouteDefinitions'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import NoResultsView from '@templates-library/pages/TemplatesPage/views/NoResultsView/NoResultsView'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { getScopeOptions } from '@templates-library/components/TemplateSelector/TemplateSelectorLeftView/TemplateSelectorLeftViewUtils'
import { areTemplatesSame } from '@pipeline/utils/templateUtils'
import { useTemplateSelectorContext } from 'framework/Templates/TemplateSelectorContext/TemplateSelectorContext'
import css from './TemplateSelectorLeftView.module.scss'

export interface TemplateSelectorLeftViewProps {
  setTemplate: (template?: TemplateSummaryResponse) => void
}

export const TemplateSelectorLeftView: React.FC<TemplateSelectorLeftViewProps> = ({ setTemplate }): JSX.Element => {
  const {
    state: { selectorData }
  } = useTemplateSelectorContext()
  const { templateType, allChildTypes = [], selectedTemplate: defaultTemplate } = selectorData || {}
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateSummaryResponse | undefined>()
  const { getString } = useStrings()
  const [page, setPage] = useState(0)
  const [view, setView] = useState<Views>(Views.GRID)
  const [searchParam, setSearchParam] = useState('')
  const { module, ...params } = useParams<ProjectPathProps & ModulePathParams>()
  const { projectIdentifier, orgIdentifier, accountId } = params
  const { repoIdentifier, branch } = useQueryParams<GitQueryParams>()
  const { isGitSyncEnabled } = useAppStore()
  const [selectedChildType, setSelectedChildType] = React.useState<string | undefined>(
    allChildTypes.length === 1 ? allChildTypes[0] : undefined
  )
  const scopeOptions: SelectOption[] = React.useMemo(
    () => getScopeOptions(getScopeFromDTO(params), getString),
    [params]
  )
  const [selectedScope, setSelectedScope] = useState<SelectOption>(scopeOptions[0])
  const searchRef = React.useRef<ExpandingSearchInputHandle>({} as ExpandingSearchInputHandle)
  const { orgId, projectId } = React.useMemo(() => {
    switch (selectedScope.value) {
      case 'all':
      case Scope.PROJECT:
        return { orgId: orgIdentifier, projectId: projectIdentifier }
      case Scope.ORG:
        return { orgId: orgIdentifier }
      default:
        return {}
    }
  }, [selectedScope, orgIdentifier])

  const body = React.useMemo(() => {
    return {
      filterType: 'Template',
      templateEntityTypes: [templateType],
      childTypes: selectedChildType ? [selectedChildType] : allChildTypes
    }
  }, [templateType, selectedChildType, allChildTypes])

  const queryParams = React.useMemo(() => {
    return {
      accountIdentifier: accountId,
      orgIdentifier: orgId,
      projectIdentifier: projectId,
      templateListType: TemplateListType.Stable,
      searchTerm: searchParam,
      page,
      size: 20,
      includeAllTemplatesAvailableAtScope: selectedScope.value === 'all',
      ...(isGitSyncEnabled &&
        (selectedScope.value === Scope.PROJECT || selectedScope.value === 'all') && {
          repoIdentifier: repoIdentifier,
          branch: branch,
          getDefaultFromOtherRepo: true
        })
    }
  }, [accountId, orgId, projectId, searchParam, page, repoIdentifier, branch, selectedScope, isGitSyncEnabled])

  const reset = React.useCallback((): void => {
    if (searchParam) {
      searchRef.current.clear()
    }
    setSelectedChildType(allChildTypes.length === 1 ? allChildTypes[0] : undefined)
  }, [searchParam, searchRef.current, allChildTypes])

  const getName = React.useCallback(
    (item: string): string => {
      switch (templateType) {
        case TemplateType.Stage:
          return defaultTo(stagesCollection.getStageAttributes(item, getString)?.name, item)
        case TemplateType.Step:
          return defaultTo(factory.getStepName(item), item)
        default:
          return item
      }
    },
    [templateType]
  )

  const dropdownItems = React.useMemo(
    (): SelectOption[] =>
      allChildTypes
        .map(item => ({
          label: getName(item),
          value: item
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [allChildTypes, getName]
  )

  const {
    data: templateData,
    refetch: reloadTemplates,
    loading,
    error
  } = useMutateAsGet(useGetTemplateList, {
    body,
    queryParams,
    queryParamStringifyOptions: { arrayFormat: 'comma' },
    debounce: true
  })

  useEffect(() => {
    if (areTemplatesSame(selectedTemplate, defaultTemplate)) {
      setTemplate(defaultTemplate)
    } else {
      setTemplate(selectedTemplate)
    }
  }, [selectedTemplate])

  useEffect(() => {
    const findTemplate = templateData?.data?.content?.find(template => {
      const areSame = areTemplatesSame(template, defaultTemplate)
      return areSame
    })
    setSelectedTemplate(findTemplate)
  }, [templateData?.data?.content])

  useEffect(() => {
    if (loading) {
      setSelectedTemplate(undefined)
    }
  }, [loading])

  return (
    <Container width={762} background={Color.FORM_BG} className={css.container}>
      <Layout.Vertical spacing={'xxlarge'} height={'100%'}>
        <Container>
          <Layout.Vertical spacing={'small'} padding={{ left: 'xxlarge', right: 'xxlarge' }}>
            <Breadcrumbs
              links={[
                {
                  url: routes.toTemplates({ accountId, orgIdentifier, projectIdentifier, module }),
                  label: getString('common.templates')
                },
                {
                  url: '/',
                  label: getString('templatesLibrary.templatesLabel', { entity: templateType })
                }
              ]}
            />
            <Container>
              <Layout.Horizontal spacing={'small'}>
                <DropDown
                  items={scopeOptions}
                  value={selectedScope.value.toString()}
                  onChange={item => setSelectedScope(item)}
                  filterable={false}
                />
                <ExpandingSearchInput
                  alwaysExpanded
                  className={css.searchBox}
                  onChange={(text: string) => {
                    setPage(0)
                    setSearchParam(text)
                  }}
                  ref={searchRef}
                  defaultValue={searchParam}
                />
              </Layout.Horizontal>
            </Container>
          </Layout.Vertical>
        </Container>
        <Container height={'100%'} className={css.mainContainer} padding={{ left: 'xxlarge', right: 'xxlarge' }}>
          <Layout.Vertical height={'100%'} spacing={'medium'}>
            <Container>
              <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Text font={{ size: 'xsmall', weight: 'bold' }} color={Color.GREY_800}>
                  {templateData?.data?.totalElements
                    ? `${getString('common.templates').toUpperCase()} (${templateData?.data?.totalElements})`
                    : ''}
                </Text>
                <Container>
                  <Layout.Horizontal flex={{ alignItems: 'center' }} spacing={'medium'}>
                    {dropdownItems.length > 1 && (
                      <DropDown
                        onChange={item => {
                          setSelectedChildType(item.value.toString())
                        }}
                        items={dropdownItems}
                        addClearBtn={true}
                        filterable={false}
                        placeholder={`${getString('typeLabel')}: ${getString('all')}`}
                        value={selectedChildType}
                      />
                    )}
                    <Container>
                      <GridListToggle initialSelectedView={Views.GRID} onViewToggle={setView} />
                    </Container>
                  </Layout.Horizontal>
                </Container>
              </Layout.Horizontal>
            </Container>
            <Container className={css.templatesContainer}>
              {loading && <PageSpinner />}
              {!loading && error && (
                <PageError
                  message={defaultTo((error.data as Error)?.message, error.message)}
                  onClick={reloadTemplates}
                />
              )}
              {!loading && !error && !templateData?.data?.content?.length && (
                <NoResultsView
                  hasSearchParam={!!searchParam || !!selectedChildType}
                  onReset={reset}
                  text={
                    selectedScope.value === 'all'
                      ? `There are no templates`
                      : getString('templatesLibrary.templatesPage.noTemplates', {
                          scope: selectedScope.label.toLowerCase()
                        })
                  }
                  minimal={true}
                />
              )}
              {!loading && !error && !!templateData?.data?.content?.length && (
                <TemplatesView
                  data={templateData?.data}
                  gotoPage={setPage}
                  onSelect={setSelectedTemplate}
                  selectedTemplate={selectedTemplate}
                  view={view}
                />
              )}
            </Container>
          </Layout.Vertical>
        </Container>
      </Layout.Vertical>
    </Container>
  )
}
