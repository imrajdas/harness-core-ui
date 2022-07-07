/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Color } from '@harness/design-system'
import { Template, TemplateProps } from '@templates-library/components/AbstractTemplate/Template'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import type { NGTemplateInfoConfig } from 'services/template-ng'
import type { TemplateInputsProps } from '@templates-library/components/TemplateInputs/TemplateInputs'
import MonitoredServiceInputSetsTemplate from '@cv/pages/monitored-service/MonitoredServiceInputSetsTemplate/MonitoredServiceInputSetsTemplate'
import { MonitoredTemplateCanvasWithRef } from './MonitoredServiceTemplateCanvas'

export class MonitoredServiceTemplate extends Template<NGTemplateInfoConfig> {
  protected type = TemplateType.MonitoredService
  protected name = 'Monitored Service Template'
  protected color = Color.TEAL_700

  protected defaultValues: NGTemplateInfoConfig = {
    name: 'Template name',
    identifier: 'Template_name',
    versionLabel: '',
    type: 'MonitoredService'
  }

  renderTemplateCanvas(props: TemplateProps<NGTemplateInfoConfig>): JSX.Element {
    const { formikRef } = props
    return <MonitoredTemplateCanvasWithRef ref={formikRef as any} />
  }

  renderTemplateInputsForm(props: TemplateInputsProps & { accountId: string }): JSX.Element {
    const { template, accountId } = props
    const { identifier = '', orgIdentifier = '', projectIdentifier = '', versionLabel = '' } = template
    const templateData = {
      accountId,
      identifier,
      orgIdentifier,
      projectIdentifier,
      versionLabel
    }
    return <MonitoredServiceInputSetsTemplate templateData={templateData} />
  }
}
