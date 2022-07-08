/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { useParams, useHistory, useRouteMatch } from 'react-router-dom'
import { Layout } from '@wings-software/uicore'
import { compile } from 'path-to-regexp'

import routes from '@common/RouteDefinitions'
import { ProjectSelector } from '@projects-orgs/components/ProjectSelector/ProjectSelector'
import type { PipelinePathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import { useStrings } from 'framework/strings'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import { ModuleName } from 'framework/types/ModuleName'
import ProjectSetupMenu from '@common/navigation/ProjectSetupMenu/ProjectSetupMenu'

export default function CVSideNav(): React.ReactElement {
  const { accountId, projectIdentifier, orgIdentifier, pipelineIdentifier } = useParams<PipelinePathProps>()
  const routeMatch = useRouteMatch()
  const { getString } = useStrings()
  const history = useHistory()
  const { updateAppStore } = useAppStore()

  return (
    <Layout.Vertical spacing="small">
      <ProjectSelector
        moduleFilter={ModuleName.CV}
        onSelect={data => {
          updateAppStore({ selectedProject: data })
          // if a user is on a pipeline related page, redirect them to project dashboard
          if (projectIdentifier && !pipelineIdentifier) {
            // changing project
            history.push(
              compile(routeMatch.path)({
                ...routeMatch.params,
                projectIdentifier: data.identifier,
                orgIdentifier: data.orgIdentifier
              })
            )
          } else {
            history.push(
              routes.toCVSLOs({
                projectIdentifier: data.identifier,
                orgIdentifier: data.orgIdentifier || '',
                accountId
              })
            )
          }
        }}
      />
      {projectIdentifier && orgIdentifier ? (
        <React.Fragment>
          <SidebarLink
            label={getString('cv.slos.title')}
            to={routes.toCVSLOs({ accountId, projectIdentifier, orgIdentifier })}
          />
          <SidebarLink
            label={getString('cv.monitoredServices.title')}
            to={routes.toCVMonitoringServices({ accountId, projectIdentifier, orgIdentifier })}
          />
          <SidebarLink
            label={getString('changes')}
            to={routes.toCVChanges({ accountId, projectIdentifier, orgIdentifier })}
          />
          <ProjectSetupMenu module="cv" />
        </React.Fragment>
      ) : null}
    </Layout.Vertical>
  )
}
