/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type { IconName } from '@wings-software/uicore'
import { get } from 'lodash-es'
import type { UseStringsReturn } from 'framework/strings'
import { TemplateType } from '@templates-library/utils/templatesUtils'
import type { TemplateSummaryResponse } from 'services/template-ng'
import factory from '@pipeline/components/PipelineSteps/PipelineStepFactory'
import { stagesCollection } from '@pipeline/components/PipelineStudio/Stages/StagesCollection'
import type { NGTemplateInfoConfigWithGitDetails } from 'framework/Templates/TemplateConfigModal/TemplateConfigModal'

export const templateColorStyleMap: { [keyof in TemplateType]: React.CSSProperties } = {
  [TemplateType.Step]: {
    color: '#592BAA',
    stroke: '#E1D0FF',
    fill: '#EADEFF'
  },
  [TemplateType.Stage]: {
    color: '#06B7C3',
    stroke: '#C0FBFE',
    fill: '#D3FCFE'
  },
  [TemplateType.Pipeline]: {
    color: '#004BA4',
    stroke: '#CCCBFF',
    fill: '#E8E8FF'
  },
  [TemplateType.Service]: {
    color: '#299B2C',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.StepGroup]: {
    color: '#299B2C',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.Execution]: {
    color: '#299B2C',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.Infrastructure]: {
    color: '#299B2C',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.MonitoredService]: {
    color: '#06B7C3',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.Script]: {
    color: '#CDF4FE',
    stroke: '#A3E9FF',
    fill: '#CDF4FE'
  }
}

export const templateStudioColorStyleMap: { [keyof in TemplateType]: React.CSSProperties } = {
  [TemplateType.Step]: {
    color: '#EADEFF',
    stroke: '#6938C0',
    fill: '#7D4DD3'
  },
  [TemplateType.Stage]: {
    color: '#E8E8FF',
    stroke: '#03C0CD',
    fill: '#0BC8D6'
  },
  [TemplateType.Service]: {
    color: '#299B2C',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.Pipeline]: {
    color: '#E8E8FF',
    stroke: '#5452F6',
    fill: '#6563F0'
  },
  [TemplateType.StepGroup]: {
    color: '#299B2C',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.Execution]: {
    color: '#299B2C',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.Infrastructure]: {
    color: '#299B2C',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.MonitoredService]: {
    color: '#06B7C3',
    stroke: '#D4E7D1',
    fill: '#E4F7E1'
  },
  [TemplateType.Script]: {
    color: '#CDF4FE',
    stroke: '#A3E9FF',
    fill: '#CDF4FE'
  }
}

export enum Sort {
  DESC = 'DESC',
  ASC = 'ASC'
}

export enum TemplateListType {
  Stable = 'Stable',
  LastUpdated = 'LastUpdated',
  All = 'All'
}

export enum SortFields {
  LastUpdatedAt = 'lastUpdatedAt',
  RecentActivity = 'executionSummaryInfo.lastExecutionTs',
  AZ09 = 'AZ09',
  ZA90 = 'ZA90',
  Name = 'name'
}

export const getTypeForTemplate = (
  getString: UseStringsReturn['getString'],
  template?: NGTemplateInfoConfigWithGitDetails | TemplateSummaryResponse
): string | undefined => {
  const templateTye =
    (template as TemplateSummaryResponse)?.templateEntityType || (template as NGTemplateInfoConfigWithGitDetails)?.type
  const childType =
    (template as TemplateSummaryResponse)?.childType || get(template as NGTemplateInfoConfigWithGitDetails, 'spec.type')
  switch (templateTye) {
    case TemplateType.Step:
      return factory.getStepName(childType)
    case TemplateType.Stage:
      return stagesCollection.getStageAttributes(childType, getString)?.name
    default:
      return undefined
  }
}

export const getIconForTemplate = (
  getString: UseStringsReturn['getString'],
  template?: NGTemplateInfoConfigWithGitDetails | TemplateSummaryResponse
): IconName | undefined => {
  const templateTye =
    (template as TemplateSummaryResponse)?.templateEntityType || (template as NGTemplateInfoConfigWithGitDetails)?.type
  if (templateTye === TemplateType.Script) {
    return 'script'
  } else if (templateTye === TemplateType.Pipeline) {
    return 'pipeline'
  } else {
    const childType =
      (template as TemplateSummaryResponse)?.childType ||
      get(template as NGTemplateInfoConfigWithGitDetails, 'spec.type')
    if (childType) {
      switch (templateTye) {
        case TemplateType.Step:
          return factory.getStepIcon(childType)
        case TemplateType.Stage:
          return stagesCollection.getStageAttributes(childType, getString)?.icon
        default:
          return undefined
      }
    } else {
      return undefined
    }
  }
}
