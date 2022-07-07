/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { defaultTo, isEmpty, isEqual } from 'lodash-es'
import { parse } from 'yaml'
import { ButtonVariation, Tag } from '@wings-software/uicore'
import { useParams } from 'react-router-dom'
import type { YamlBuilderHandlerBinding } from '@common/interfaces/YAMLBuilderProps'
import { useStrings } from 'framework/strings'
import RbacButton from '@rbac/components/Button/Button'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { TemplateContext } from '@templates-library/components/TemplateStudio/TemplateContext/TemplateContext'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { useVariablesExpression } from '@pipeline/components/PipelineStudio/PiplineHooks/useVariablesExpression'
import { useGetTemplateSchema } from 'services/template-ng'
import { getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { YamlBuilderMemo } from '@common/components/YAMLBuilder/YamlBuilder'
import css from './TemplateYamlView.module.scss'

export const POLL_INTERVAL = 1 /* sec */ * 1000 /* ms */

let Interval: number | undefined
const defaultFileName = 'Template.yaml'
const TemplateYamlView: React.FC = () => {
  const {
    state: {
      template,
      templateView: { isDrawerOpened, isYamlEditable },
      templateView,
      templateYaml,
      entityValidityDetails: { valid }
    },
    updateTemplateView,
    isReadonly,
    updateTemplate,
    setYamlHandler: setYamlHandlerContext
  } = React.useContext(TemplateContext)
  const { accountId, projectIdentifier, orgIdentifier } = useParams<ProjectPathProps>()
  const [yamlHandler, setYamlHandler] = React.useState<YamlBuilderHandlerBinding | undefined>()
  const [yamlFileName, setYamlFileName] = React.useState<string>(defaultFileName)
  const { getString } = useStrings()
  const { expressions } = useVariablesExpression()
  const isTemplateSchemaValidationEnabled = useFeatureFlag(FeatureFlag.TEMPLATE_SCHEMA_VALIDATION)
  const expressionRef = React.useRef<string[]>([])
  expressionRef.current = expressions

  // setup polling
  React.useEffect(() => {
    if (yamlHandler && !isDrawerOpened) {
      Interval = window.setInterval(() => {
        try {
          const templateFromYaml = parse(yamlHandler.getLatestYaml())?.template
          const schemaValidationErrorMap = yamlHandler.getYAMLValidationErrorMap()
          const areSchemaValidationErrorsAbsent = !(schemaValidationErrorMap && schemaValidationErrorMap.size > 0)
          if (
            !isEqual(template, templateFromYaml) &&
            !isEmpty(templateFromYaml) &&
            areSchemaValidationErrorsAbsent // Don't update for Invalid Yaml
          ) {
            updateTemplate(templateFromYaml)
          }
        } catch (e) {
          // Ignore Error
        }
      }, POLL_INTERVAL)
      return () => {
        window.clearInterval(Interval)
      }
    } else {
      return void 0
    }
  }, [yamlHandler, template, isDrawerOpened])

  React.useEffect(() => {
    if (yamlHandler) {
      setYamlHandlerContext(yamlHandler)
    }
  }, [yamlHandler, setYamlHandlerContext])

  React.useEffect(() => {
    setYamlFileName(template.identifier + '.yaml')
  }, [template.identifier])

  const { data: templateSchema } = useGetTemplateSchema({
    queryParams: {
      templateEntityType: template.type,
      entityType: template.spec?.type,
      projectIdentifier,
      orgIdentifier,
      accountIdentifier: accountId,
      scope: getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
    },
    lazy: !isTemplateSchemaValidationEnabled
  })

  return (
    <div className={css.yamlBuilder}>
      <>
        {!isDrawerOpened && (
          <YamlBuilderMemo
            key={isYamlEditable.toString()}
            fileName={defaultTo(yamlFileName, defaultFileName)}
            entityType="Template"
            isReadOnlyMode={isReadonly || !isYamlEditable}
            existingJSON={{ template }}
            existingYaml={!valid ? templateYaml : undefined}
            bind={setYamlHandler}
            showSnippetSection={false}
            schema={templateSchema?.data}
            onExpressionTrigger={() => {
              return Promise.resolve(
                expressionRef.current.map(item => ({ label: item, insertText: `${item}>`, kind: 1 }))
              )
            }}
            yamlSanityConfig={{ removeEmptyString: false, removeEmptyObject: false, removeEmptyArray: false }}
            height={'calc(100vh - 200px)'}
            width="calc(100vw - 400px)"
            invocationMap={factory.getInvocationMap()}
            onEnableEditMode={() => {
              updateTemplateView({ ...templateView, isYamlEditable: true })
            }}
            isEditModeSupported={!isReadonly}
          />
        )}
      </>
      {isReadonly || !isYamlEditable ? (
        <div className={css.buttonsWrapper}>
          <Tag>{getString('common.readOnly')}</Tag>
          <RbacButton
            permission={{
              resourceScope: {
                accountIdentifier: accountId,
                orgIdentifier,
                projectIdentifier
              },
              resource: {
                resourceType: ResourceType.TEMPLATE,
                resourceIdentifier: template.identifier
              },
              permission: PermissionIdentifier.EDIT_TEMPLATE
            }}
            variation={ButtonVariation.SECONDARY}
            text={getString('common.editYaml')}
            onClick={() => {
              updateTemplateView({ ...templateView, isYamlEditable: true })
            }}
          />
        </div>
      ) : null}
    </div>
  )
}

export default TemplateYamlView
