/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Layout, Card, Avatar, Icon, ButtonVariation, PageError } from '@wings-software/uicore'
import { Color } from '@harness/design-system'
import { useParams } from 'react-router-dom'
import { useStrings } from 'framework/strings'
import { useGetAggregatedUser } from 'services/cd-ng'
import { Page } from '@common/exports'
import routes from '@common/RouteDefinitions'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { PageSpinner } from '@common/components'
import RoleBindingsList from '@rbac/components/RoleBindingsList/RoleBindingsList'
import type { PipelineType, ProjectPathProps, UserPathProps } from '@common/interfaces/RouteInterfaces'
import { useRoleAssignmentModal } from '@rbac/modals/RoleAssignmentModal/useRoleAssignmentModal'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import { PrincipalType } from '@rbac/utils/utils'
import ManagePrincipalButton from '@rbac/components/ManagePrincipalButton/ManagePrincipalButton'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGetCommunity } from '@common/utils/utils'
import UserGroupTable from './views/UserGroupTable'
import css from './UserDetails.module.scss'

const UserDetails: React.FC = () => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier, module, userIdentifier } =
    useParams<PipelineType<ProjectPathProps & UserPathProps>>()
  const isCommunity = useGetCommunity()

  const { data, loading, error, refetch } = useGetAggregatedUser({
    userId: userIdentifier,
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const { openRoleAssignmentModal } = useRoleAssignmentModal({
    onSuccess: refetch
  })

  const { getRBACErrorMessage } = useRBACError()

  const user = data?.data?.user

  useDocumentTitle([user?.name || '', getString('users')])

  if (loading) {
    return <PageSpinner />
  }
  if (error) {
    return <PageError message={getRBACErrorMessage(error)} onClick={() => refetch()} />
  }
  if (!data?.data || !user) {
    return <></>
  }
  return (
    <>
      <Page.Header
        size="xlarge"
        className={css.header}
        breadcrumbs={
          <NGBreadcrumbs
            links={[
              {
                url: routes.toUsers({ accountId, orgIdentifier, projectIdentifier, module }),
                label: `${getString('accessControl')}: ${getString('users')}`
              }
            ]}
          />
        }
        title={
          <Layout.Horizontal flex={{ alignItems: 'center', justifyContent: 'flex-start' }} spacing="medium">
            {user.locked ? (
              <Icon
                name="lock"
                border
                className={css.lockIcon}
                width={72}
                height={72}
                size={32}
                color={Color.WHITE}
                background={Color.GREY_300}
                flex={{ align: 'center-center' }}
                margin={{ left: 'xsmall', right: 'xsmall' }}
              />
            ) : (
              <Avatar name={user.name || user.email} email={user.email} size="large" hoverCard={false} />
            )}

            <Layout.Vertical padding={{ left: 'medium' }} spacing="xsmall">
              <Layout.Horizontal flex={{ alignItems: 'baseline' }} spacing="xsmall">
                <Text color={Color.BLACK} font="medium">
                  {user.name}
                </Text>
                {user.locked ? <Text color={Color.GREY_400}>{getString('rbac.usersPage.lockedOutLabel')}</Text> : null}
              </Layout.Horizontal>
              <Text>{user.email}</Text>
            </Layout.Vertical>
          </Layout.Horizontal>
        }
      />
      <Page.Body className={css.body}>
        <Layout.Vertical width="100%" padding="large">
          {!isCommunity && (
            <Layout.Vertical spacing="medium" padding={{ bottom: 'large' }}>
              <Text color={Color.BLACK} font={{ size: 'medium', weight: 'semi-bold' }}>
                {getString('rbac.roleBinding')}
              </Text>
              <Card className={css.card}>
                <RoleBindingsList data={data?.data?.roleAssignmentMetadata} showNoData={true} />
              </Card>
              <Layout.Horizontal
                flex={{ alignItems: 'center', justifyContent: 'flex-start' }}
                padding={{ top: 'medium' }}
              >
                <ManagePrincipalButton
                  data-testid={'addRole-UserGroup'}
                  text={getString('common.plusNumber', { number: getString('common.role') })}
                  variation={ButtonVariation.LINK}
                  onClick={event => {
                    event.stopPropagation()
                    openRoleAssignmentModal(PrincipalType.USER, user, data?.data?.roleAssignmentMetadata)
                  }}
                  resourceIdentifier={user.uuid}
                  resourceType={ResourceType.USER}
                />
              </Layout.Horizontal>
            </Layout.Vertical>
          )}
          <UserGroupTable user={data.data} />
        </Layout.Vertical>
      </Page.Body>
    </>
  )
}

export default UserDetails
