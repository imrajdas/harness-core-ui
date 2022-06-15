import React from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Layout } from '@harness/uicore'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { SidebarLink } from '@common/navigation/SideNav/SideNav'
import routes from '@common/RouteDefinitions'
import { ProjectSelector } from '@projects-orgs/components/ProjectSelector/ProjectSelector'
import { useAppStore } from 'framework/AppStore/AppStoreContext'
import ProjectSetupMenu from '@common/navigation/ProjectSetupMenu/ProjectSetupMenu'

// ChaosSideNav: Renders sidenav for chaos module
export default function ChaosSideNav(): React.ReactElement {
  const params = useParams<ProjectPathProps>()
  const { accountId, projectIdentifier, orgIdentifier } = params

  const { updateAppStore } = useAppStore()
  const history = useHistory()

  return (
    <Layout.Vertical spacing="small">
      <ProjectSelector
        onSelect={data => {
          updateAppStore({ selectedProject: data })
          history.push(
            routes.toProjectOverview({
              projectIdentifier: data.identifier,
              orgIdentifier: data.orgIdentifier || /* istanbul ignore next */ '',
              accountId,
              module: 'chaos'
            })
          )
        }}
      />
      {projectIdentifier && orgIdentifier ? (
        <>
          <SidebarLink label="Overview" to={routes.toProjectOverview({ ...params, module: 'chaos' })} />
          <SidebarLink label="Scenarios" to={routes.toChaosScenarios({ ...params })} />
          <SidebarLink label="Workflows" to={routes.toChaosWorkflows({ ...params })} />
          <SidebarLink label="ChaosHubs" to={routes.toChaosHubs({ ...params })} />
          <SidebarLink label="ChaosAgents" to={routes.toChaosAgents({ ...params })} />
          <ProjectSetupMenu module="chaos" />
        </>
      ) : null}
    </Layout.Vertical>
  )
}
