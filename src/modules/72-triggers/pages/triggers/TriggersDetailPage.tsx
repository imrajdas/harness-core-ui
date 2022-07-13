/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import {
  Button,
  ButtonVariation,
  Container,
  Icon,
  Layout,
  Switch,
  Text,
  tagsType,
  VisualYamlSelectedView as SelectedView,
  VisualYamlToggle,
  HarnessDocTooltip
} from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import React, { ReactNode, useMemo } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { isEmpty, get, pickBy } from 'lodash-es'
import { parse } from 'yaml'
import type { MutateMethod } from 'restful-react'
import { Page, useToaster } from '@common/exports'
import {
  NGTriggerConfigV2,
  useGetTriggerDetails,
  ResponseNGTriggerDetailsResponse,
  ResponseNGTriggerResponse,
  UpdateTriggerQueryParams,
  UpdateTriggerPathParams,
  useUpdateTrigger,
  useGetSchemaYaml,
  useGetPipelineSummary
} from 'services/pipeline-ng'
import { useStrings, UseStringsReturn } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { TagsPopover, PageSpinner } from '@common/components'
import { usePermission } from '@rbac/hooks/usePermission'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import DetailPageCard, { ContentType, Content } from '@common/components/DetailPageCard/DetailPageCard'
import routes from '@common/RouteDefinitions'
import type { GitQueryParams, PipelineType } from '@common/interfaces/RouteInterfaces'
import YAMLBuilder from '@common/components/YAMLBuilder/YamlBuilder'
import type { YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useQueryParams } from '@common/hooks'
import { yamlStringify } from '@common/utils/YamlHelperMethods'
import { TriggerBreadcrumbs } from '../trigger-details/TriggerDetails'
import { getTriggerIcon, getEnabledStatusTriggerValues } from './utils/TriggersListUtils'
import { clearNullUndefined, ResponseStatus } from './utils/TriggersWizardPageUtils'
import css from './TriggersDetailPage.module.scss'

const loadingHeaderHeight = 43

export interface ConditionInterface {
  key: string
  operator: string
  value: string
}

const getTriggerConditionsStr = (payloadConditions: ConditionInterface[]): string[] => {
  const arr: string[] = []
  payloadConditions.forEach(condition => {
    const { key, operator, value } = condition

    arr.push(`${key} ${operator} ${value}`)
  })
  return arr
}

const renderConditions = ({
  conditionsArr,
  jexlCondition,
  cronExpression,
  getString
}: {
  conditionsArr: string[]
  jexlCondition?: string
  cronExpression?: string
  getString: UseStringsReturn['getString']
}): JSX.Element => (
  <Layout.Vertical style={{ overflowX: 'hidden' }} spacing="medium">
    {conditionsArr.length ? (
      <>
        <Text style={{ fontSize: '12px' }}>{getString('conditions')}</Text>
        {conditionsArr.map(conditionStr => (
          <Text color={Color.BLACK} key={conditionStr} width="424px" lineClamp={1}>
            {conditionStr}
          </Text>
        ))}
      </>
    ) : null}
    {jexlCondition ? (
      <>
        <Text style={{ fontSize: '12px' }}>{getString('triggers.conditionsPanel.jexlCondition')}</Text>
        <Text color={Color.BLACK} width="424px" lineClamp={1}>
          {jexlCondition}
        </Text>
      </>
    ) : null}
    {cronExpression ? (
      <>
        <Text style={{ fontSize: '12px' }}>{getString('triggers.schedulePanel.cronExpression')}</Text>
        <Text color={Color.BLACK} width="424px" lineClamp={1}>
          {cronExpression}
        </Text>
      </>
    ) : null}
  </Layout.Vertical>
)

const getOverviewContent = ({
  getString,
  name,
  description,
  identifier,
  tags
}: {
  getString: UseStringsReturn['getString']
  name?: string
  description?: string
  identifier?: string
  tags?: tagsType
}): Content[] => [
  {
    label: getString('common.triggerName'),
    value: name
  },
  {
    label: getString('description'),
    value: description || '-'
  },
  {
    label: getString('identifier'),
    value: identifier
  },
  {
    label: getString('tagsLabel'),
    value: !isEmpty(tags) ? <TagsPopover tags={tags as tagsType} /> : undefined
  }
]

const getDetailsContent = ({
  getString,
  conditionsExist,
  conditionsArr,
  jexlCondition,
  cronExpression,
  pipelineInputSet
}: {
  getString: UseStringsReturn['getString']
  conditionsExist: boolean
  conditionsArr: string[]
  jexlCondition?: string
  cronExpression?: string
  pipelineInputSet?: string
}): Content[] => [
  {
    label: '',
    value: conditionsExist ? renderConditions({ conditionsArr, jexlCondition, cronExpression, getString }) : undefined,
    hideOnUndefinedValue: true,
    type: ContentType.CUSTOM
  },
  {
    label: getString('triggers.pipelineExecutionInput'),
    value: !isEmpty(pipelineInputSet) ? <pre>{pipelineInputSet}</pre> : undefined,
    type: ContentType.CUSTOM
  }
]

const renderSwitch = ({
  getString,
  isTriggerRbacDisabled,
  triggerResponse,
  updateTrigger,
  showSuccess,
  showError,
  refetchTrigger
}: {
  getString: UseStringsReturn['getString']
  isTriggerRbacDisabled: boolean
  triggerResponse: ResponseNGTriggerDetailsResponse
  // triggerResponse: ResponseNGTriggerDetailsResponse
  updateTrigger: MutateMethod<
    ResponseNGTriggerResponse,
    NGTriggerConfigV2,
    UpdateTriggerQueryParams,
    UpdateTriggerPathParams
  >
  showSuccess: (message: string | ReactNode, timeout?: number, key?: string) => void
  showError: (message: string | ReactNode, timeout?: number, key?: string) => void
  refetchTrigger: () => void
}): JSX.Element => (
  <Switch
    style={{ paddingLeft: '46px' }}
    label={getString('enabledLabel')}
    disabled={isTriggerRbacDisabled}
    checked={triggerResponse.data?.enabled ?? false}
    onChange={async () => {
      const { values, error } = getEnabledStatusTriggerValues({
        data: triggerResponse.data,
        enabled: !!(triggerResponse.data && !triggerResponse.data.enabled),
        getString
      })
      if (error) {
        showError(error, undefined, 'pipeline.enable.status.error')
        return
      }
      try {
        const { status, data } = await updateTrigger(yamlStringify({ trigger: clearNullUndefined(values) }) as any)
        const dataEnabled = data?.enabled ? 'enabled' : 'disabled'
        if (data?.errors && !isEmpty(data?.errors)) {
          showError(getString('triggers.toast.existingTriggerError'))
          return
        } else if (status === ResponseStatus.SUCCESS) {
          showSuccess(
            getString('triggers.toast.toggleEnable', {
              enabled: dataEnabled,
              name: data?.name
            })
          )
          refetchTrigger()
        }
      } catch (err) {
        showError(err?.data?.message, undefined, 'pipeline.common.trigger.error')
      }
    }}
  />
)

export default function TriggersDetailPage(): JSX.Element {
  const { isGitSimplificationEnabled } = useAppStore()
  const { repoIdentifier, branch, connectorRef, repoName, storeType } = useQueryParams<GitQueryParams>()

  const [selectedView, setSelectedView] = React.useState<SelectedView>(SelectedView.VISUAL)

  const { orgIdentifier, projectIdentifier, pipelineIdentifier, accountId, triggerIdentifier, module } = useParams<
    PipelineType<{
      projectIdentifier: string
      orgIdentifier: string
      accountId: string
      pipelineIdentifier: string
      triggerIdentifier: string
    }>
  >()

  const {
    data: triggerResponse,
    refetch: refetchTrigger,
    loading: loadingTrigger
  } = useGetTriggerDetails({
    triggerIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      targetIdentifier: pipelineIdentifier
    }
  })

  const { mutate: updateTrigger, loading: updateTriggerLoading } = useUpdateTrigger({
    triggerIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      targetIdentifier: pipelineIdentifier
    },
    requestOptions: { headers: { 'content-type': 'application/yaml' } }
  })

  const [isExecutable] = usePermission(
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
      permissions: [PermissionIdentifier.EXECUTE_PIPELINE],
      options: {
        skipCache: true
      }
    },
    [projectIdentifier, orgIdentifier, accountId, pipelineIdentifier]
  )

  const history = useHistory()

  const goToEditWizard = (): void => {
    history.push(
      routes.toTriggersWizardPage({
        accountId,
        orgIdentifier,
        projectIdentifier,
        pipelineIdentifier,
        triggerIdentifier,
        triggerType: triggerResponse?.data?.type,
        module,
        repoIdentifier,
        branch,
        connectorRef,
        repoName,
        storeType
      })
    )
  }

  const { loading, data: pipelineSchema } = useGetSchemaYaml({
    queryParams: {
      entityType: 'Triggers',
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    }
  })

  let triggerJSON
  const triggerResponseYaml = triggerResponse?.data?.yaml || ''
  try {
    triggerJSON = parse(triggerResponseYaml)
  } catch (e) {
    // ignore error
  }

  const yamlBuilderReadOnlyModeProps: YamlBuilderProps = {
    fileName: `${triggerResponse?.data?.identifier ?? 'Trigger'}.yaml`,
    entityType: 'Triggers',
    existingJSON: triggerJSON,
    width: 900
  }

  const { showSuccess, showError } = useToaster()
  const { getString } = useStrings()
  const triggerObj = parse(triggerResponseYaml)?.trigger as NGTriggerConfigV2
  let conditionsArr: string[] = []
  const headerConditionsArr: string[] = triggerObj?.source?.spec?.spec?.headerConditions?.length
    ? getTriggerConditionsStr(triggerObj.source.spec.spec.headerConditions)
    : []
  const payloadConditionsArr: string[] = triggerObj?.source?.spec?.spec?.payloadConditions?.length
    ? getTriggerConditionsStr(triggerObj.source.spec.spec.payloadConditions)
    : []
  const eventConditionsArr: string[] = triggerObj?.source?.spec?.spec?.eventConditions?.length
    ? getTriggerConditionsStr(triggerObj.source.spec.spec.eventConditions)
    : []
  conditionsArr = conditionsArr.concat(headerConditionsArr)
  conditionsArr = conditionsArr.concat(payloadConditionsArr)
  conditionsArr = conditionsArr.concat(eventConditionsArr)
  const jexlCondition = triggerObj?.source?.spec?.spec?.jexlCondition
  const cronExpression = triggerObj?.source?.spec?.spec?.expression
  const conditionsExist = [...conditionsArr, jexlCondition, cronExpression].some(x => !!x)
  const { data: pipeline } = useGetPipelineSummary({
    pipelineIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier,
      repoIdentifier,
      branch
    }
  })
  useDocumentTitle([
    pipeline?.data?.name || getString('pipelines'),
    triggerResponse?.data?.name || getString('common.triggersLabel')
  ])

  const isPipelineInvalid = pipeline?.data?.entityValidityDetails?.valid === false

  const isTriggerRbacDisabled = !isExecutable || isPipelineInvalid

  const isGitSyncEnabled = useMemo(() => !!pipeline?.data?.gitDetails?.branch, [pipeline])

  const gitAwareForTriggerEnabled = useMemo(
    () => isGitSyncEnabled && isGitSimplificationEnabled,
    [isGitSyncEnabled, isGitSimplificationEnabled]
  )

  let pipelineInputSet
  if (gitAwareForTriggerEnabled) {
    pipelineInputSet = yamlStringify(
      pickBy(
        {
          pipelineBranchName: get(triggerObj, 'pipelineBranchName'),
          inputSetRefs: get(triggerObj, 'inputSetRefs')
        },
        key => key !== undefined
      )
    )
  } else {
    pipelineInputSet = triggerObj?.inputYaml || ''
  }

  return (
    <>
      <Container
        style={{ borderBottom: '1px solid var(--grey-200)', padding: '12px 24px 10px 24px' }}
        padding={{ top: 'xlarge', left: 'xlarge', bottom: 'medium', right: 'xlarge' }}
        background={Color.PRIMARY_1}
      >
        <Layout.Vertical spacing="medium">
          <TriggerBreadcrumbs pipelineResponse={pipeline} />
          {loadingTrigger && <Container height={loadingHeaderHeight} />}
          {triggerResponse && !loadingTrigger && (
            <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
              <Icon
                name={
                  triggerResponse.data?.type
                    ? getTriggerIcon({
                        type: triggerResponse.data.type,
                        webhookSourceRepo: triggerResponse.data.webhookDetails?.webhookSourceRepo,
                        buildType: triggerResponse.data.buildDetails?.buildType
                      })
                    : 'yaml-builder-trigger'
                }
                size={35}
              />
              <Layout.Horizontal spacing="small" data-testid={triggerResponse.data?.identifier}>
                <Layout.Vertical padding={{ left: 'small' }}>
                  <Layout.Horizontal spacing="medium" style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 20, fontWeight: 600 }} color={Color.GREY_700}>
                      {triggerResponse.data?.name}
                    </Text>
                    {renderSwitch({
                      getString,
                      isTriggerRbacDisabled,
                      triggerResponse,
                      updateTrigger,
                      showSuccess,
                      refetchTrigger,
                      showError
                    })}
                  </Layout.Horizontal>
                  <Text>
                    {getString('common.ID')}: {triggerResponse.data?.identifier}
                  </Text>
                </Layout.Vertical>
              </Layout.Horizontal>
            </Layout.Horizontal>
          )}
        </Layout.Vertical>
      </Container>
      <Page.Body loading={loadingTrigger || updateTriggerLoading} className={css.main}>
        <Layout.Horizontal className={css.panel}>
          <Layout.Vertical spacing="medium" className={css.information}>
            <Layout.Horizontal flex={{ distribution: 'space-between' }}>
              <VisualYamlToggle
                selectedView={selectedView}
                onChange={nextMode => {
                  setSelectedView(nextMode)
                }}
              />
              <Button
                variation={ButtonVariation.SECONDARY}
                icon="edit"
                onClick={goToEditWizard}
                minimal
                disabled={isTriggerRbacDisabled}
                tooltip={isPipelineInvalid ? getString('pipeline.cannotEditTriggerInvalidPipeline') : ''}
                text={getString('edit')}
              ></Button>
            </Layout.Horizontal>
            {selectedView === SelectedView.VISUAL ? (
              <Layout.Horizontal spacing="medium">
                <DetailPageCard
                  title={getString('overview')}
                  content={getOverviewContent({
                    getString,
                    name: triggerResponse?.data?.name,
                    description: triggerResponse?.data?.description,
                    identifier: triggerResponse?.data?.identifier,
                    tags: triggerResponse?.data?.tags
                  })}
                />
                {loadingTrigger ? (
                  <PageSpinner />
                ) : (
                  <DetailPageCard
                    classname={css.inputSet}
                    title={getString('details')}
                    content={getDetailsContent({
                      getString,
                      conditionsExist,
                      conditionsArr,
                      jexlCondition,
                      cronExpression,
                      pipelineInputSet
                    })}
                  />
                )}
              </Layout.Horizontal>
            ) : (
              <div className={css.editor}>
                {loading ? (
                  <PageSpinner />
                ) : (
                  <YAMLBuilder
                    {...yamlBuilderReadOnlyModeProps}
                    isReadOnlyMode={true}
                    showSnippetSection={false}
                    schema={pipelineSchema?.data}
                    onEnableEditMode={goToEditWizard}
                    isEditModeSupported={!isPipelineInvalid}
                    // isEditModeSupported={!isTriggerRbacDisabled}
                  />
                )}
              </div>
            )}
          </Layout.Vertical>
          <Layout.Vertical style={{ flex: 1 }}>
            <Layout.Horizontal spacing="xxlarge">
              <Text font={{ size: 'medium', weight: 'bold' }} inline={true} color={Color.GREY_800}>
                {getString('triggers.lastActivationDetails')}
                <HarnessDocTooltip tooltipId="lastActivationDetails" useStandAlone={true} />
              </Text>
              {triggerResponse?.data?.lastTriggerExecutionDetails?.lastExecutionSuccessful === false ? (
                <Text
                  tooltip={triggerResponse?.data?.lastTriggerExecutionDetails?.message}
                  icon="warning-sign"
                  iconProps={{ color: Color.RED_500 }}
                  color={Color.RED_500}
                  font={{ size: 'medium' }}
                  inline={true}
                >
                  {getString('failed')}
                </Text>
              ) : (
                triggerResponse?.data?.lastTriggerExecutionDetails?.lastExecutionSuccessful === true && (
                  <Text
                    tooltip={triggerResponse?.data?.lastTriggerExecutionDetails?.message}
                    icon="execution-success"
                    color={Color.GREEN_500}
                    iconProps={{ color: Color.GREEN_500 }}
                    font={{ size: 'medium' }}
                    inline={true}
                  >
                    {getString('passed')}
                  </Text>
                )
              )}
            </Layout.Horizontal>
            <Layout.Vertical spacing="small" margin={{ top: 'small' }}>
              <div>
                {triggerResponse?.data?.lastTriggerExecutionDetails?.lastExecutionTime ? (
                  <Text>
                    {`${getString('triggers.lastActivationAt')}: ${new Date(
                      triggerResponse.data.lastTriggerExecutionDetails.lastExecutionTime
                    ).toLocaleDateString()} ${new Date(
                      triggerResponse.data.lastTriggerExecutionDetails.lastExecutionTime
                    ).toLocaleTimeString()}`}
                  </Text>
                ) : null}
              </div>
              <hr />
            </Layout.Vertical>
          </Layout.Vertical>
        </Layout.Horizontal>
      </Page.Body>
    </>
  )
}
