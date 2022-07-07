/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Free Trial 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/05/PolyForm-Free-Trial-1.0.0.txt.
 */

import React, { useState } from 'react'
import {
  Button,
  Formik,
  FormikForm as Form,
  Layout,
  ModalErrorHandlerBinding,
  ModalErrorHandler,
  ButtonVariation
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import type { FormikProps } from 'formik'
import { useToaster } from '@common/components'
import { usePostRoleAssignments, RoleAssignment as RBACRoleAssignment } from 'services/rbac'
import { useStrings } from 'framework/strings'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import {
  getScopeBasedDefaultAssignment,
  isAccountBasicRolePresent,
  isNewRoleAssignment,
  PrincipalType
} from '@rbac/utils/utils'
import {
  getIdentifierFromValue,
  getScopeFromDTO,
  getPrincipalScopeFromValue
} from '@common/components/EntityReference/EntityReference'
import UserGroupsInput from '@common/components/UserGroupsInput/UserGroupsInput'
import { useGetCommunity } from '@common/utils/utils'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useFeatureFlags } from '@common/hooks/useFeatureFlag'
import RoleAssignmentForm from './RoleAssignmentForm'
import type { RoleAssignmentValues } from './RoleAssignment'
import type { Assignment, UserRoleAssignmentValues } from './UserRoleAssigment'

interface UserGroupRoleAssignmentData {
  onSubmit?: () => void
  onRoleAssignmentSuccess?: () => void
  onCancel?: () => void
}
export interface UserGroupRoleAssignmentValues {
  assignments: Assignment[]
  userGroups: string[]
}

interface FormData {
  title: string
  handleSubmit: (values: UserGroupRoleAssignmentValues) => Promise<void>
  label: string
  userGroupField?: React.ReactElement
}
const AssignRoles: React.FC<UserGroupRoleAssignmentData> = props => {
  const { onSubmit, onRoleAssignmentSuccess, onCancel } = props
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const scope = getScopeFromDTO({ accountIdentifier: accountId, orgIdentifier, projectIdentifier })
  const { getString } = useStrings()
  const { ACCOUNT_BASIC_ROLE, ACCOUNT_BASIC_ROLE_ONLY } = useFeatureFlags()
  const { getRBACErrorMessage } = useRBACError()
  const isCommunity = useGetCommunity()
  const { showSuccess } = useToaster()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const { mutate: createRoleAssignment, loading: saving } = usePostRoleAssignments({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })

  const assignments: Assignment[] = getScopeBasedDefaultAssignment(
    scope,
    getString,
    isCommunity,
    isAccountBasicRolePresent(scope, !!ACCOUNT_BASIC_ROLE),
    !!ACCOUNT_BASIC_ROLE_ONLY
  )

  const handleRoleAssignment = async (values: UserGroupRoleAssignmentValues): Promise<void> => {
    /* istanbul ignore next */ if (values.assignments.length === 0) {
      modalErrorHandler?.showDanger(getString('rbac.UserGroupRoleAssignmentForm.assignmentValidation'))
      return
    }
    const dataToSubmit: RBACRoleAssignment[] = []
    values.assignments
      .filter(value => isNewRoleAssignment(value))
      .forEach(value => {
        values.userGroups.forEach(usergroup => {
          dataToSubmit.push({
            resourceGroupIdentifier: value.resourceGroup.value.toString(),
            roleIdentifier: value.role.value.toString(),
            principal: {
              identifier: getIdentifierFromValue(usergroup),
              type: PrincipalType.USER_GROUP,
              scopeLevel: getPrincipalScopeFromValue(usergroup)
            }
          })
        })
      })
    try {
      await createRoleAssignment({ roleAssignments: dataToSubmit })
      showSuccess(getString('rbac.userGroupPage.roleAssignSuccess'))
      onSubmit?.()
    } catch (err) {
      /* istanbul ignore next */
      modalErrorHandler?.showDanger(getRBACErrorMessage(err))
    }
  }

  const formValues: FormData = {
    title: getString('rbac.userGroupPage.assignRoles'),
    handleSubmit: handleRoleAssignment,
    label: getString('rbac.userGroupPage.assignRoles'),
    userGroupField: (
      <UserGroupsInput
        name="userGroups"
        label={getString('rbac.usersPage.userForm.userGroupLabel')}
        onlyCurrentScope={false}
      />
    )
  }

  return (
    <Formik<UserGroupRoleAssignmentValues>
      initialValues={{
        assignments: assignments,
        userGroups: []
      }}
      formName="UserGroupRoleAssignmentForm"
      validationSchema={Yup.object().shape({
        userGroups: Yup.array().min(1, getString('rbac.userGroupRequired')),
        .../* istanbul ignore next */ (isCommunity
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
        /* istanbul ignore next */ modalErrorHandler?.hide()
        formValues.handleSubmit(values)
      }}
    >
      {formik => {
        return (
          <Form>
            <ModalErrorHandler bind={setModalErrorHandler} />
            {formValues.userGroupField}
            {!isCommunity && (
              <RoleAssignmentForm
                noRoleAssignmentsText={getString('rbac.usersPage.noDataText')}
                formik={
                  formik as FormikProps<UserGroupRoleAssignmentValues | UserRoleAssignmentValues | RoleAssignmentValues>
                }
                onSuccess={onRoleAssignmentSuccess}
              />
            )}
            <Layout.Horizontal spacing="small" padding={{ top: 'large' }}>
              <Button
                variation={ButtonVariation.PRIMARY}
                text={getString('common.apply')}
                type="submit"
                disabled={saving}
              />
              <Button text={getString('cancel')} variation={ButtonVariation.TERTIARY} onClick={onCancel} />
            </Layout.Horizontal>
          </Form>
        )
      }}
    </Formik>
  )
}

export default AssignRoles
