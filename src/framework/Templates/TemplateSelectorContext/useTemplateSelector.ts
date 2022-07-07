/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import type { TemplateSummaryResponse } from 'services/template-ng'
import { TemplateSelectorContext } from 'framework/Templates/TemplateSelectorContext/TemplateSelectorContext'
import type { TemplateType } from '@common/interfaces/RouteInterfaces'

export interface GetTemplateResponse {
  template: TemplateSummaryResponse
  isCopied: boolean
}

export interface GetTemplateProps {
  templateType: TemplateType
  allChildTypes?: string[]
  selectedTemplate?: TemplateSummaryResponse
}

interface TemplateActionsReturnType {
  getTemplate: (data: GetTemplateProps) => Promise<GetTemplateResponse>
}

export function useTemplateSelector(): TemplateActionsReturnType {
  const { openTemplateSelector, closeTemplateSelector } = React.useContext(TemplateSelectorContext)

  const getTemplate = React.useCallback(
    (selectorData: GetTemplateProps): Promise<GetTemplateResponse> => {
      return new Promise((resolve, reject) => {
        openTemplateSelector({
          ...selectorData,
          onSubmit: (template: TemplateSummaryResponse, isCopied: boolean) => {
            closeTemplateSelector()
            resolve({ template, isCopied })
          },
          onCancel: () => {
            closeTemplateSelector()
            reject()
          }
        })
      })
    },
    [openTemplateSelector, closeTemplateSelector]
  )

  return { getTemplate }
}
