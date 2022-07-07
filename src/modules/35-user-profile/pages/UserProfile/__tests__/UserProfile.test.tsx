/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import {
  RenderResult,
  render,
  fireEvent,
  waitFor,
  queryByText,
  act,
  queryByAttribute,
  getAllByText
} from '@testing-library/react'
import UserProfilePage from '@user-profile/pages/UserProfile/UserProfilePage'
import { TestWrapper, findDialogContainer } from '@common/utils/testUtils'
import { defaultAppStoreValues, communityLicenseStoreValues } from '@common/utils/DefaultAppStoreData'
import { InputTypes, setFieldValue, clickSubmit } from '@common/utils/JestFormHelper'
import * as cdngServices from 'services/cd-ng'
import type { ResponseBoolean } from 'services/cd-ng'
import { ChangePasswordResponse } from '@user-profile/modals/useChangePassword/views/ChangePasswordForm'
import {
  connectorMockData,
  enabledTwoFactorAuth,
  mockResponse,
  mockSecretList,
  sourceCodeManagers,
  emptySourceCodeManagers,
  twoFactorAuthSettings,
  userMockData,
  mockMyProfiles,
  passwordStrengthPolicy
} from './mock'

const createSCM = jest.fn()

const enableAuthfn = jest.fn()
const enableAuthMock = (): ResponseBoolean => {
  enableAuthfn()
  return mockResponse
}

const disableAuthfn = jest.fn()
const disableAuthMock = (): ResponseBoolean => {
  disableAuthfn()
  return mockResponse
}

jest.mock('services/cd-ng', () => ({
  useGetCurrentUserInfo: jest.fn().mockImplementation(() => {
    return { data: userMockData, refetch: jest.fn() }
  }),
  useSaveSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { mutate: createSCM }
  }),
  useDeleteSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { mutate: () => Promise.resolve(mockResponse) }
  }),
  useUpdateSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { mutate: () => Promise.resolve(mockResponse) }
  }),
  useUpdateUserInfo: jest.fn().mockImplementation(() => {
    return { mutate: () => Promise.resolve(mockResponse) }
  }),
  useGetSourceCodeManagers: jest.fn().mockImplementation(() => {
    return { data: emptySourceCodeManagers, refetch: jest.fn() }
  }),
  useGetConnectorList: jest.fn().mockImplementation(() => {
    return { ...connectorMockData, refetch: jest.fn(), error: null, loading: false }
  }),
  useGetTwoFactorAuthSettings: jest.fn().mockImplementation(() => {
    return { data: twoFactorAuthSettings, refetch: jest.fn() }
  }),
  useEnableTwoFactorAuth: jest.fn().mockImplementation(() => {
    return { mutate: enableAuthMock }
  }),
  useDisableTwoFactorAuth: jest.fn().mockImplementation(() => {
    return { mutate: disableAuthMock }
  }),
  listSecretsV2Promise: jest.fn().mockImplementation(() => Promise.resolve(mockSecretList)),
  useGetSecretV2: jest.fn().mockImplementation(() => {
    return { data: mockSecretList, refetch: jest.fn() }
  }),
  useGetConnector: jest.fn().mockImplementation(() => {
    return { data: {}, refetch: jest.fn() }
  }),
  usePostSecret: jest.fn().mockImplementation(() => ({ mutate: () => Promise.resolve(mockResponse) })),
  usePutSecret: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePostSecretFileV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  usePutSecretFileV2: jest.fn().mockImplementation(() => ({ mutate: jest.fn() })),
  useGetAuthenticationSettings: jest.fn().mockImplementation(() => {
    return { data: passwordStrengthPolicy }
  }),
  useGetUserProjectInfo: jest.fn().mockImplementation(() => {
    return { data: mockMyProfiles }
  }),
  useChangeUserPassword: jest.fn().mockImplementation(() => {
    return {
      mutate: () =>
        Promise.resolve({
          data: ChangePasswordResponse.PASSWORD_CHANGED
        })
    }
  }),
  useResendVerifyEmail: jest.fn().mockImplementation(() => {
    return {
      cancel: jest.fn(),
      loading: false,
      mutate: jest.fn().mockImplementation(() => {
        return {
          status: 'SUCCESS'
        }
      })
    }
  }),
  useListAggregatedApiKeys: jest.fn().mockImplementation(() => {
    return { data: {}, refetch: jest.fn(), error: null, loading: false }
  }),
  useListAggregatedTokens: jest.fn().mockImplementation(() => {
    return { data: {}, refetch: jest.fn(), error: null, loading: false }
  })
}))

let enabledAuth = false

beforeEach(() => {
  window.deploymentType = 'SAAS'
})

describe('User Profile Page', () => {
  let container: HTMLElement
  let getByText: RenderResult['getByText']
  let getByTestId: RenderResult['getByTestId']

  const testSetup = (isCommunity?: boolean): void => {
    const renderObj = render(
      <TestWrapper
        path="/account/:accountId/projects"
        pathParams={{ accountId: 'testAcc' }}
        defaultAppStoreValues={enabledAuth ? enabledTwoFactorAuth : defaultAppStoreValues}
        defaultLicenseStoreValues={isCommunity ? communityLicenseStoreValues : {}}
      >
        <UserProfilePage />
      </TestWrapper>
    )
    container = renderObj.container
    getByTestId = renderObj.getByTestId
    getByText = renderObj.getByText
  }

  test('User Profile', () => {
    testSetup()
    expect(container).toMatchSnapshot()
  }),
    test('Edit User Profile', async () => {
      testSetup()
      const edit = getByTestId('editUserProfile')
      act(() => {
        fireEvent.click(edit!)
      })
      await waitFor(() => queryByText(document.body, 'Edit Profile'))
      const form = findDialogContainer()
      expect(form).toBeTruthy()
      setFieldValue({ container: form!, type: InputTypes.TEXTFIELD, fieldId: 'name', value: 'dummy name' })

      await act(async () => {
        clickSubmit(form!)
      })

      expect(queryByText(document.body, 'userProfile.userEditSuccess')).toBeTruthy()
    }),
    test('Add SCM', async () => {
      testSetup()
      const addSCM = getByText('userProfile.plusSCM')
      expect(addSCM).toBeTruthy()
      act(() => {
        fireEvent.click(addSCM!)
      })
      await waitFor(() => queryByText(document.body, 'userProfile.addSCM'))
      const form = findDialogContainer()
      expect(form).toBeTruthy()
    }),
    // Only github SCM is supported ATM
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip('Add BitBucket SCM', async () => {
      const addSCM = getByText('userProfile.plusSCM')
      expect(addSCM).toBeTruthy()
      act(() => {
        fireEvent.click(addSCM!)
      })
      await waitFor(() => queryByText(document.body, 'userProfile.addSCM'))
      const form = findDialogContainer()
      expect(form).toBeTruthy()

      setFieldValue({ container: form!, type: InputTypes.TEXTFIELD, fieldId: 'name', value: 'dummy name' })

      const bitBucket = queryByAttribute('data-icon', form!, 'bitbucket-blue')
      expect(bitBucket).toBeTruthy()

      act(() => {
        fireEvent.click(bitBucket!)
      })
      await waitFor(() => queryByText(form!, 'Authentication'))
      await waitFor(() => queryByText(form!, 'Username'))

      setFieldValue({ container: form!, type: InputTypes.TEXTFIELD, fieldId: 'usernametextField', value: 'user name' })

      const password = queryByText(form!, 'createOrSelectSecret')

      act(() => {
        fireEvent.click(password!)
      })
      await waitFor(() => queryByText(form!, 'common.entityReferenceTitle'))
      const selectSecret = queryByText(document.body, 'common.entityReferenceTitle')
      expect(selectSecret).toBeTruthy()
      act(() => {
        fireEvent.click(selectSecret!)
      })

      const secret = queryByText(document.body, 'selected_secret')
      expect(secret).toBeTruthy()
      act(() => {
        fireEvent.click(secret!)
      })

      const applySelected = queryByText(document.body, 'entityReference.apply')
      act(() => {
        fireEvent.click(applySelected!)
      })
      expect(form).toMatchSnapshot()

      //Submit Form
      await act(async () => {
        clickSubmit(form!)
      })

      expect(createSCM).toHaveBeenCalled()
    }),
    test('Add SCM should not be visible', async () => {
      ;(cdngServices.useGetSourceCodeManagers as jest.Mock).mockImplementation(() => {
        return { data: sourceCodeManagers, refetch: jest.fn() }
      })
      testSetup()
      const addSCM = container.querySelector('[data-test="userProfileAddSCM"]')
      expect(addSCM).toBeFalsy()
    }),
    test('Delete SCM', async () => {
      testSetup()
      const deleteIcon = queryByAttribute('data-testid', container, 'BB UP-delete')
      await act(async () => {
        fireEvent.click(deleteIcon!)
      })
      await waitFor(() => getAllByText(document.body, 'userProfile.confirmDeleteTitle')[0])
      const form = findDialogContainer()
      expect(form).toBeTruthy()
      const deleteBtn = queryByText(form!, 'delete')
      await act(async () => {
        fireEvent.click(deleteBtn!)
      })
      expect(queryByText(document.body, 'userProfile.scmDeleteSuccess')).toBeTruthy()
    }),
    test('Enable Two Factor Auth', async () => {
      testSetup()
      enableAuthfn.mockReset()
      const twoFactorSwitch = getByTestId('TwoFactorAuthSwitch')
      expect(twoFactorSwitch).toBeTruthy()

      act(() => {
        fireEvent.click(twoFactorSwitch!)
      })
      await waitFor(() => getAllByText(document.body, 'userProfile.qrCode')[0])

      const form = findDialogContainer()
      expect(form).toBeTruthy()

      const enable = getAllByText(form!, 'enable')[0]
      await act(async () => {
        fireEvent.click(enable!)
      })
      expect(enableAuthfn).toBeCalled()
      enabledAuth = true
    }),
    test('Refetch Two Factor Auth and Disable Two Factor Auth', async () => {
      testSetup()
      disableAuthfn.mockReset()

      //Refetch Two Factor Auth
      const reset = container.querySelector("[data-icon='reset']")
      expect(reset).toBeTruthy()
      act(() => {
        fireEvent.click(reset!)
      })
      await waitFor(() => getAllByText(document.body, 'userProfile.qrCode')[0])

      let form = findDialogContainer()
      expect(form).toBeTruthy()

      const cancel = getAllByText(form!, 'cancel')[0]
      await act(async () => {
        fireEvent.click(cancel!)
      })
      form = findDialogContainer()
      expect(form).toBeFalsy()

      //Disable Two Factor Auth
      const twoFactorSwitch = getByTestId('TwoFactorAuthSwitch')
      expect(twoFactorSwitch).toBeTruthy()

      act(() => {
        fireEvent.click(twoFactorSwitch!)
      })
      await waitFor(() => getAllByText(document.body, 'userProfile.twoFactor.disableTitle')[0])
      form = findDialogContainer()
      expect(form).toBeTruthy()
      const disable = getAllByText(form!, 'common.disable')[0]
      await act(async () => {
        fireEvent.click(disable!)
      })
      expect(disableAuthfn).toBeCalled()
      enabledAuth = false
    }),
    test('Change Password', async () => {
      testSetup()
      const password = queryByText(container, 'userProfile.changePassword')
      act(() => {
        fireEvent.click(password!)
      })

      await waitFor(() => getAllByText(document.body, 'userProfile.changePassword')[1])
      const form = findDialogContainer()
      expect(form).toBeTruthy()

      setFieldValue({ container: form!, type: InputTypes.TEXTFIELD, fieldId: 'currentPassword', value: 'password' })
      setFieldValue({ container: form!, type: InputTypes.TEXTFIELD, fieldId: 'newPassword', value: 'password@1DD' })
      setFieldValue({ container: form!, type: InputTypes.TEXTFIELD, fieldId: 'confirmPassword', value: 'password@1DD' })

      const currentPasswordView = form!.querySelectorAll("[data-icon='eye-off']")[0]
      const newPasswordView = form!.querySelectorAll("[data-icon='eye-off']")[1]
      const confirmPasswordView = form!.querySelectorAll("[data-icon='eye-off']")[2]
      expect(currentPasswordView).toBeTruthy()
      act(() => {
        fireEvent.click(currentPasswordView!)
        fireEvent.click(currentPasswordView!)
        fireEvent.click(newPasswordView!)
        fireEvent.click(confirmPasswordView!)
      })

      await act(async () => {
        clickSubmit(form!)
      })

      expect(queryByText(document.body, 'userProfile.passwordChangedSuccessfully')).toBeTruthy()
    }),
    test('No Projects Found', () => {
      ;(cdngServices.useGetUserProjectInfo as jest.Mock).mockImplementation(() => {
        return { data: { ...mockMyProfiles, data: { content: [] } } }
      })
      testSetup()
      expect(queryByText(document.body, 'noProjects')).toBeTruthy()
    })
  test('Hide SwitchAccount button for community edition', async () => {
    testSetup(true)
    expect(queryByText(document.body, 'common.switchAccount')).toBeNull()
  })
})
