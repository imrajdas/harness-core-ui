/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render, act, fireEvent, waitFor } from '@testing-library/react'
import routes from '@common/RouteDefinitions'
import { fillAtForm, InputTypes } from '@common/utils/JestFormHelper'
import { TestWrapper } from '@common/utils/testUtils'
import { SelectGitProvider } from '../SelectGitProvider'
import { InfraProvisioningWizard } from '../InfraProvisioningWizard'
import { AllBuildLocationsForSaaS, Hosting, InfraProvisiongWizardStepId } from '../Constants'

const pathParams = { accountId: 'accountId', orgIdentifier: 'orgId', projectIdentifier: 'projectId' }

const updateConnector = jest.fn()
const createConnector = jest.fn()
jest.mock('services/cd-ng', () => ({
  useCreateDefaultScmConnector: jest.fn().mockImplementation(() => {
    return {
      mutate: () =>
        Promise.resolve({
          status: 'ERROR',
          code: 'HINT',
          message: 'Please ensure that the api access credentials are correct.',
          responseMessages: [
            {
              code: 'HINT',
              level: 'INFO',
              message: 'Please ensure that the api access credentials are correct.'
            },
            {
              code: 'EXPLANATION',
              level: 'INFO',
              message: 'Provided api access credentials are not authorized.'
            },
            {
              code: 'INVALID_REQUEST',
              level: 'ERROR',
              message: 'Invalid request: Bad credentials'
            }
          ]
        })
    }
  }),
  useUpdateConnector: jest.fn().mockImplementation(() => ({ mutate: updateConnector })),
  useCreateConnector: jest.fn().mockImplementation(() => ({ mutate: createConnector }))
}))

describe('Test SelectGitProvider component', () => {
  test('Initial render', async () => {
    const { container } = render(
      <TestWrapper
        path={routes.toGetStartedWithCI({
          ...pathParams,
          module: 'ci'
        })}
        pathParams={{
          ...pathParams,
          module: 'ci'
        }}
      >
        <SelectGitProvider enableNextBtn={jest.fn()} disableNextBtn={jest.fn()} selectedHosting={Hosting.SaaS} />
      </TestWrapper>
    )
    const gitProviderCards = Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[]
    expect(gitProviderCards.length).toBe(AllBuildLocationsForSaaS.length)
  })

  test('User clicks on Github Provider card', async () => {
    const { container, getByText } = render(
      <TestWrapper
        path={routes.toGetStartedWithCI({
          ...pathParams,
          module: 'ci'
        })}
        pathParams={{
          ...pathParams,
          module: 'ci'
        }}
      >
        <SelectGitProvider enableNextBtn={jest.fn()} disableNextBtn={jest.fn()} selectedHosting={Hosting.SaaS} />
      </TestWrapper>
    )
    const gitProviderCards = Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[]

    // Clicking on Github Git Provider card should select it
    expect(gitProviderCards[0].classList.contains('Card--selected')).not.toBe(true)
    await act(async () => {
      fireEvent.click(gitProviderCards[0])
    })
    expect(gitProviderCards[0].classList.contains('Card--selected')).toBe(true)

    expect(getByText('common.oAuthLabel')).toBeInTheDocument()
    expect(getByText('ci.getStartedWithCI.accessTokenLabel')).toBeInTheDocument()
  })

  test('User selects Github provider and Access Token authentication method', async () => {
    window.open = jest.fn()
    global.fetch = jest.fn()
    const { container, getByText, getAllByText } = render(
      <TestWrapper
        path={routes.toGetStartedWithCI({
          ...pathParams,
          module: 'ci'
        })}
        pathParams={{
          ...pathParams,
          module: 'ci'
        }}
      >
        <SelectGitProvider enableNextBtn={jest.fn()} disableNextBtn={jest.fn()} selectedHosting={Hosting.SaaS} />
      </TestWrapper>
    )
    await act(async () => {
      fireEvent.click((Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[])[0])
    })

    // Access token field should be visible only for Access Token auth method
    await act(async () => {
      fireEvent.click(getByText('common.oAuthLabel'))
    })
    expect(container.querySelector('span[data-tooltip-id="accessToken"]')).not.toBeTruthy()
    // Test Connection button look up should fail
    try {
      getByText('common.smtp.testConnection')
    } catch (e) {
      expect(e).toBeTruthy()
    }

    await act(async () => {
      fireEvent.click(getByText('common.getStarted.accessTokenLabel'))
    })

    expect(container.querySelector('span[data-tooltip-id="accessToken"]')).toBeTruthy()
    const testConnectionBtn = container.querySelector("button[id='test-connection-btn']") as Element
    expect(testConnectionBtn).toBeInTheDocument()

    // Clicking Test Connection button without Access Token field set should not show "in progress" view for Test Connection button
    await act(async () => {
      fireEvent.click(testConnectionBtn)
    })
    try {
      getByText('common.test.inProgress')
    } catch (e) {
      expect(e).toBeTruthy()
    }

    // Schema validation error should show up for Access Token field if it's not filled
    const accessTokenValidationError = container.querySelector(
      'div[class*="FormError--errorDiv"][data-name="accessToken"]'
    )
    expect(accessTokenValidationError).toBeInTheDocument()
    expect(getByText('fieldRequired')).toBeTruthy()

    await waitFor(() =>
      fillAtForm([
        {
          container,
          fieldId: 'accessToken',
          type: InputTypes.TEXTFIELD,
          value: 'sample-access-token'
        }
      ])
    )

    // validation error goes away once Access Token is provided
    expect(container.querySelector('input[name="accessToken"]')).toHaveValue('sample-access-token')
    expect(accessTokenValidationError).not.toBeInTheDocument()

    await act(async () => {
      fireEvent.click(testConnectionBtn)
    })
    // should show correct error messages once test connection is done
    expect(getAllByText('ci.getStartedWithCI.fieldIsMissing').length).toBe(2)
  })

  test('User selects Github provider and OAuth authentication method', async () => {
    window.open = jest.fn()
    window.addEventListener = jest.fn()
    global.fetch = jest.fn().mockImplementation(() =>
      Promise.resolve({
        text: () => Promise.resolve('https://github.com/auth/login')
      })
    )
    const { container, getByText } = render(
      <TestWrapper
        path={routes.toGetStartedWithCI({
          ...pathParams,
          module: 'ci'
        })}
        pathParams={{
          ...pathParams,
          module: 'ci'
        }}
      >
        <SelectGitProvider enableNextBtn={jest.fn()} disableNextBtn={jest.fn()} selectedHosting={Hosting.SaaS} />
      </TestWrapper>
    )
    await act(async () => {
      fireEvent.click((Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[])[0])
    })

    await act(async () => {
      fireEvent.click(getByText('common.oAuthLabel'))
    })
    expect(global.fetch).toBeCalled()
  })

  test('User selects Gitlab provider and OAuth authentication method', async () => {
    window.open = jest.fn()
    window.addEventListener = jest.fn()
    global.fetch = jest.fn()
    const { container, getByText } = render(
      <TestWrapper
        path={routes.toGetStartedWithCI({
          ...pathParams,
          module: 'ci'
        })}
        pathParams={{
          ...pathParams,
          module: 'ci'
        }}
      >
        <SelectGitProvider enableNextBtn={jest.fn()} disableNextBtn={jest.fn()} selectedHosting={Hosting.SaaS} />
      </TestWrapper>
    )
    await act(async () => {
      fireEvent.click((Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[])[1])
    })

    await act(async () => {
      fireEvent.click(getByText('common.oAuthLabel'))
    })
    expect(global.fetch).not.toBeCalled()
  })

  test('User selects Gitlab provider and Access Key authentication method', async () => {
    window.open = jest.fn()
    const { container, getByText } = render(
      <TestWrapper
        path={routes.toGetStartedWithCI({
          ...pathParams,
          module: 'ci'
        })}
        pathParams={{
          ...pathParams,
          module: 'ci'
        }}
      >
        <SelectGitProvider enableNextBtn={jest.fn()} disableNextBtn={jest.fn()} selectedHosting={Hosting.SaaS} />
      </TestWrapper>
    )
    await act(async () => {
      fireEvent.click((Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[])[1])
    })

    // Access Key field should be visible only for Access Key auth method
    await act(async () => {
      fireEvent.click(getByText('common.oAuthLabel'))
    })
    expect(container.querySelector('span[data-tooltip-id="accessKey"]')).not.toBeTruthy()
    // Test Connection button look up should fail
    try {
      getByText('common.smtp.testConnection')
    } catch (e) {
      expect(e).toBeTruthy()
    }

    await act(async () => {
      fireEvent.click(getByText('common.accessKey'))
    })

    expect(container.querySelector('span[data-tooltip-id="accessKey"]')).toBeTruthy()
    const testConnectionBtn = container.querySelector("button[id='test-connection-btn']") as Element
    expect(testConnectionBtn).toBeInTheDocument()

    // Clicking Test Connection button without Access Key field set should not show "in progress" view for Test Connection button
    await act(async () => {
      fireEvent.click(testConnectionBtn)
    })
    try {
      getByText('common.test.inProgress')
    } catch (e) {
      expect(e).toBeTruthy()
    }

    // Schema validation error should show up for Access Key field if it's not filled
    const accessKeyValidationError = container.querySelector('div[class*="FormError--errorDiv"][data-name="accessKey"]')
    expect(accessKeyValidationError).toBeInTheDocument()
    expect(getByText('fieldRequired')).toBeTruthy()

    await waitFor(() =>
      fillAtForm([
        {
          container,
          fieldId: 'accessKey',
          type: InputTypes.TEXTFIELD,
          value: 'sample-access-key'
        }
      ])
    )

    // validation error goes away once Access Key is provided
    expect(container.querySelector('input[name="accessKey"]')).toHaveValue('sample-access-key')
    expect(accessKeyValidationError).not.toBeInTheDocument()
  })

  test('User selects Bitbucket provider and Username & Application Password method', async () => {
    window.open = jest.fn()
    const { container, getByText, getAllByText } = render(
      <TestWrapper
        path={routes.toGetStartedWithCI({
          ...pathParams,
          module: 'ci'
        })}
        pathParams={{
          ...pathParams,
          module: 'ci'
        }}
      >
        <SelectGitProvider enableNextBtn={jest.fn()} disableNextBtn={jest.fn()} selectedHosting={Hosting.SaaS} />
      </TestWrapper>
    )
    await act(async () => {
      fireEvent.click((Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[])[2])
    })

    // Username and Application Password fields should be visible only for Username & Application Password auth method
    await act(async () => {
      fireEvent.click(getByText('common.oAuthLabel'))
    })
    expect(container.querySelector('span[data-tooltip-id="username"]')).not.toBeTruthy()
    expect(container.querySelector('span[data-tooltip-id="applicationPassword"]')).not.toBeTruthy()
    // Test Connection button look up should fail
    try {
      getByText('common.smtp.testConnection')
    } catch (e) {
      expect(e).toBeTruthy()
    }

    await act(async () => {
      fireEvent.click(getByText('username & common.getStarted.appPassword'))
    })

    expect(container.querySelector('span[data-tooltip-id="username"]')).toBeTruthy()
    expect(container.querySelector('span[data-tooltip-id="applicationPassword"]')).toBeTruthy()
    const testConnectionBtn = container.querySelector("button[id='test-connection-btn']") as Element
    expect(testConnectionBtn).toBeInTheDocument()

    // Clicking Test Connection button without Username and Application Password fields set should not show "in progress" view for Test Connection button
    await act(async () => {
      fireEvent.click(testConnectionBtn)
    })
    try {
      getByText('common.test.inProgress')
    } catch (e) {
      expect(e).toBeTruthy()
    }

    // Schema validation error should show up for Username and Application Password fields if it's not filled
    const usernameValidationError = container.querySelector('div[class*="FormError--errorDiv"][data-name="username"]')
    const applicationPasswordValidationError = container.querySelector(
      'div[class*="FormError--errorDiv"][data-name="applicationPassword"]'
    )
    expect(usernameValidationError).toBeInTheDocument()
    expect(applicationPasswordValidationError).toBeInTheDocument()
    expect(getAllByText('fieldRequired').length).toBe(2)

    await waitFor(() =>
      fillAtForm([
        {
          container,
          fieldId: 'username',
          type: InputTypes.TEXTFIELD,
          value: 'sample-username'
        }
      ])
    )

    // validation error for Username goes away once username is provided
    expect(container.querySelector('input[name="username"]')).toHaveValue('sample-username')
    expect(usernameValidationError).not.toBeInTheDocument()
    expect(getAllByText('fieldRequired').length).toBe(1)

    await waitFor(() =>
      fillAtForm([
        {
          container,
          fieldId: 'applicationPassword',
          type: InputTypes.TEXTFIELD,
          value: 'sample-pwd'
        }
      ])
    )
    expect(applicationPasswordValidationError).not.toBeInTheDocument()
  })

  test('Render SelectGitProvider inside InfraProvisioningWizard', async () => {
    const { container, getByText } = render(
      <TestWrapper path={routes.toGetStartedWithCI({ ...pathParams, module: 'ci' })} pathParams={pathParams}>
        <InfraProvisioningWizard lastConfiguredWizardStepId={InfraProvisiongWizardStepId.SelectGitProvider} />
      </TestWrapper>
    )

    const nextBtn = getByText('next: ci.getStartedWithCI.selectRepo')
    await act(async () => {
      fireEvent.click(nextBtn)
    })

    // Schema validation error should show up for if Git Provider is not selected
    expect(container.querySelector('div[class*="FormError--errorDiv"][data-name="gitProvider"]')).toBeInTheDocument()
    expect(getByText('common.getStarted.plsChoose')).toBeTruthy()

    const gitProviderCards = Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[]

    await act(async () => {
      fireEvent.click(gitProviderCards[0])
    })

    await act(async () => {
      fireEvent.click(nextBtn)
    })

    const gitAuthenticationMethodValidationError = container.querySelector(
      'div[class*="FormError--errorDiv"][data-name="gitAuthenticationMethod"]'
    )
    expect(gitAuthenticationMethodValidationError).toBeInTheDocument()

    await act(async () => {
      fireEvent.click(nextBtn)
    })

    await act(async () => {
      fireEvent.click(getByText('common.getStarted.accessTokenLabel'))
    })

    expect(gitAuthenticationMethodValidationError).not.toBeInTheDocument()
  })
})
