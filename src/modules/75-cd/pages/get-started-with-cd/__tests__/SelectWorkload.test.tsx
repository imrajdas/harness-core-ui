/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import routes from '@common/RouteDefinitions'
import { SelectWorkload } from '../SelectWorkload/SelectWorkload'
import { deploymentTypes, WorkloadProviders } from '../DeployProvisioningWizard/Constants'
const pathParams = { accountId: 'accountId', orgIdentifier: 'orgId', projectIdentifier: 'projectId' }
const renderComponent = () => {
  return (
    <TestWrapper
      path={routes.toGetStartedWithCI({
        ...pathParams,
        module: 'cd'
      })}
      pathParams={{
        ...pathParams,
        module: 'cd'
      }}
    >
      <SelectWorkload enableNextBtn={jest.fn()} disableNextBtn={jest.fn()} />
    </TestWrapper>
  )
}
describe('Test SelectWorkload component', () => {
  test('Initial render', async () => {
    const { container } = render(renderComponent())
    const workloadProviderCards = Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[]
    expect(workloadProviderCards.length).toBe(WorkloadProviders.length)
  })

  test('Render Service deployment type and service name', () => {
    const { container } = render(renderComponent())
    const workloadProviderCards = Array.from(container.querySelectorAll('div[class*="bp3-card"]')) as HTMLElement[]
    expect(workloadProviderCards.length).toBe(workloadProviderCards.length)

    //Selecting services
    fireEvent.click(workloadProviderCards[0])

    //On selecting services, getting list of service deployment types
    const serviceDeploymentTypeCards = Array.from(
      container.querySelectorAll('div[class*="serviceDeploymentTypeCard"]')
    ) as HTMLElement[]
    expect(serviceDeploymentTypeCards.length).toBe(deploymentTypes.length)

    //selecting kubernetes
    fireEvent.click(serviceDeploymentTypeCards[0])

    //Renders service name input box
    expect(container.querySelector('span[data-tooltip-id="specifyYourService"]')).toBeTruthy()
  })
})
