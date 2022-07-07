/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Position } from '@blueprintjs/core'
import { Button, ButtonVariation } from '@wings-software/uicore'
import { useHistory, useParams } from 'react-router-dom'
import { merge, noop } from 'lodash-es'
import { useStrings } from 'framework/strings'
import { getAllowedTemplateTypes, TemplateType } from '@templates-library/utils/templatesUtils'
import routes from '@common/RouteDefinitions'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  TemplateMenuItem,
  TemplatesActionPopover
} from '@templates-library/components/TemplatesActionPopover/TemplatesActionPopover'
import { DefaultNewTemplateId } from 'framework/Templates/templates'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { usePermission } from '@rbac/hooks/usePermission'
import RBACTooltip from '@rbac/components/RBACTooltip/RBACTooltip'
import { FeatureIdentifier } from 'framework/featureStore/FeatureIdentifier'
import { useFeature } from '@common/hooks/useFeatures'
import { FeatureWarningTooltip } from '@common/components/FeatureWarning/FeatureWarningWithTooltip'
import { useFeatureFlag } from '@common/hooks/useFeatureFlag'
import { FeatureFlag } from '@common/featureFlags'

function NewTemplatePopoverWrapper(): React.ReactElement {
  const { getString } = useStrings()
  const history = useHistory()
  const { projectIdentifier, orgIdentifier, accountId, module } = useParams<ProjectPathProps & ModulePathParams>()
  const scriptTemplateEnabled = useFeatureFlag(FeatureFlag.CUSTOM_SECRET_MANAGER_NG)
  const allowedTemplateTypes = getAllowedTemplateTypes(getString, module, scriptTemplateEnabled)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { enabled: templatesEnabled } = useFeature({
    featureRequest: {
      featureName: FeatureIdentifier.TEMPLATE_SERVICE
    }
  })
  const rbacResourcePermission = {
    resource: {
      resourceType: ResourceType.TEMPLATE
    }
  }
  const [canEdit] = usePermission({
    ...rbacResourcePermission,
    permissions: [PermissionIdentifier.EDIT_TEMPLATE]
  })
  const goToTemplateStudio = React.useCallback(
    (templateType: TemplateType) => {
      history.push(
        routes.toTemplateStudio({
          projectIdentifier,
          orgIdentifier,
          accountId,
          module,
          templateType,
          templateIdentifier: DefaultNewTemplateId
        })
      )
    },
    [projectIdentifier, orgIdentifier, accountId, module]
  )

  const getMenu = (): TemplateMenuItem[] => {
    return allowedTemplateTypes.map(templateType => {
      return merge(templateType, {
        onClick: () => goToTemplateStudio(templateType.value as TemplateType)
      })
    })
  }

  const tooltipBtn = React.useCallback(
    () =>
      !canEdit ? (
        <RBACTooltip permission={PermissionIdentifier.EDIT_TEMPLATE} resourceType={ResourceType.TEMPLATE} />
      ) : !templatesEnabled ? (
        <FeatureWarningTooltip featureName={FeatureIdentifier.TEMPLATE_SERVICE} />
      ) : undefined,
    [canEdit, templatesEnabled]
  )

  return (
    <TemplatesActionPopover
      open={menuOpen}
      minimal={true}
      items={getMenu()}
      position={Position.BOTTOM}
      disabled={!canEdit || !templatesEnabled}
      setMenuOpen={setMenuOpen}
      usePortal={false}
    >
      <Button
        variation={ButtonVariation.PRIMARY}
        icon="plus"
        rightIcon="chevron-down"
        text={getString('templatesLibrary.addNewTemplate')}
        onClick={noop}
        disabled={!canEdit || !templatesEnabled}
        tooltip={tooltipBtn()}
      />
    </TemplatesActionPopover>
  )
}

export const NewTemplatePopover = React.memo(NewTemplatePopoverWrapper)
