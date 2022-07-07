/*
 * Copyright 2021 Harness Inc. All rights reserved.
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
  FormInput,
  ModalErrorHandler,
  ButtonVariation
} from '@wings-software/uicore'
import * as Yup from 'yup'
import { useParams } from 'react-router-dom'
import { defaultTo } from 'lodash-es'
import { useToaster } from '@common/components'
import { usePostRoleAssignments, RoleAssignment as RBACRoleAssignment } from 'services/rbac'
import { useStrings } from 'framework/strings'
import type { RoleAssignmentMetadataDTO, ServiceAccountDTO, UserGroupDTO } from 'services/cd-ng'
import type { ProjectPathProps } from '@common/interfaces/RouteInterfaces'
import { getAssignments, isNewRoleAssignment, isUserGroupInherited, PrincipalType } from '@rbac/utils/utils'
import useRBACError from '@rbac/utils/useRBACError/useRBACError'
import { useGetCommunity } from '@common/utils/utils'
import { getPrincipalScopeFromDTO } from '@common/components/EntityReference/EntityReference'
import RoleAssignmentForm from './RoleAssignmentForm'
import type { Assignment } from './UserRoleAssigment'

interface RoleAssignmentData {
  principalInfo: UserGroupDTO | ServiceAccountDTO
  type: PrincipalType
  roleBindings?: RoleAssignmentMetadataDTO[]
  onSubmit?: () => void
  onCancel?: () => void
  onSuccess?: () => void
}

export interface RoleAssignmentValues {
  name?: string
  assignments: Assignment[]
}

const RoleAssignment: React.FC<RoleAssignmentData> = ({
  principalInfo,
  roleBindings,
  onSubmit,
  onSuccess,
  onCancel,
  type
}) => {
  const { accountId, orgIdentifier, projectIdentifier } = useParams<ProjectPathProps>()
  const { getRBACErrorMessage } = useRBACError()
  const [modalErrorHandler, setModalErrorHandler] = useState<ModalErrorHandlerBinding>()
  const { getString } = useStrings()
  const isCommunity = useGetCommunity()
  const { showSuccess } = useToaster()
  const assignments: Assignment[] = getAssignments(defaultTo(roleBindings, []))

  const { mutate: createRoleAssignment, loading: saving } = usePostRoleAssignments({
    queryParams: { accountIdentifier: accountId, orgIdentifier, projectIdentifier }
  })

  const handleRoleAssignment = async (values: RoleAssignmentValues): Promise<void> => {
    const dataToSubmit: RBACRoleAssignment[] = values.assignments
      .filter(value => isNewRoleAssignment(value))
      .map(value => {
        return {
          resourceGroupIdentifier: value.resourceGroup.value.toString(),
          roleIdentifier: value.role.value.toString(),
          principal: {
            identifier: principalInfo.identifier,
            type,
            scopeLevel:
              type === PrincipalType.USER_GROUP &&
              isUserGroupInherited(accountId, orgIdentifier, projectIdentifier, principalInfo)
                ? getPrincipalScopeFromDTO(principalInfo)
                : undefined
          }
        }
      })

    try {
      await createRoleAssignment({ roleAssignments: dataToSubmit })
      showSuccess(getString('rbac.usersPage.roleAssignSuccess'))
      onSubmit?.()
    } catch (e) {
      /* istanbul ignore next */
      modalErrorHandler?.showDanger(getRBACErrorMessage(e))
    }
  }

  return (
    <Formik<RoleAssignmentValues>
      initialValues={{
        name: principalInfo.name,
        assignments: assignments
      }}
      formName={`${type}RoleAssignmentForm`}
      validationSchema={Yup.object().shape({
        assignments: Yup.array().of(
          Yup.object().shape({
            role: Yup.object().nullable().required(),
            resourceGroup: Yup.object().nullable().required()
          })
        )
      })}
      onSubmit={values => {
        modalErrorHandler?.hide()
        handleRoleAssignment(values)
      }}
    >
      {formik => {
        return (
          <Form>
            <ModalErrorHandler bind={setModalErrorHandler} />
            <FormInput.Text
              name="name"
              disabled={true}
              label={type === PrincipalType.USER_GROUP ? getString('common.userGroup') : getString('serviceAccount')}
            />
            {!isCommunity && (
              <RoleAssignmentForm
                noRoleAssignmentsText={
                  type === PrincipalType.USER_GROUP
                    ? getString('rbac.userGroupPage.noRoleAssignmentsText')
                    : getString('rbac.serviceAccounts.form.noDataText')
                }
                formik={formik}
                onSuccess={onSuccess}
              />
            )}

            <Layout.Horizontal spacing="small">
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

export default RoleAssignment
