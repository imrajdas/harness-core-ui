/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { Color } from '@harness/design-system'
import type { IconName, MaybeElement } from '@blueprintjs/core'
import { Icon } from '@harness/uicore'
import React from 'react'
import { defaultTo } from 'lodash-es'
import { Scope } from '@common/interfaces/SecretsInterface'
import type { FileStoreNodeDTO } from 'services/cd-ng'
import type { Item as NodeMenuOptionItem } from '@filestore/common/NodeMenu/NodeMenuButton'
import type { FileStorePopoverItem } from '@filestore/common/FileStorePopover/FileStorePopover'
import type { ScopedObjectDTO } from '@filestore/common/useFileStoreScope/useFileStoreScope'
import { FileStoreNodeTypes, FileUsage } from '@filestore/interfaces/FileStore'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { ExtensionType, LanguageType, FSErrosType, FileStoreActionTypes } from './constants'

export const firstLetterToUpperCase = (value: string): string => `${value.charAt(0).toUpperCase()}${value.slice(1)}`

export const getFileUsageNameByType = (type: FileUsage): string => {
  switch (type) {
    case FileUsage.MANIFEST_FILE:
      return 'Manifest'
    case FileUsage.CONFIG:
      return 'Config'
    case FileUsage.SCRIPT:
      return 'Script'
    default:
      return ''
  }
}

export const getMimeTypeByName = (name: string): string => {
  const splitedFileName = name.split('.')
  if (splitedFileName.length <= 1) {
    return ExtensionType.TEXT
  }
  return splitedFileName[splitedFileName.length - 1].trim()
}

export const getLanguageType = (lang: string | undefined): string => {
  switch (lang) {
    case ExtensionType.YAML:
    case ExtensionType.YML:
      return LanguageType.YAML
    case LanguageType.JSON:
      return ExtensionType.JSON
    case ExtensionType.BASH:
      return LanguageType.BASH
    case ExtensionType.POWER_SHELL:
      return LanguageType.POWER_SHELL
    case ExtensionType.TEXT:
      return LanguageType.TEXT
    default:
      return LanguageType.TEXT
  }
}

export const checkSupportedMime = (mime: ExtensionType): boolean => {
  return Object.values(ExtensionType).includes(mime)
}

export const getFSErrorByType = (type: FSErrosType): string => {
  switch (type) {
    case FSErrosType.UNSUPPORTED_FORMAT:
      return 'filestore.errors.cannotRender'
    case FSErrosType.FILE_USAGE:
      return 'filestore.errors.fileUsage'
    default:
      return ''
  }
}

export const existCachedNode = (
  tempNodes: FileStoreNodeDTO[],
  nodeIdentifier: string
): FileStoreNodeDTO | undefined => {
  return tempNodes.find((tempNode: FileStoreNodeDTO): boolean => tempNode.identifier === nodeIdentifier)
}

export type FileStorePopoverOptionItem = FileStorePopoverItem | '-'

export const getIconByActionType = (actionType: FileStoreActionTypes): IconName | MaybeElement => {
  const iconDefaults = {
    size: 16,
    padding: { right: 'small' },
    color: Color.GREY_700
  }

  switch (actionType) {
    case FileStoreActionTypes.UPDATE_NODE:
      return <Icon name="edit" {...iconDefaults} />
    case FileStoreActionTypes.UPLOAD_NODE:
      return 'upload'
    case FileStoreActionTypes.CREATE_NODE:
      return 'folder-new'
    case FileStoreActionTypes.DELETE_NODE:
      return <Icon name="main-trash" {...iconDefaults} />
    default:
      return null
  }
}

export const getPermissionsByActionType = (actionType: FileStoreActionTypes, identifier?: string) => {
  if (actionType === FileStoreActionTypes.DELETE_NODE) {
    return {
      permission: PermissionIdentifier.DELETE_FILE,
      resource: {
        resourceType: ResourceType.FILE,
        resourceIdentifier: defaultTo(identifier, '')
      }
    }
  } else {
    return {
      permission: PermissionIdentifier.EDIT_FILE,
      resource: {
        resourceType: ResourceType.FILE,
        resourceIdentifier: defaultTo(identifier, '')
      }
    }
  }
}

export const getMenuOptionItems = (
  optionItems: FileStorePopoverOptionItem[],
  type?: FileStoreNodeTypes
): NodeMenuOptionItem[] => {
  const { DELETE_NODE, CREATE_NODE, UPDATE_NODE, UPLOAD_NODE } = FileStoreActionTypes
  const ACTIONS =
    type === FileStoreNodeTypes.FOLDER
      ? [DELETE_NODE, CREATE_NODE, UPDATE_NODE, UPLOAD_NODE, '-']
      : [DELETE_NODE, UPDATE_NODE]
  const FILTERED_ACTIONS = optionItems.filter((optionItem: FileStorePopoverOptionItem): boolean => {
    if (optionItem === '-') {
      return true
    }
    return ACTIONS.includes(optionItem.actionType)
  })

  return FILTERED_ACTIONS.map((optionItem: FileStorePopoverOptionItem) => {
    if (optionItem === '-') {
      return optionItem
    }
    return {
      actionType: optionItem.actionType,
      text: optionItem.label,
      onClick: optionItem.onClick,
      identifier: optionItem.identifier
    }
  })
}

interface ScopedObjectDTOParam {
  accountId: string
  orgIdentifier?: string
  projectIdentifier?: string
}

export const getParamsByScope = (scope: string, params: ScopedObjectDTOParam): ScopedObjectDTO => {
  const { accountId, orgIdentifier, projectIdentifier } = params

  switch (scope) {
    case Scope.ACCOUNT:
      return {
        accountIdentifier: accountId
      }
    case Scope.ORG:
      return {
        accountIdentifier: accountId,
        orgIdentifier
      }
    default:
      return {
        accountIdentifier: accountId,
        orgIdentifier,
        projectIdentifier
      }
  }
}
