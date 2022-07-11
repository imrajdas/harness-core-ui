/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Layout } from '@wings-software/uicore'
import routes from '@common/RouteDefinitions'
import type { ModulePathParams, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import { ProjectSelector } from '@projects-orgs/components/ProjectSelector/ProjectSelector'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { useStrings } from 'framework/strings'
import ProjectSetupMenu from '@common/navigation/ProjectSetupMenu/ProjectSetupMenu'

export default function STOSideNav(): React.ReactElement {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { updateAppStore } = useAppStore()
  const history = useHistory()

  const showLinks = projectIdentifier && orgIdentifier
  const params: ProjectPathProps & ModulePathParams & { accountId: string } = {
    accountId,
    projectIdentifier,
    orgIdentifier,
    module: 'sto'
  }

  return (
    <Layout.Vertical spacing="small">
      <ProjectSelector
        onSelect={selectedProject => {
          updateAppStore({ selectedProject: selectedProject })
          history.push(
            routes.toSTOProjectOverview({
              accountId,
              projectIdentifier: selectedProject.identifier,
              orgIdentifier: selectedProject.orgIdentifier || /* istanbul ignore next */ ''
            })
          )
        }}
      />
      {showLinks && (
        <React.Fragment>
          <>
            <SidebarLink label={getString('overview')} to={routes.toSTOProjectOverview(params)} />
            <SidebarLink label={getString('common.purpose.sto.continuous')} to={routes.toDeployments(params)} />
            <SidebarLink label={getString('pipelines')} to={routes.toPipelines(params)} />
            <SidebarLink label={getString('stoSteps.targets.testTargets')} to={routes.toSTOProjectTargets(params)} />
            <SidebarLink label={getString('stoSteps.securityReview')} to={routes.toSTOProjectSecurityReview(params)} />
            <ProjectSetupMenu module="sto" />
          </>
        </React.Fragment>
      )}
    </Layout.Vertical>
  )
}
