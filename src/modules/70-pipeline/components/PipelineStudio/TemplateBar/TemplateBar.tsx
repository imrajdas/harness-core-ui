/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, isEmpty } from 'lodash-es'
import { useParams } from 'react-router-dom'
import { Container, Icon, IconName, Layout, Popover, Text, useConfirmationDialog } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useModalHook } from '@harness/use-modal'
import { Classes, Dialog, Intent, Menu, Position } from '@blueprintjs/core'
import cx from 'classnames'
import { String, useStrings } from 'framework/strings'
import { getTemplateNameWithLabel } from '@pipeline/utils/templateUtils'
import { useFeature } from '@common/hooks/useFeatures'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import routes from '@common/RouteDefinitions'
import type { PipelineType, ProjectPathProps, GitQueryParams } from '@common/interfaces/RouteInterfaces'
import { TemplateSummaryResponse, useGetTemplate } from 'services/template-ng'
import {
  getIdentifierFromValue,
  getScopeBasedProjectPathParams,
  getScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import { TemplateYaml } from '@pipeline/components/PipelineStudio/TemplateYaml/TemplateYaml'
import type { TemplateLinkConfig } from 'services/pipeline-ng'
import { useQueryParams } from '@common/hooks'
import { usePipelineContext } from '@pipeline/components/PipelineStudio/PipelineContext/PipelineContext'
import css from './TemplateBar.module.scss'

interface TemplateMenuItem {
  icon?: IconName
  label: string
  disabled?: boolean
  onClick: () => void
}

export interface TemplateBarProps {
  templateLinkConfig: TemplateLinkConfig
  onOpenTemplateSelector: (selectedTemplate: TemplateSummaryResponse) => void
  onRemoveTemplate: () => Promise<void>
  className?: string
}

export function TemplateBar(props: TemplateBarProps): JSX.Element {
  const { isReadonly } = usePipelineContext()
  const { templateLinkConfig, onOpenTemplateSelector, onRemoveTemplate, className = '' } = props
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { getString } = useStrings()
  const { module, ...params } = useParams<PipelineType<ProjectPathProps>>()
  const { branch, repoIdentifier } = useQueryParams<GitQueryParams>()
  const scope = getScopeFromValue(templateLinkConfig.templateRef)
  const { enabled } = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.TEMPLATE_SERVICE
    }
  })

  const readyOnly = isReadonly || !enabled

  const { data, loading } = useGetTemplate({
    templateIdentifier: getIdentifierFromValue(templateLinkConfig.templateRef),
    queryParams: {
      ...getScopeBasedProjectPathParams(params, scope),
      versionLabel: defaultTo(templateLinkConfig.versionLabel, ''),
      repoIdentifier,
      branch,
      getDefaultFromOtherRepo: true
    }
  })

  const selectedTemplate = React.useMemo(
    () => (data?.data ? { ...data.data, versionLabel: templateLinkConfig.versionLabel } : undefined),
    [data?.data]
  )

  const onChangeTemplate = () => {
    if (selectedTemplate) {
      onOpenTemplateSelector(selectedTemplate)
    }
  }

  const { openDialog: openRemoveTemplateDialog } = useConfirmationDialog({
    intent: Intent.DANGER,
    buttonIntent: Intent.DANGER,
    cancelButtonText: getString('cancel'),
    contentText: (
      <String
        stringID="pipeline.removeTemplate"
        vars={{
          name: getTemplateNameWithLabel(selectedTemplate),
          entity: selectedTemplate?.templateEntityType?.toLowerCase()
        }}
        useRichText={true}
      />
    ),
    titleText: `${getString('pipeline.removeTemplateLabel')}?`,
    confirmButtonText: getString('confirm'),
    onCloseDialog: async isConfirmed => {
      if (isConfirmed) {
        await onRemoveTemplate()
      }
    }
  })

  const openTemplateInNewTab = () => {
    if (selectedTemplate) {
      const templateStudioPath = routes.toTemplateStudio({
        projectIdentifier: selectedTemplate.projectIdentifier,
        orgIdentifier: selectedTemplate.orgIdentifier,
        accountId: defaultTo(selectedTemplate.accountId, ''),
        module,
        templateType: selectedTemplate.templateEntityType,
        templateIdentifier: selectedTemplate.identifier,
        versionLabel: selectedTemplate.versionLabel,
        repoIdentifier: selectedTemplate.gitDetails?.repoIdentifier,
        branch: selectedTemplate.gitDetails?.branch
      })

      window.open(`${window.location.origin}${window.location.pathname}#${templateStudioPath}`, '_blank')
    }
  }

  const [showTemplateYAMLPreviewModal, hideTemplateYAMLPreviewModal] = useModalHook(
    () => (
      <Dialog
        isOpen
        enforceFocus={false}
        canEscapeKeyClose
        canOutsideClickClose
        onClose={hideTemplateYAMLPreviewModal}
        title={'template.yaml'}
        isCloseButtonShown
        className={cx(Classes.DIALOG, css.templateYamlPreviewDialog)}
        usePortal
        backdropClassName={css.templateYamlPreviewDialogBackdrop}
      >
        <Container className={css.templateYamlPreviewContainer}>
          <TemplateYaml
            templateYaml={defaultTo(selectedTemplate?.yaml, '')}
            withoutHeader
            overrideEditorOptions={{
              scrollbar: {
                useShadows: false,
                handleMouseWheel: true
              },
              scrollBeyondLastLine: true
            }}
          />
        </Container>
      </Dialog>
    ),
    [selectedTemplate?.yaml]
  )

  const getItems = (): TemplateMenuItem[] => {
    return [
      ...(!readyOnly
        ? ([
            {
              icon: 'command-switch',
              label: getString('pipeline.changeTemplateLabel'),
              onClick: onChangeTemplate
            },
            {
              icon: 'main-trash',
              label: getString('pipeline.removeTemplateLabel'),
              onClick: openRemoveTemplateDialog
            }
          ] as TemplateMenuItem[])
        : []),
      {
        icon: 'main-share',
        label: getString('pipeline.openTemplateInNewTabLabel'),
        onClick: openTemplateInNewTab
      },
      {
        icon: 'main-view',
        label: getString('pipeline.previewTemplateLabel'),
        onClick: showTemplateYAMLPreviewModal
      }
    ]
  }

  return (
    <Container
      padding={{ top: 'small', right: 'medium', bottom: 'small', left: 'medium' }}
      background={Color.PRIMARY_6}
      border={{ radius: 4 }}
      className={cx(css.container, className)}
    >
      <Layout.Horizontal spacing={'small'} flex={{ alignItems: 'center', justifyContent: 'flex-start' }}>
        <Icon size={11} color={Color.WHITE} name={'template-library'} />
        {loading && (
          <Text style={{ flexGrow: 1 }} font={{ size: 'small' }} color={Color.WHITE}>
            {getString('loading')}
          </Text>
        )}
        {!loading && !isEmpty(selectedTemplate) && (
          <Text style={{ flexGrow: 1 }} font={{ size: 'small' }} color={Color.WHITE}>
            {`Using Template: ${getTemplateNameWithLabel(selectedTemplate)}`}
          </Text>
        )}
        <Popover
          isOpen={menuOpen}
          onInteraction={nextOpenState => {
            setMenuOpen(nextOpenState)
          }}
          position={Position.BOTTOM_RIGHT}
          className={css.main}
          disabled={isEmpty(selectedTemplate)}
          portalClassName={css.popover}
        >
          <Icon
            name={'more'}
            color={Color.WHITE}
            className={css.actionButton}
            onClick={e => {
              e.stopPropagation()
              setMenuOpen(true)
            }}
          />
          <Menu style={{ minWidth: 'unset' }} onClick={e => e.stopPropagation()}>
            {getItems().map(item => {
              return (
                <li
                  key={item.label}
                  className={cx(css.menuItem, { [css.disabled]: item.disabled })}
                  onClick={e => {
                    e.stopPropagation()
                    if (!item.disabled) {
                      item.onClick()
                      setMenuOpen(false)
                    }
                  }}
                >
                  {item.icon && <Icon name={item.icon} size={12} />}
                  <Text lineClamp={1}>{item.label}</Text>
                </li>
              )
            })}
          </Menu>
        </Popover>
      </Layout.Horizontal>
    </Container>
  )
}
