/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useEffect, useState } from 'react'
import type { FormikProps } from 'formik'
import {
  Button,
  Formik,
  FormikForm as Form,
  Layout,
  ModalErrorHandlerBinding,
  SelectOption,
  FormInput,
  ModalErrorHandler,
  ButtonVariation,
  MultiSelectOption
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { useToaster } from '@common/components'
import { usePostRoleAssignments, RoleAssignment as RBACRoleAssignment } from 'services/rbac'
import { useStrings } from 'framework/strings'
import { UserMetadataDTO, RoleAssignmentMetadataDTO, useGetUsers, useAddUsers, AddUsers } from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  handleInvitationResponse,
  getScopeBasedDefaultAssignment,
  InvitationStatus,
  isNewRoleAssignment,
  isAccountBasicRole,
  isAccountBasicRolePresent
} from '@rbac/utils/utils'
import { getIdentifierFromValue, getScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import { useMutateAsGet } from '@common/hooks/useMutateAsGet'
import { Scope } from '@common/interfaces/SecretsInterface'
import UserGroupsInput from '@common/components/UserGroupsInput/UserGroupsInput'
import { useGetCommunity } from '@common/utils/utils'
import UserItemRenderer from '@audit-trail/components/UserItemRenderer/UserItemRenderer'
import UserTagRenderer from '@audit-trail/components/UserTagRenderer/UserTagRenderer'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import type { RoleAssignmentValues } from './RoleAssignment'
import RoleAssignmentForm from './RoleAssignmentForm'

interface UserRoleAssignmentData {
  roleBindings?: RoleAssignmentMetadataDTO[]
  user?: UserMetadataDTO
  onSubmit?: () => void
  onSuccess?: () => void
  onUserAdded?: () => void
  onCancel?: () => void
  isInvite?: boolean
}

interface FormData {
  title: string
  handleSubmit: (values: UserRoleAssignmentValues) => Promise<void>
  label: string
  userGroupField?: React.ReactElement
}

export interface RoleOption extends SelectOption {
  managed: boolean
  managedRoleAssignment: boolean
  assignmentIdentifier?: string
}

export interface ResourceGroupOption extends SelectOption {
  managedRoleAssignment: boolean
  assignmentIdentifier?: string
}

export interface Assignment {
  role: RoleOption
  resourceGroup: ResourceGroupOption
}

export interface UserRoleAssignmentValues {
  users: MultiSelectOption[]
  assignments: Assignment[]
  userGroups?: string[]
}

const UserRoleAssignment: React.FC<UserRoleAssignmentData> = props => {
  const { user, roleBindings, onSubmit, isInvite, onSuccess, onUserAdded, onCancel } = props
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const scope = getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
  const { getString } = useStrings()
  const { ACCOUNT_BASIC_ROLE, ACCOUNT_BASIC_ROLE_ONLY } = useFeatureFlags()
  const isCommunity = useGetCommunity()
  const [query, setQuery] = useState<string>()
  const { showSuccess } = useToaster()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const { mutate: createRoleAssignment, loading: saving } = usePostRoleAssignments({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })

  const { mutate: sendInvitation, loading: sending } = useAddUsers({
    queryParams: {
      accountIdentifier: accountId,
      orgIdentifier: orgIdentifier,
      projectIdentifier: projectIdentifier
    }
  })

  const { data: userList, refetch: refetchUsers } = useMutateAsGet(useGetUsers, {
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier },
    body: {
      searchTerm: query,
      parentFilter: 'STRICTLY_PARENT_SCOPES'
    },
    debounce: 300,
    lazy: true
  })

  useEffect(() => {
    if (scope !== Scope.ACCOUNT && isInvite) {
      refetchUsers()
    }
  }, [isInvite, scope])

  const users: SelectOption[] = defaultTo(
    userList?.data?.content?.map(response => {
      return {
        label: defaultTo(response.name, response.email),
        value: response.email
      }
    }),
    []
  )

  const assignments: Assignment[] = defaultTo(
    roleBindings?.reduce((acc: Assignment[], roleAssignment) => {
      if (!isAccountBasicRole(roleAssignment.roleIdentifier)) {
        acc.push({
          role: {
            label: roleAssignment.roleName,
            value: roleAssignment.roleIdentifier,
            managed: roleAssignment.managedRole,
            managedRoleAssignment: roleAssignment.managedRoleAssignment,
            assignmentIdentifier: roleAssignment.identifier
          },
          resourceGroup: {
            label: defaultTo(roleAssignment.resourceGroupName, ''),
            value: defaultTo(roleAssignment.resourceGroupIdentifier, ''),
            managedRoleAssignment: roleAssignment.managedRoleAssignment,
            assignmentIdentifier: roleAssignment.identifier
          }
        })
      }
      return acc
    }, []),
    getScopeBasedDefaultAssignment(
      scope,
      getString,
      isCommunity,
      isAccountBasicRolePresent(scope, !!ACCOUNT_BASIC_ROLE),
      !!ACCOUNT_BASIC_ROLE_ONLY
    )
  )

  const handleRoleAssignment = async (values: UserRoleAssignmentValues): Promise<void> => {
    const dataToSubmit: RBACRoleAssignment[] = values.assignments
      .filter(value => isNewRoleAssignment(value))
      .map(value => {
        return {
          resourceGroupIdentifier: value.resourceGroup.value.toString(),
          roleIdentifier: value.role.value.toString(),
          principal: { identifier: defaultTo(user?.uuid, values.users?.[0].value.toString()), type: 'USER' }
        }
      })

    try {
      await createRoleAssignment({ roleAssignments: dataToSubmit })
      showSuccess(getString('rbac.usersPage.roleAssignSuccess'))
      onSubmit?.()
    } catch (err) {
      /* istanbul ignore next */
      modalErrorHandler?.showDanger(defaultTo(err?.data?.message, err?.message))
    }
  }

  const handleInvitation = async (values: UserRoleAssignmentValues): Promise<void> => {
    const dataToSubmit: AddUsers = {
      emails: values.users?.map(val => val.value.toString()),
      userGroups: values.userGroups?.map(val => getIdentifierFromValue(val)),
      roleBindings: values.assignments.map(value => {
        return {
          resourceGroupIdentifier: value.resourceGroup.value.toString(),
          roleIdentifier: value.role.value.toString(),
          roleName: value.role.label,
          resourceGroupName: value.resourceGroup.label,
          managedRole: value.role.managed
        }
      })
    }

    try {
      const response = await sendInvitation(dataToSubmit)
      //TODO: @reetika Extend this to support multiple failures.
      handleInvitationResponse({
        responseType: Object.values(defaultTo(response.data?.addUserResponseMap, {}))?.[0] as InvitationStatus,
        getString,
        showSuccess,
        modalErrorHandler,
        onSubmit,
        onUserAdded
      })
    } catch (err) {
      /* istanbul ignore next */
      modalErrorHandler?.showDanger(defaultTo(err?.data?.message, err?.message))
    }
  }

  const inviteValues: FormData = {
    title: getString('rbac.usersPage.userForm.title'),
    handleSubmit: handleInvitation,
    label: getString('rbac.usersPage.userForm.userLabel'),
    userGroupField: (
      <UserGroupsInput
        name="userGroups"
        label={getString('rbac.usersPage.userForm.userGroupLabel')}
        onlyCurrentScope={true}
      />
    )
  }
  const addRoleValues: FormData = {
    title: getString('rbac.addRole'),
    handleSubmit: handleRoleAssignment,
    label: getString('rbac.forUser')
  }
  const formValues = isInvite ? inviteValues : addRoleValues

  return (
    <Formik<UserRoleAssignmentValues>
      initialValues={{
        users: user ? [{ label: defaultTo(user.name, user.email), value: user.email }] : [],
        assignments: assignments
      }}
      formName="userRoleAssignementForm"
      validationSchema={Yup.object().shape({
        users: Yup.array().min(1, getString('rbac.userRequired')).max(15, getString('rbac.userUpperLimit')),
        ...(isCommunity
          ? {}
          : {
              assignments: Yup.array().of(
                Yup.object().shape({
                  role: Yup.object().nullable().required(),
                  resourceGroup: Yup.object().nullable().required()
                })
              )
            })
      })}
      onSubmit={values => {
        modalErrorHandler?.hide()
        formValues.handleSubmit(values)
      }}
    >
      {formik => {
        return (
          <Form>
            <ModalErrorHandler bind={setModalErrorHandler} />
            <FormInput.MultiSelect
              name="users"
              label={formValues.label}
              items={users}
              tagInputProps={{
                values: users,
                placeholder: getString('rbac.roleAssignment.userPlaceHolder')
              }}
              multiSelectProps={{
                allowCreatingNewItems: true,
                onQueryChange: val => {
                  setQuery(val)
                  refetchUsers()
                },
                tagRenderer: (item: MultiSelectOption) => <UserTagRenderer key={item.value.toString()} item={item} />,
                itemRender: (item, { handleClick }) => (
                  <UserItemRenderer key={item.value.toString()} item={item} handleClick={handleClick} />
                )
              }}
              disabled={!isInvite}
            />
            {formValues.userGroupField}
            {!isCommunity && (
              <RoleAssignmentForm
                noRoleAssignmentsText={getString('rbac.usersPage.noDataText')}
                formik={formik as FormikProps<UserRoleAssignmentValues | RoleAssignmentValues>}
                onSuccess={onSuccess}
              />
            )}
            <Layout.Horizontal spacing="small" padding={{ top: 'large' }}>
              <Button
                variation={ButtonVariation.PRIMARY}
                text={getString('common.apply')}
                type="submit"
                disabled={saving || sending}
              />
              <Button text={getString('cancel')} variation={ButtonVariation.TERTIARY} onClick={onCancel} />
            </Layout.Horizontal>
          </Form>
        )
      }}
    </Formik>
  )
}

export default UserRoleAssignment
