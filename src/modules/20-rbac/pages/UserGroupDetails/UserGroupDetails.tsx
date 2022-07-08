/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { Text, Layout, Button, Card, Container, ButtonVariation, PageError, Icon } from '@wings-software/uicore'
import { Color, FontVariation } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import ReactTimeago from 'react-timeago'
import cx from 'classnames'
import { useStrings } from 'framework/strings'
import { useGetUserGroupAggregate, UserGroupAggregateDTO } from 'services/cd-ng'
import { Page } from '@common/exports'
import routes from '@common/RouteDefinitions'
import TagsRenderer from '@common/components/TagsRenderer/TagsRenderer'
import { NGBreadcrumbs } from '@common/components/NGBreadcrumbs/NGBreadcrumbs'
import { PageSpinner } from '@common/components'
import RoleBindingsList from '@rbac/components/RoleBindingsList/RoleBindingsList'
import type { PipelineType, ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import { useRoleAssignmentModal } from '@rbac/modals/RoleAssignmentModal/useRoleAssignmentModal'
import { useQueryParams } from '@common/hooks'
import type { PrincipalScope } from '@common/interfaces/SecretsInterface'
import { getPrincipalScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import {
  getUserGroupActionTooltipText,
  PrincipalType,
  isUserGroupInherited,
  getUserGroupMenuOptionText,
  getUserGroupQueryParams
} from '@rbac/utils/utils'
import { useDocumentTitle } from '@common/hooks/useDocumentTitle'
import { useUserGroupModal } from '@rbac/modals/UserGroupModal/useUserGroupModal'
import { useLinkToSSOProviderModal } from '@rbac/modals/LinkToSSOProviderModal/useLinkToSSOProviderModal'
import MemberList from '@rbac/pages/UserGroupDetails/views/MemberList'
import { ResourceType } from '@rbac/interfaces/ResourceType'
import ManagePrincipalButton from '@rbac/components/ManagePrincipalButton/ManagePrincipalButton'
import NotificationList from '@rbac/components/NotificationList/NotificationList'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGetCommunity } from '@common/utils/utils'
import UserGroupRefScopeList from '@rbac/components/UserGroupRefScopeList/UserGroupRefScopeList'
import css from './UserGroupDetails.module.scss'

const UserGroupDetails: React.FC = () => {
  const { getString } = useStrings()
  const { accountId, orgIdentifier, projectIdentifier, module, userGroupIdentifier } =
    useParams<PipelineType<ProjectPathProps & { userGroupIdentifier: string }>>()
  const { parentScope } = useQueryParams<{ parentScope: PrincipalScope }>()
  const isCommunity = useGetCommunity()
  const history = useHistory()

  const { data, loading, error, refetch } = useGetUserGroupAggregate({
    identifier: userGroupIdentifier,
    queryParams: {
      ...getUserGroupQueryParams(accountId, orgIdentifier, projectIdentifier, parentScope),
      roleAssignmentScopeOrgIdentifier: orgIdentifier,
      roleAssignmentScopeProjectIdentifier: projectIdentifier
    }
  })

  const { openRoleAssignmentModal } = useRoleAssignmentModal({
    onSuccess: refetch
  })

  const { openUserGroupModal } = useUserGroupModal({
    onSuccess: refetch
  })

  const { openLinkToSSOProviderModal } = useLinkToSSOProviderModal({
    onSuccess: refetch
  })

  const { getRBACErrorMessage } = useRBACError()

  const userGroupAggregateResponse: UserGroupAggregateDTO | undefined = data?.data
  const userGroup = userGroupAggregateResponse?.userGroupDTO
  const { INHERITED_USER_GROUP } = useFeatureFlags()

  useDocumentTitle([userGroup?.name || '', getString('common.userGroups')])

  const userGroupInherited = isUserGroupInherited(accountId, orgIdentifier, projectIdentifier, userGroup)

  if (loading) return <PageSpinner />
  if (error) return <PageError message={getRBACErrorMessage(error)} onClick={() => refetch()} />
  if (!userGroup) return <></>
  const membersBtnTooltipText = getUserGroupActionTooltipText(
    accountId,
    orgIdentifier,
    projectIdentifier,
    userGroup,
    userGroupInherited
  )
  const membersBtnTooltipTextFormatted = membersBtnTooltipText ? (
    <Text padding="medium">{membersBtnTooltipText}</Text>
  ) : undefined
  const ssoBtnTooltip = getUserGroupMenuOptionText(
    getString('edit'),
    getString('rbac.group'),
    userGroup,
    userGroupInherited
  )
  const ssoBtnTooltipText = ssoBtnTooltip ? <Text padding="medium">{ssoBtnTooltip}</Text> : undefined
  const shouldRenderScopeList = !userGroupInherited && INHERITED_USER_GROUP
  return (
    <>
      <Page.Header
        size="xlarge"
        breadcrumbs={
          <NGBreadcrumbs
            links={[
              {
                url: routes.toUserGroups({ accountId, orgIdentifier, projectIdentifier, module }),
                label: `${getString('accessControl')}: ${getString('common.userGroups')}`
              }
            ]}
          />
        }
        title={
          <Layout.Vertical spacing="xsmall">
            <Text color={Color.BLACK} font="medium">
              {userGroup.name}
            </Text>
            {userGroup.description && <Text>{userGroup.description}</Text>}
            {userGroup.tags && (
              <Layout.Horizontal padding={{ top: 'small' }}>
                <TagsRenderer tags={userGroup.tags || /* istanbul ignore next */ {}} length={6} />
              </Layout.Horizontal>
            )}
          </Layout.Vertical>
        }
        toolbar={
          <Layout.Horizontal flex>
            {userGroupAggregateResponse?.lastModifiedAt && (
              <Layout.Vertical spacing="xsmall" padding={{ left: 'small' }}>
                <Text>{getString('lastUpdated')}</Text>
                <ReactTimeago date={userGroupAggregateResponse?.lastModifiedAt} />
              </Layout.Vertical>
            )}
          </Layout.Horizontal>
        }
      />
      {userGroupInherited ? (
        <Card className={cx(css.banner)}>
          <Layout.Horizontal flex>
            <Layout.Horizontal flex={{ alignItems: 'baseline' }} spacing="medium">
              <Text color={Color.BLACK}>
                <Icon size={20} name={'info-messaging'} />
                &nbsp;&nbsp;
                {membersBtnTooltipText}
              </Text>
            </Layout.Horizontal>
            <Layout.Horizontal>
              <Button
                text={getString('rbac.linkToOriginalUserGroup')}
                iconProps={{ color: Color.BLUE_500, size: 20 }}
                icon="link"
                variation={ButtonVariation.LINK}
                onClick={() => {
                  history.push({
                    pathname: routes.toUserGroupDetails({
                      accountId,
                      orgIdentifier: userGroup.orgIdentifier,
                      projectIdentifier: userGroup.projectIdentifier,
                      userGroupIdentifier: userGroup.identifier
                    }),
                    search: `?parentScope=${getPrincipalScopeFromDTO(userGroup)}`
                  })
                }}
              />
            </Layout.Horizontal>
          </Layout.Horizontal>
        </Card>
      ) : null}

      <Page.Body className={css.body}>
        <Container width="50%" padding={{ bottom: 'large' }} className={css.membersContainer}>
          <Layout.Horizontal flex>
            <Layout.Horizontal flex={{ alignItems: 'baseline' }} spacing="medium">
              <Text font={{ variation: FontVariation.H5 }} color={Color.BLACK}>
                {getString('members')}
              </Text>
              {userGroup.ssoLinked ? (
                <Layout.Horizontal className={css.truncatedText} flex={{ alignItems: 'center' }} spacing="xsmall">
                  <Text icon={'link'} iconProps={{ color: Color.BLUE_500, size: 10 }} color={Color.BLACK}>
                    {getString('rbac.userDetails.linkToSSOProviderModal.saml')}
                  </Text>
                  <Text lineClamp={1} width={70}>
                    {userGroup.linkedSsoDisplayName}
                  </Text>
                  <Text color={Color.BLACK}>{getString('rbac.userDetails.linkToSSOProviderModal.group')}</Text>
                  <Text lineClamp={1} width={70}>
                    {userGroup.ssoGroupName}
                  </Text>
                </Layout.Horizontal>
              ) : null}
            </Layout.Horizontal>
            <Layout.Horizontal className={cx({ [css.buttonPadding]: userGroup.ssoLinked })}>
              <ManagePrincipalButton
                disabled={userGroup.externallyManaged || userGroupInherited}
                text={
                  userGroup.ssoLinked
                    ? getString('rbac.userDetails.linkToSSOProviderModal.delinkLabel')
                    : getString('rbac.userDetails.linkToSSOProviderModal.linkLabel')
                }
                icon={userGroup.ssoLinked ? 'cross' : 'link'}
                variation={ButtonVariation.LINK}
                onClick={() => {
                  openLinkToSSOProviderModal(userGroup)
                }}
                tooltip={ssoBtnTooltipText}
                resourceType={ResourceType.USERGROUP}
                resourceIdentifier={userGroupIdentifier}
              />
              <ManagePrincipalButton
                disabled={userGroup.ssoLinked || userGroup.externallyManaged || userGroupInherited}
                tooltip={membersBtnTooltipTextFormatted}
                text={getString('common.plusNumber', { number: getString('members') })}
                variation={ButtonVariation.LINK}
                onClick={() => {
                  openUserGroupModal(userGroup, true)
                }}
                resourceType={ResourceType.USERGROUP}
                resourceIdentifier={userGroupIdentifier}
              />
            </Layout.Horizontal>
          </Layout.Horizontal>
          <MemberList ssoLinked={userGroup.ssoLinked} userGroupInherited={userGroupInherited} />
        </Container>
        <Container width="50%" className={css.detailsContainer}>
          {!isCommunity && (
            <Layout.Vertical spacing="medium" padding={{ bottom: 'large' }}>
              <Text font={{ variation: FontVariation.H5 }} color={Color.BLACK}>
                {getString('rbac.roleBinding')}
              </Text>
              <Card className={css.card}>
                <RoleBindingsList data={userGroupAggregateResponse?.roleAssignmentsMetadataDTO} showNoData={true} />
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
                    openRoleAssignmentModal(PrincipalType.USER_GROUP, userGroup, data?.data?.roleAssignmentsMetadataDTO)
                  }}
                  resourceType={ResourceType.USERGROUP}
                  resourceIdentifier={userGroupIdentifier}
                  resourceScope={{ accountIdentifier: accountId, orgIdentifier, projectIdentifier }}
                />
              </Layout.Horizontal>
            </Layout.Vertical>
          )}
          <Layout.Vertical spacing="medium">
            <Text font={{ variation: FontVariation.H5 }} color={Color.BLACK}>
              {getString('common.notificationPreferences')}
            </Text>
            <NotificationList
              userGroup={userGroup}
              inherited={userGroupInherited}
              inheritedCreateDisabledText={membersBtnTooltipTextFormatted}
              onSubmit={refetch}
            />
          </Layout.Vertical>
          {shouldRenderScopeList && (
            <Layout.Vertical spacing="large" border={{ top: true }}>
              <Text font={{ variation: FontVariation.H5 }} color={Color.BLACK} padding={{ top: 'large' }}>
                {orgIdentifier
                  ? getString('rbac.inheritedScope.orgScopeTitle')
                  : getString('rbac.inheritedScope.accountScopeTitle')}
              </Text>
              <UserGroupRefScopeList {...{ userGroupIdentifier, parentScope }} />
            </Layout.Vertical>
          )}
        </Container>
      </Page.Body>
    </>
  )
}

export default UserGroupDetails
