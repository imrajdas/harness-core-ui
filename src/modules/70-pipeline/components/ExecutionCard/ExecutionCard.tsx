/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { useRef } from 'react'
import { Card, Icon, Tag, TagsPopover, Text, Checkbox } from '@wings-software/uicore'
import { FontVariation, Color } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import { Popover } from '@blueprintjs/core'
import { defaultTo, get, isEmpty } from 'lodash-es'
import cx from 'classnames'
import type { PipelineExecutionSummary } from 'services/pipeline-ng'
import { UserLabel, Duration, TimeAgoPopover } from '@common/exports'
import ExecutionStatusLabel from '@pipeline/components/ExecutionStatusLabel/ExecutionStatusLabel'
import ExecutionActions from '@pipeline/components/ExecutionActions/ExecutionActions'
import { String, useStrings } from 'framework/strings'
import { FeatureFlag } from '@common/featureFlags'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import routes from '@common/RouteDefinitions'
import type { PipelineType, PipelinePathProps, ExecutionPathProps } from '@common/interfaces/RouteInterfaces'
import { StoreType } from '@common/constants/GitSyncTypes'
import { usePermission } from '@rbac/hooks/usePermission'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ExecutionStatus, isExecutionIgnoreFailed, isExecutionNotStarted } from '@pipeline/utils/statusHelpers'
import executionFactory from '@pipeline/factories/ExecutionFactory'
import {
  hasCDStage,
  hasCIStage,
  hasOverviewDetail,
  hasServiceDetail,
  hasSTOStage,
  StageType
} from '@pipeline/utils/stageHelpers'
import { mapTriggerTypeToStringID } from '@pipeline/utils/triggerUtils'
import GitPopover from '@pipeline/components/GitPopover/GitPopover'
import { CardVariant } from '@pipeline/utils/constants'

import type { ExecutionCardInfoProps } from '@pipeline/factories/ExecutionFactory/types'

import { useAppStore } from 'framework/AppStore/AppStoreContext'
import GitRemoteDetails from '@common/components/GitRemoteDetails/GitRemoteDetails'
import { DashboardSelected, ServiceExecutionsCard } from '../ServiceExecutionsCard/ServiceExecutionsCard'
import MiniExecutionGraph from './MiniExecutionGraph/MiniExecutionGraph'
import { useExecutionCompareContext } from '../ExecutionCompareYaml/ExecutionCompareContext'
import css from './ExecutionCard.module.scss'

export interface ExecutionCardProps {
  pipelineExecution: PipelineExecutionSummary
  variant?: CardVariant
  staticCard?: boolean
  isPipelineInvalid?: boolean
  showGitDetails?: boolean
  onViewCompiledYaml?: () => void
}

function ExecutionCardFooter({
  pipelineExecution,
  variant
}: Pick<ExecutionCardProps, 'pipelineExecution' | 'variant'>): React.ReactElement {
  const fontVariation = variant === CardVariant.Minimal ? FontVariation.TINY : FontVariation.SMALL
  const variantSize = variant === CardVariant.Minimal ? 10 : 14
  return (
    <div className={css.footer}>
      <div className={css.triggerInfo}>
        <UserLabel
          className={css.user}
          name={
            get(pipelineExecution, 'moduleInfo.ci.ciExecutionInfoDTO.author.name') ||
            get(pipelineExecution, 'moduleInfo.ci.ciExecutionInfoDTO.author.id') ||
            get(pipelineExecution, 'executionTriggerInfo.triggeredBy.identifier') ||
            'Anonymous'
          }
          email={
            get(pipelineExecution, 'moduleInfo.ci.ciExecutionInfoDTO.author.email') ||
            get(pipelineExecution, 'executionTriggerInfo.triggeredBy.extraInfo.email')
          }
          profilePictureUrl={
            get(pipelineExecution, 'moduleInfo.ci.ciExecutionInfoDTO.author.avatar') ||
            get(pipelineExecution, 'executionTriggerInfo.triggeredBy.avatar')
          }
          textProps={{
            font: { variation: fontVariation }
          }}
          iconProps={{ color: Color.GREY_900 }}
        />
        <Text font={{ variation: fontVariation }}>
          <String
            className={css.triggerType}
            stringID={mapTriggerTypeToStringID(get(pipelineExecution, 'executionTriggerInfo.triggerType'))}
          />
        </Text>
      </div>
      <div className={css.timers}>
        <TimeAgoPopover
          iconProps={{
            size: variantSize,
            color: Color.GREY_900
          }}
          icon="calendar"
          time={defaultTo(pipelineExecution?.startTs, 0)}
          inline={false}
          className={css.timeAgo}
          font={{ variation: fontVariation }}
        />
        <Duration
          icon="time"
          className={css.duration}
          iconProps={{
            size: variantSize,
            color: Color.GREY_900
          }}
          startTime={pipelineExecution?.startTs}
          durationText={variant === CardVariant.Default ? undefined : ' '}
          endTime={pipelineExecution?.endTs}
          font={{ variation: fontVariation }}
        />
      </div>
    </div>
  )
}

export default function ExecutionCard(props: ExecutionCardProps): React.ReactElement {
  const {
    pipelineExecution,
    variant = CardVariant.Default,
    staticCard = false,
    isPipelineInvalid,
    showGitDetails = false,
    onViewCompiledYaml
  } = props
  const { orgIdentifier, projectIdentifier, accountId, module, pipelineIdentifier } =
    useParams<PipelineType<PipelinePathProps>>()
  const history = useHistory()
  const { getString } = useStrings()
  const SECURITY = useFeatureFlag(FeatureFlag.SECURITY)
  const HAS_CD = hasCDStage(pipelineExecution)
  const IS_SERVICEDETAIL = hasServiceDetail(pipelineExecution)
  const IS_OVERVIEWPAGE = hasOverviewDetail(pipelineExecution)
  const HAS_CI = hasCIStage(pipelineExecution)
  const HAS_STO = hasSTOStage(pipelineExecution)
  const cdInfo = executionFactory.getCardInfo(StageType.DEPLOY)
  const ciInfo = executionFactory.getCardInfo(StageType.BUILD)
  const stoInfo = executionFactory.getCardInfo(StageType.SECURITY)
  const { isGitSimplificationEnabled } = useAppStore()
  const { isCompareMode, compareItems, addToCompare, removeFromCompare } = useExecutionCompareContext()

  const checkboxRef = useRef<HTMLDivElement>(null)
  const [canEdit, canExecute] = usePermission(
    {
      resourceScope: {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      },
      resource: {
        resourceType: ResourceType.PIPELINE,
        resourceIdentifier: pipelineExecution.pipelineIdentifier as string
      },
      permissions: [PermissionIdentifier.EDIT_PIPELINE, PermissionIdentifier.EXECUTE_PIPELINE]
    },
    [orgIdentifier, projectIdentifier, accountId, pipelineExecution.pipelineIdentifier]
  )
  const disabled = isExecutionNotStarted(pipelineExecution.status)
  const source: ExecutionPathProps['source'] = pipelineIdentifier ? 'executions' : 'deployments'

  const handleClick = (e: any) => {
    if (checkboxRef.current?.contains(e.target)) return
    const { pipelineIdentifier: cardPipelineId, planExecutionId } = pipelineExecution
    if (!disabled && cardPipelineId && planExecutionId) {
      history.push(
        routes.toExecutionPipelineView({
          orgIdentifier,
          pipelineIdentifier: cardPipelineId,
          executionIdentifier: planExecutionId,
          projectIdentifier,
          accountId,
          module,
          source
        })
      )
    }
  }

  const isCompareItem =
    compareItems?.findIndex(compareItem => compareItem.planExecutionId === pipelineExecution.planExecutionId) >= 0

  const onCompareToggle = () => {
    if (!isCompareItem) {
      addToCompare(pipelineExecution)
    } else {
      removeFromCompare(pipelineExecution)
    }
  }

  return (
    <Card
      elevation={0}
      className={cx(css.card, !staticCard && css.hoverCard)}
      data-disabled={disabled}
      data-variant={variant}
    >
      <div className={cx(!staticCard && css.cardLink)} onClick={handleClick}>
        <div className={css.content}>
          <div className={css.header}>
            <div className={css.info}>
              <div className={css.nameGroup}>
                {isCompareMode && (
                  <div className={css.compareSelection} ref={checkboxRef}>
                    <Checkbox
                      size={12}
                      checked={isCompareItem}
                      onChange={onCompareToggle}
                      disabled={compareItems.length === 2 && !isCompareItem}
                    />
                  </div>
                )}
                <div className={css.pipelineName}>{pipelineExecution?.name}</div>
                {variant === CardVariant.Default ? (
                  <String
                    className={css.executionId}
                    stringID={
                      module === 'cd' ? 'execution.pipelineIdentifierTextCD' : 'execution.pipelineIdentifierTextCI'
                    }
                    vars={pipelineExecution}
                  />
                ) : null}
              </div>
              {!isEmpty(pipelineExecution?.tags) ? (
                <TagsPopover
                  iconProps={{ size: 14 }}
                  className={css.tags}
                  popoverProps={{ wrapperTagName: 'div', targetTagName: 'div' }}
                  tags={defaultTo(pipelineExecution?.tags, []).reduce((val, tag) => {
                    return Object.assign(val, { [tag.key]: tag.value })
                  }, {} as { [key: string]: string })}
                />
              ) : null}
              {isGitSimplificationEnabled && pipelineExecution?.storeType === StoreType.REMOTE
                ? showGitDetails && (
                    <div className={css.gitRemoteDetailsWrapper}>
                      <GitRemoteDetails
                        repoName={pipelineExecution?.gitDetails?.repoName}
                        branch={pipelineExecution?.gitDetails?.branch}
                        filePath={pipelineExecution?.gitDetails?.filePath}
                        flags={{ readOnly: true }}
                      />
                    </div>
                  )
                : pipelineExecution.gitDetails && (
                    <GitPopover
                      data={pipelineExecution.gitDetails}
                      iconProps={{ size: 14 }}
                      popoverProps={{ wrapperTagName: 'div', targetTagName: 'div' }}
                    />
                  )}
            </div>
            <div className={css.actions}>
              <div className={css.statusContainer}>
                <ExecutionStatusLabel status={pipelineExecution.status as ExecutionStatus} />
                {isExecutionIgnoreFailed(pipelineExecution.status) ? (
                  <Popover
                    wrapperTagName="div"
                    targetTagName="div"
                    interactionKind="hover"
                    popoverClassName={css.ignoreFailedPopover}
                    content={
                      <String
                        tagName="div"
                        className={css.ignoreFailedTooltip}
                        stringID="pipeline.execution.ignoreFailedWarningText"
                      />
                    }
                  >
                    <Icon name="warning-sign" size={16} className={css.ignoreWarning} />
                  </Popover>
                ) : null}
              </div>
              {variant === CardVariant.Default || variant === CardVariant.MinimalWithActions ? (
                <ExecutionActions
                  executionStatus={pipelineExecution.status as ExecutionStatus}
                  params={{
                    accountId,
                    orgIdentifier,
                    pipelineIdentifier: defaultTo(pipelineExecution?.pipelineIdentifier, ''),
                    executionIdentifier: defaultTo(pipelineExecution?.planExecutionId, ''),
                    projectIdentifier,
                    module,
                    repoIdentifier: pipelineExecution?.gitDetails?.repoIdentifier,
                    connectorRef: pipelineExecution.connectorRef,
                    repoName: pipelineExecution?.gitDetails?.repoName,
                    branch: pipelineExecution?.gitDetails?.branch,
                    stagesExecuted: pipelineExecution?.stagesExecuted,
                    storeType: pipelineExecution?.storeType as StoreType
                  }}
                  isPipelineInvalid={isPipelineInvalid}
                  canEdit={canEdit}
                  onViewCompiledYaml={onViewCompiledYaml}
                  onCompareExecutions={() => addToCompare(pipelineExecution)}
                  source={source}
                  canExecute={canExecute}
                  canRetry={pipelineExecution.canRetry}
                  modules={pipelineExecution.modules}
                />
              ) : null}
            </div>
          </div>
          <div className={css.main}>
            <div className={css.modulesContainer}>
              {pipelineExecution?.stagesExecuted?.length ? (
                <Tag className={css.singleExecutionTag}>{`${getString('pipeline.singleStageExecution')}
                ${
                  !!pipelineExecution.stagesExecutedNames &&
                  Object.values(pipelineExecution.stagesExecutedNames).join(', ')
                }
                 `}</Tag>
              ) : null}
              {HAS_CI && ciInfo ? (
                <div className={css.moduleData}>
                  <Icon name={ciInfo.icon} size={20} className={css.moduleIcon} />
                  {React.createElement<ExecutionCardInfoProps>(ciInfo.component, {
                    data: defaultTo(pipelineExecution?.moduleInfo?.ci, {}),
                    nodeMap: defaultTo(pipelineExecution?.layoutNodeMap, {}),
                    startingNodeId: defaultTo(pipelineExecution?.startingNodeId, ''),
                    variant
                  })}
                </div>
              ) : null}
              {HAS_CD && cdInfo && !(IS_SERVICEDETAIL || IS_OVERVIEWPAGE) ? (
                <div className={css.moduleData}>
                  <Icon name={cdInfo.icon} size={20} className={css.moduleIcon} />
                  {React.createElement<ExecutionCardInfoProps>(cdInfo.component, {
                    data: defaultTo(pipelineExecution?.moduleInfo?.cd, {}),
                    nodeMap: defaultTo(pipelineExecution?.layoutNodeMap, {}),
                    startingNodeId: defaultTo(pipelineExecution?.startingNodeId, ''),
                    variant
                  })}
                </div>
              ) : null}
              {(IS_SERVICEDETAIL || IS_OVERVIEWPAGE) && cdInfo ? (
                <div style={{ position: 'relative' }}>
                  <ServiceExecutionsCard
                    envIdentifiers={pipelineExecution?.moduleInfo?.cd?.envIdentifiers as string[]}
                    serviceIdentifiers={pipelineExecution?.moduleInfo?.cd?.serviceIdentifiers as string[]}
                    caller={IS_SERVICEDETAIL ? DashboardSelected.SERVICEDETAIL : DashboardSelected.OVERVIEW}
                  />
                </div>
              ) : null}
              {SECURITY && HAS_STO && stoInfo ? (
                <div className={css.moduleData}>
                  <Icon name={stoInfo.icon} size={20} className={css.moduleIcon} />
                  {React.createElement<ExecutionCardInfoProps<PipelineExecutionSummary>>(stoInfo.component, {
                    data: defaultTo(pipelineExecution, {}),
                    nodeMap: defaultTo(pipelineExecution?.layoutNodeMap, {}),
                    startingNodeId: defaultTo(pipelineExecution?.startingNodeId, ''),
                    variant
                  })}
                </div>
              ) : null}
            </div>
            {variant === CardVariant.Default ? (
              <MiniExecutionGraph
                pipelineExecution={pipelineExecution}
                projectIdentifier={projectIdentifier}
                orgIdentifier={orgIdentifier}
                accountId={accountId}
                source={source}
                module={module}
              />
            ) : null}
          </div>
        </div>
        <ExecutionCardFooter pipelineExecution={pipelineExecution} variant={variant} />
      </div>
    </Card>
  )
}
