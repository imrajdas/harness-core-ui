/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import type React from 'react'
import type ReactMonacoEditor from 'react-monaco-editor'
import type { MonacoDiffEditor } from 'react-monaco-editor'
import type { PermissionsContextProps } from 'framework/rbac/PermissionsContext'
import type { LicenseStoreContextProps } from 'framework/LicenseStore/LicenseStoreContext'
import type { AppStoreContextProps } from 'framework/AppStore/AppStoreContext'
import type { NGBreadcrumbsProps } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PermissionIdentifier } from '@rbac/interfaces/PermissionIdentifier'
import type { ButtonProps } from '@rbac/components/Button/Button'
import type { RbacMenuItemProps } from '@rbac/components/MenuItem/MenuItem'
import type { Title, UseDocumentTitleReturn } from '@common/hooks/useDocumentTitle'
import type { ExtendedMonacoEditorProps } from '@common/components/MonacoEditor/MonacoEditor'
import type { ExtendedMonacoDiffEditorProps } from '@common/components/MonacoDiffEditor/MonacoDiffEditor'
import type { YamlBuilderProps } from '@common/interfaces/YAMLBuilderProps'
import type { GitOpsCustomMicroFrontendProps } from '@cd/interfaces/GitOps.types'
import type { STOAppCustomProps } from '@pipeline/interfaces/STOApp'

export interface Scope {
  accountId?: string
  orgIdentifier?: string
  projectIdentifier?: string
}

export interface CommonComponents {
  NGBreadcrumbs: React.ComponentType<Partial<NGBreadcrumbsProps>>
  RbacButton: React.ComponentType<ButtonProps>
  RbacMenuItem: React.ComponentType<RbacMenuItemProps>
  MonacoEditor: React.ForwardRefExoticComponent<ExtendedMonacoEditorProps & React.RefAttributes<ReactMonacoEditor>>
  YAMLBuilder: React.FC<YamlBuilderProps>
  MonacoDiffEditor: React.ForwardRefExoticComponent<
    ExtendedMonacoDiffEditorProps & React.RefAttributes<MonacoDiffEditor>
  >
}

export interface Hooks {
  useDocumentTitle(title: Title, accountLevel?: boolean): UseDocumentTitleReturn
}

/**
 * Parent contexts which consists of all the context used in the parent app
 */
export interface ParentContext {
  appStoreContext: React.Context<AppStoreContextProps>
  permissionsContext: React.Context<PermissionsContextProps>
  licenseStoreProvider: React.Context<LicenseStoreContextProps>
}

export interface ChildAppProps {
  parentContextObj: ParentContext
  renderUrl: string
  matchPath: string
  scope: Scope
  components: CommonComponents
  hooks: Hooks
  on401: () => void
  children?: React.ReactNode
}

/**
 * function to render child app inside the parent
 */
export type ChildAppComponent = React.ComponentType<ChildAppProps>

export {
  AppStoreContextProps,
  LicenseStoreContextProps,
  PermissionsContextProps,
  ResourceType,
  PermissionIdentifier,
  GitOpsCustomMicroFrontendProps,
  STOAppCustomProps
}
