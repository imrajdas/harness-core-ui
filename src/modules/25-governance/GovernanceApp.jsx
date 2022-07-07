/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React, { Suspense, lazy } from 'react'
import { useHistory, useRouteMatch } from 'react-router-dom'
import { Container } from '@wings-software/uicore'
import { useSaveToGitDialog } from '@common/modals/SaveToGitDialog/useSaveToGitDialog'
import GitFilters from '@common/components/GitFilters/GitFilters'
import routes from '@common/RouteDefinitions'
import { returnUrlParams } from '@common/utils/routeUtils'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import AppErrorBoundary from 'framework/utils/AppErrorBoundary/AppErrorBoundary'
import { useStrings } from 'framework/strings'
import { GitSyncStoreProvider, useGitSyncStore } from 'framework/GitRepoStore/GitSyncStoreContext'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import RbacButton from '@rbac/components/Button/Button'
import RbacOptionsMenuButton from '@rbac/components/RbacOptionsMenuButton/RbacOptionsMenuButton'
import { usePermission } from '@rbac/hooks/usePermission'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useGetSchemaYaml } from 'services/pipeline-ng'
import { useGetListOfBranchesWithStatus } from 'services/cd-ng'
import SessionToken from 'framework/utils/SessionToken'
import { global401HandlerUtils } from '@common/utils/global401HandlerUtils'
import { useAnyEnterpriseLicense, useCurrentEnterpriseLicense } from '@common/hooks/useModuleLicenses'
import { useLicenseStore } from 'framework/LicenseStore/LicenseStoreContext'
import { OverviewChartsWithToggle } from '@common/components/OverviewChartsWithToggle/OverviewChartsWithToggle'

// Due to some typing complexity, governance/App is lazily imported
// from a .js file for now
const RemoteGovernanceApp = lazy(() => import('governance/App'))

export const RemoteEvaluationModal = lazy(() => import('governance/EvaluationModal'))
export const RemotePipelineGovernanceView = lazy(() => import('governance/PipelineGovernanceView'))
export const RemoteEvaluationView = lazy(() => import('governance/EvaluationView'))
export const RemotePolicySetWizard = lazy(() => import('governance/PolicySetWizard'))

export const GovernanceRemoteComponentMounter = props => {
  const { spinner, component } = props
  const { getString } = useStrings()
  const { path, params } = useRouteMatch()
  const history = useHistory()
  const { getToken: useGetToken } = SessionToken

  return (
    <Suspense fallback={spinner || <Container padding="large">{getString('loading')}</Container>}>
      <AppErrorBoundary>
        <RemoteGovernanceApp
          baseRoutePath={path}
          accountId={params.accountId}
          on401={() => {
            global401HandlerUtils(history)
          }}
          hooks={{
            usePermission,
            useGetSchemaYaml,
            useFeatureFlags,
            useAppStore,
            useGitSyncStore,
            useSaveToGitDialog,
            useGetListOfBranchesWithStatus,
            useGetToken,
            useAnyEnterpriseLicense,
            useCurrentEnterpriseLicense,
            useLicenseStore
          }}
          components={{
            NGBreadcrumbs,
            RbacButton,
            RbacOptionsMenuButton,
            GitFilters,
            GitSyncStoreProvider,
            OverviewChartsWithToggle
          }}
        >
          {component}
        </RemoteGovernanceApp>
      </AppErrorBoundary>
    </Suspense>
  )
}
