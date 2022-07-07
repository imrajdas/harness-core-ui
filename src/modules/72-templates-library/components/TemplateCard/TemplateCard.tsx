/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, isEmpty, noop } from 'lodash-es'
import { Card, Text, Container, Tag, Layout, Icon } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import cx from 'classnames'
import { Position } from '@blueprintjs/core'
import { TimeAgoPopover } from '@common/components'
import { getIconForTemplate, templateColorStyleMap } from '@templates-library/pages/TemplatesPage/TemplatesPageUtils'
import { TemplateTags } from '@templates-library/components/TemplateTags/TemplateTags'
import { useStrings } from 'framework/strings'
import { getRepoDetailsByIndentifier } from '@common/utils/gitSyncUtils'
import type { NGTemplateInfoConfig, TemplateSummaryResponse } from 'services/template-ng'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useGitSyncStore } from 'framework/GitRepoStore/GitSyncStoreContext'
import { TemplateListCardContextMenu } from '@templates-library/pages/TemplatesPage/views/TemplateListCardContextMenu/TemplateListCardContextMenu'
import { Badge } from '@pipeline/pages/utils/Badge/Badge'
import type { NGTemplateInfoConfigWithGitDetails } from 'framework/Templates/TemplateConfigModal/TemplateConfigModal'
import { ScopeBadge } from '@common/components/ScopeBadge/ScopeBadge'
import { TemplateColor } from './TemplateColor/TemplateColor'
import css from './TemplateCard.module.scss'

export interface TemplateCardProps {
  template: NGTemplateInfoConfigWithGitDetails | TemplateSummaryResponse
  onSelect?: (template: NGTemplateInfoConfig | TemplateSummaryResponse) => void
  isSelected?: boolean
  onPreview?: (template: NGTemplateInfoConfig | TemplateSummaryResponse) => void
  onOpenEdit?: (template: NGTemplateInfoConfig | TemplateSummaryResponse) => void
  onOpenSettings?: (templateIdentifier: string) => void
  onDelete?: (template: TemplateSummaryResponse) => void
}

export function TemplateCard(props: TemplateCardProps): JSX.Element {
  const { getString } = useStrings()
  const { template, onSelect, isSelected, onPreview, onOpenEdit, onOpenSettings, onDelete } = props

  const { isGitSyncEnabled } = useAppStore()
  const { gitSyncRepos, loadingRepos } = useGitSyncStore()

  const templateEntityType =
    (template as TemplateSummaryResponse)?.templateEntityType || (template as NGTemplateInfoConfig)?.type
  const style = templateColorStyleMap[templateEntityType]
  const showMenu = !onPreview && !onOpenEdit && !onOpenSettings && !onDelete
  const repoIdentifier =
    (template as TemplateSummaryResponse)?.gitDetails?.repoIdentifier ||
    (template as NGTemplateInfoConfigWithGitDetails)?.repo
  const branch =
    (template as TemplateSummaryResponse)?.gitDetails?.branch ||
    (template as NGTemplateInfoConfigWithGitDetails)?.branch

  const templateIcon = getIconForTemplate(getString, template)

  return (
    <Container className={cx(css.container, { [css.bordered]: !!onSelect }, { [css.selected]: !!isSelected })}>
      <Card className={css.templateCard} onClick={() => onSelect?.(template)}>
        {!showMenu ? (
          <TemplateListCardContextMenu
            template={template}
            onPreview={onPreview || noop}
            onOpenEdit={onOpenEdit || noop}
            onOpenSettings={onOpenSettings || noop}
            onDelete={onDelete || noop}
            className={css.actionButton}
            position={Position.RIGHT_TOP}
          />
        ) : (
          <div />
        )}
        <Container margin={{ right: 'small' }}>
          <Layout.Horizontal spacing={'small'} margin={{ bottom: 'small' }} flex>
            {!!templateIcon && <Icon name={templateIcon} size={24} />}
            {(template as TemplateSummaryResponse).entityValidityDetails?.valid === false && (
              <Badge
                text={'common.invalid'}
                iconName="error-outline"
                showTooltip={true}
                entityName={template.name}
                entityType={'Template'}
                showInvalidText={true}
              />
            )}
          </Layout.Horizontal>
        </Container>
        <Container>
          <Text
            lineClamp={1}
            font={{ weight: 'semi-bold' }}
            color={template.name ? Color.GREY_800 : Color.GREY_400}
            data-testid={template.identifier}
          >
            {template.name || getString('templatesLibrary.createNewModal.namePlaceholder')}
          </Text>
          <Text font="small" lineClamp={1} color={Color.GREY_400} margin={{ top: 'xsmall' }}>
            {getString('idLabel', { id: template.identifier })}
          </Text>
        </Container>
        <Container>
          <ScopeBadge data={template} />
        </Container>
        {!!template.tags && !isEmpty(template.tags) && <TemplateTags tags={template.tags} />}
        <Container height={1} background={Color.GREY_100} />
        {isGitSyncEnabled && !!repoIdentifier && !!branch && (
          <>
            <Container className={css.infoContainer}>
              <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
                <Text className={css.label} font="small" width={80} color={Color.GREY_700}>
                  {getString('pipeline.gitRepo')}
                </Text>
                <Layout.Horizontal style={{ alignItems: 'center' }} spacing={'small'}>
                  <Icon name="repository" size={10} color={Color.GREY_600} />
                  <Text font={{ size: 'small' }} color={Color.BLACK} title={repoIdentifier} lineClamp={1} width={40}>
                    {(!loadingRepos && getRepoDetailsByIndentifier(repoIdentifier, gitSyncRepos)?.name) || ''}
                  </Text>
                </Layout.Horizontal>
              </Layout.Horizontal>

              <Layout.Horizontal flex={{ justifyContent: 'flex-start' }}>
                <Text className={css.label} font="small" width={80} color={Color.GREY_700}>
                  {getString('pipelineSteps.deploy.inputSet.branch')}
                </Text>
                <Layout.Horizontal style={{ alignItems: 'center' }} spacing={'small'}>
                  <Icon name="git-new-branch" size={10} color={Color.GREY_500} />
                  <Text font={{ size: 'small' }} color={Color.BLACK} title={branch} lineClamp={1} width={40}>
                    {branch}
                  </Text>
                </Layout.Horizontal>
              </Layout.Horizontal>
            </Container>
            <Container height={1} background={Color.GREY_100} />
          </>
        )}
        {template.versionLabel && (
          <Container>
            <Tag className={css.version}>{template.versionLabel}</Tag>
          </Container>
        )}
        {(template as TemplateSummaryResponse).lastUpdatedAt && (
          <Container>
            <Layout.Horizontal spacing={'xsmall'} flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
              <Text font={{ size: 'xsmall' }} color={Color.GREY_800}>
                {getString('lastUpdated')}
              </Text>
              <TimeAgoPopover
                font="xsmall"
                color={Color.GREY_800}
                time={defaultTo((template as TemplateSummaryResponse).lastUpdatedAt, 0)}
              />
            </Layout.Horizontal>
          </Container>
        )}
        <Container flex={{ justifyContent: 'center' }} padding={{ top: 'medium' }}>
          <TemplateColor
            fill={style.fill as string}
            stroke={style.stroke as string}
            textColor={style.color as string}
            title={templateEntityType.toUpperCase()}
          />
        </Container>
      </Card>
    </Container>
  )
}
