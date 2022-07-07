/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import {
  Formik,
  FormikForm as Form,
  FormInput,
  Button,
  Text,
  Layout,
  StepProps,
  Container,
  SelectOption,
  TextInput,
  MultiSelectOption,
  Icon,
  ModalErrorHandlerBinding,
  ModalErrorHandler,
  ButtonVariation,
  Label,
  DropDown,
  Heading
} from '@wings-software/uicore'
import cx from 'classnames'
import * as Yup from 'yup'
import { FontVariation, Color } from '@harness/design-system'
import { useHistory, useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { Project, useGetInvites, Organization, useAddUsers, AddUsers, useGetUsers } from 'services/cd-ng'
import { useStrings } from 'framework/strings'
import { useGetRoleList } from 'services/rbac'
import type { AccountPathProps } from '@common/interfaces/RouteInterfaces'
import { useToaster } from '@common/exports'
import { CopyText } from '@common/components/CopyText/CopyText'
import routes from '@common/RouteDefinitions'
import { InvitationStatus, handleInvitationResponse, isAccountBasicRole } from '@rbac/utils/utils'
import { getDefaultRole, getDetailsUrl } from '@projects-orgs/utils/utils'
import { useGetCommunity } from '@common/utils/utils'
import { useMutateAsGet } from '@common/hooks'
import UserItemRenderer from '@audit-trail/components/UserItemRenderer/UserItemRenderer'
import UserTagRenderer from '@audit-trail/components/UserTagRenderer/UserTagRenderer'
import { useTelemetry } from '@common/hooks/useTelemetry'
import { Category, ProjectActions } from '@common/constants/TrackingConstants'
import InviteListRenderer from './InviteListRenderer'
import css from './Steps.module.scss'

interface CollaboratorModalData {
  projectIdentifier?: string
  orgIdentifier?: string
  showManage?: boolean
  defaultRole?: SelectOption
}

interface RoleOption extends SelectOption {
  managed: boolean
}
interface CollaboratorsData {
  collaborators: MultiSelectOption[]
}

const Collaborators: React.FC<CollaboratorModalData> = props => {
  const { projectIdentifier, orgIdentifier, showManage = true } = props
  const { accountId } = useParams<AccountPathProps>()
  const { getString } = useStrings()
  const isCommunity = useGetCommunity()
  const { showSuccess } = useToaster()
  const history = useHistory()
  const [search, setSearch] = useState<string>()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const initialValues: CollaboratorsData = { collaborators: [] }
  const { data: userData } = useMutateAsGet(useGetUsers, {
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier },
    body: {
      searchTerm: search,
      parentFilter: 'STRICTLY_PARENT_SCOPES'
    },
    debounce: 300
  })

  const {
    data: inviteData,
    loading: inviteLoading,
    refetch: reloadInvites
  } = useGetInvites({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const { mutate: sendInvite, loading } = useAddUsers({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    }
  })

  const { data: roleData, refetch: fetchRoleData } = useGetRoleList({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier,
      projectIdentifier
    },
    lazy: true
  })

  useEffect(() => {
    if (!isCommunity) {
      fetchRoleData()
    }
  }, [])

  const users: SelectOption[] = defaultTo(
    userData?.data?.content?.map(user => {
      return {
        label: defaultTo(user.name, user.email),
        value: user.email
      }
    }),
    []
  )

  const [role, setRole] = useState<RoleOption>(
    getDefaultRole({ accountIdentifier: accountId, orgIdentifier, projectIdentifier }, getString)
  )

  const roles: RoleOption[] = defaultTo(
    roleData?.data?.content?.reduce((acc: RoleOption[], response) => {
      if (!isAccountBasicRole(response.role.identifier)) {
        acc.push({
          label: response.role.name,
          value: response.role.identifier,
          managed: defaultTo(response.harnessManaged, false)
        })
      }
      return acc
    }, []),
    []
  )

  const SendInvitation = async (values: MultiSelectOption[]): Promise<void> => {
    const usersToSubmit = values?.map(collaborator => {
      return collaborator.value.toString()
    })

    const dataToSubmit: AddUsers = {
      emails: usersToSubmit,
      roleBindings: isCommunity
        ? []
        : [
            {
              roleIdentifier: role.value.toString(),
              roleName: role.label,
              managedRole: role.managed
            }
          ]
    }

    try {
      const response = await sendInvite(dataToSubmit)
      handleInvitationResponse({
        responseType: Object.values(defaultTo(response.data?.addUserResponseMap, {}))?.[0] as InvitationStatus,
        getString,
        showSuccess,
        modalErrorHandler,
        onSubmit: reloadInvites
      })
    } catch (e) {
      modalErrorHandler?.showDanger(defaultTo(e.data?.message, e.message))
    }
  }

  return (
    <Formik<CollaboratorsData>
      initialValues={initialValues}
      validationSchema={Yup.object().shape({
        collaborators: Yup.array().of(
          Yup.object().shape({
            value: Yup.string().email().required()
          })
        )
      })}
      formName="collaboratorsForm"
      onSubmit={(values, { resetForm }) => {
        modalErrorHandler?.hide()
        SendInvitation(values.collaborators)
        setRole(getDefaultRole({ accountIdentifier: accountId, orgIdentifier, projectIdentifier }, getString))
        resetForm({ values: { collaborators: [] } })
      }}
      enableReinitialize={true}
    >
      {formik => {
        return (
          <Form>
            <ModalErrorHandler bind={setModalErrorHandler} />
            <Container className={css.collaboratorForm}>
              <Heading level={3} font={{ variation: FontVariation.H3 }} padding={{ bottom: 'xxlarge' }}>
                {getString('projectsOrgs.invite')}
              </Heading>
              <Label>
                {projectIdentifier
                  ? getString('projectsOrgs.urlMessageProject')
                  : getString('projectsOrgs.urlMessageOrg')}
              </Label>
              <TextInput
                placeholder={getDetailsUrl({ accountId, orgIdentifier, projectIdentifier })}
                disabled
                rightElement={
                  (
                    <CopyText
                      className={css.copy}
                      iconName="duplicate"
                      textToCopy={getDetailsUrl({ accountId, orgIdentifier, projectIdentifier })}
                      iconAlwaysVisible
                    />
                  ) as any
                }
              />
              <Layout.Horizontal padding={{ top: 'medium' }} className={cx(css.align, css.input)} flex>
                <Layout.Horizontal width="50%">
                  <Label>{getString('projectsOrgs.inviteCollab')}</Label>
                </Layout.Horizontal>
                {!isCommunity && (
                  <Layout.Horizontal
                    width="50%"
                    flex={{ alignItems: 'center', justifyContent: 'flex-end' }}
                    padding={{ right: 'medium' }}
                  >
                    <Label>
                      <Layout.Horizontal flex spacing="xsmall">
                        {getString('projectsOrgs.roleLabel')}
                        <DropDown
                          items={roles}
                          value={role.value.toString()}
                          onChange={item => {
                            setRole(item as RoleOption)
                          }}
                          isLabel={true}
                          filterable={false}
                          width={160}
                        />
                      </Layout.Horizontal>
                    </Label>
                  </Layout.Horizontal>
                )}
              </Layout.Horizontal>
              <Layout.Horizontal spacing="small">
                <FormInput.MultiSelect
                  name={getString('projectsOrgs.collaborator')}
                  items={users}
                  multiSelectProps={{
                    allowCreatingNewItems: true,
                    onQueryChange: (query: string) => {
                      setSearch(query)
                    },
                    tagRenderer: (item: MultiSelectOption) => (
                      <UserTagRenderer key={item.value.toString()} item={item} />
                    ),
                    itemRender: (item, { handleClick }) => (
                      <UserItemRenderer key={item.value.toString()} item={item} handleClick={handleClick} />
                    )
                  }}
                  className={css.input}
                />
                <Button
                  text={getString('add')}
                  variation={ButtonVariation.PRIMARY}
                  inline
                  disabled={role.value === 'none' || formik.values.collaborators.length === 0 ? true : false}
                  type="submit"
                  loading={loading}
                />
              </Layout.Horizontal>
              {inviteData?.data?.content?.length ? (
                <Layout.Vertical padding={{ top: 'medium', bottom: 'xxxlarge' }}>
                  <Text padding={{ bottom: 'small' }}>
                    {getString('projectsOrgs.pendingUsers', { name: inviteData?.data?.content?.length.toString() })}
                  </Text>
                  <Container className={css.pendingList}>
                    {inviteData?.data?.content.slice(0, 15).map(user => (
                      <InviteListRenderer
                        key={user.name}
                        user={user}
                        reload={reloadInvites}
                        roles={roles}
                        isCommunity={isCommunity}
                      />
                    ))}
                  </Container>
                </Layout.Vertical>
              ) : inviteLoading ? (
                <Layout.Vertical padding={{ top: 'xxxlarge', bottom: 'xxxlarge' }}>
                  <Icon name="steps-spinner" size={32} color={Color.GREY_600} flex={{ align: 'center-center' }} />
                </Layout.Vertical>
              ) : null}
            </Container>

            {showManage ? (
              <Layout.Horizontal>
                <Button
                  variation={ButtonVariation.LINK}
                  text={
                    projectIdentifier ? getString('projectsOrgs.manageProject') : getString('projectsOrgs.manageOrg')
                  }
                  onClick={() => {
                    history.push(routes.toUsers({ accountId, orgIdentifier, projectIdentifier }))
                  }}
                  className={css.manageUsers}
                />
              </Layout.Horizontal>
            ) : null}
          </Form>
        )
      }}
    </Formik>
  )
}

export const ProjectCollaboratorsStep: React.FC<StepProps<Project> & CollaboratorModalData> = ({
  prevStepData,
  previousStep,
  nextStep,
  ...rest
}) => {
  const { getString } = useStrings()

  const { trackEvent } = useTelemetry()

  useEffect(() => {
    trackEvent(ProjectActions.LoadInviteCollaborators, {
      category: Category.PROJECT
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Layout.Vertical padding="xxxlarge">
      <Collaborators
        projectIdentifier={prevStepData?.identifier}
        orgIdentifier={prevStepData?.orgIdentifier}
        showManage={false}
        {...rest}
      />
      <Layout.Horizontal spacing="small">
        <Button
          variation={ButtonVariation.SECONDARY}
          onClick={() => {
            trackEvent(ProjectActions.ClickBackToProject, {
              category: Category.PROJECT
            })
            previousStep?.(prevStepData)
          }}
          text={getString('back')}
        />
        <Button
          variation={ButtonVariation.PRIMARY}
          text={getString('saveAndContinue')}
          onClick={() => {
            trackEvent(ProjectActions.SaveInviteCollaborators, {
              category: Category.PROJECT
            })
            /* istanbul ignore else */ if (prevStepData) {
              nextStep?.({ ...prevStepData })
            }
          }}
        />
      </Layout.Horizontal>
    </Layout.Vertical>
  )
}

export const OrgCollaboratorsStep: React.FC<StepProps<Organization> & CollaboratorModalData> = ({
  prevStepData,
  previousStep,
  nextStep,
  ...rest
}) => {
  const { getString } = useStrings()
  return (
    <Layout.Vertical padding="xxxlarge">
      <Collaborators orgIdentifier={prevStepData?.identifier} showManage={false} {...rest} />
      {prevStepData ? (
        <Layout.Horizontal spacing="small">
          <Button onClick={() => previousStep?.(prevStepData)} text={getString('back')} />
          <Button
            variation={ButtonVariation.PRIMARY}
            text={getString('finish')}
            onClick={() => {
              /* istanbul ignore else */ if (prevStepData) {
                nextStep?.({ ...prevStepData })
              }
            }}
          />
        </Layout.Horizontal>
      ) : (
        <Layout.Horizontal>
          <Button inline minimal disabled tooltip={getString('projectsOrgs.notAvailableForBeta')}>
            {getString('projectsOrgs.manageProject')}
          </Button>
        </Layout.Horizontal>
      )}
    </Layout.Vertical>
  )
}

export default Collaborators
