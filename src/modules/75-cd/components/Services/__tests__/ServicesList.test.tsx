/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { noop } from 'lodash-es'
import { findDialogContainer, TestWrapper } from '@common/utils/testUtils'
import { ServicesList } from '@cd/components/Services/ServicesList/ServicesList'
import { serviceDetails } from '@cd/mock'
import type { ServiceDetailsDTO } from 'services/cd-ng'
import mockImport from 'framework/utils/mockImport'

jest.mock('highcharts-react-official', () => () => <></>)

jest.mock('services/cd-ng', () => {
  return {
    useGetYamlSchema: jest.fn().mockImplementation(() => ({ refetch: jest.fn(), loading: false })),
    useDeleteServiceV2: jest.fn(() => ({ mutate: jest.fn() })),
    useCreateServiceV2: jest.fn().mockImplementation(() => ({ refetch: jest.fn(), loading: false, data: {} })),
    useUpsertServiceV2: jest.fn().mockImplementation(() => ({
      cancel: jest.fn(),
      loading: false,
      mutate: jest.fn().mockImplementation(() => {
        return {
          status: 'SUCCESS'
        }
      })
    }))
  }
})
const mutate = jest.fn(() => {
  return Promise.resolve({
    status: 'SUCCESS',
    data: {}
  })
})

export const findDialogMenu = (): HTMLElement | null => document.querySelector('.bp3-menu')

const renderSetup = (data: ServiceDetailsDTO[]) => {
  return render(
    <TestWrapper
      path="account/:accountId/cd/orgs/:orgIdentifier/projects/:projectIdentifier/services"
      pathParams={{ accountId: 'dummy', orgIdentifier: 'dummy', projectIdentifier: 'dummy' }}
    >
      <ServicesList loading={false} error={false} data={data} refetch={noop} />
    </TestWrapper>
  )
}

describe('ServicesList', () => {
  test('render', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container } = renderSetup(responseData)
    expect(container).toMatchSnapshot()
  })

  test('go to service details on row click', async () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container, getByTestId } = renderSetup(responseData)
    const row = container.getElementsByClassName('TableV2--row TableV2--card TableV2--clickable')[0]
    await fireEvent.click(row!)
    await waitFor(() => getByTestId('location'))

    expect(getByTestId('location')).toHaveTextContent(
      '/account/dummy/undefined/orgs/dummy/projects/dummy/services/asdfasdf'
    )
  })

  test('should go to latest execution after click', async () => {
    window.open = jest.fn()
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container } = renderSetup(responseData)

    const pipelineExecutionId =
      serviceDetails.data.serviceDeploymentDetailsList[1].lastPipelineExecuted?.pipelineExecutionId
    const planExecutionId = serviceDetails.data.serviceDeploymentDetailsList[1].lastPipelineExecuted?.planExecutionId
    expect(container.querySelector(`[data-testid="${pipelineExecutionId}"]`)).toBeDefined()
    fireEvent.click(container.querySelector(`[data-testid="${pipelineExecutionId}"]`) as HTMLElement)

    //should take user to latest pipeline execution in new tab
    expect(window.open).toHaveBeenCalledTimes(1)
    expect(window.open).toBeCalledWith(
      expect.stringContaining(
        `/account/dummy/undefined/orgs/dummy/projects/dummy/pipelines/Test/deployments/${planExecutionId}/pipeline`
      )
    )
  })
})

describe('Menu render', () => {
  test('open option menu and "open in new tab"', async () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container } = renderSetup(responseData)
    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    const menuDailog = findDialogMenu()
    expect(menuDailog).toBeTruthy()

    const launchBtn = menuDailog!.querySelector('[data-icon="launch"]')
    expect(launchBtn).toBeTruthy()
    fireEvent.click(launchBtn!)

    expect(launchBtn?.closest('a')).toHaveAttribute(
      'href',
      '/account/dummy/undefined/orgs/dummy/projects/dummy/services/asdfasdf'
    )
  })

  test('should open edit modal and cancel', async () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container, getByText } = renderSetup(responseData)

    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    const menuDailog = findDialogMenu()
    expect(menuDailog).toBeTruthy()

    const editBtn = menuDailog!.querySelector('[data-icon="edit"]')
    fireEvent.click(editBtn!)

    const form = findDialogContainer()
    await waitFor(() => expect(form).toBeTruthy())

    expect(getByText('cancel')).toBeDefined()
    fireEvent.click(getByText('cancel') as HTMLButtonElement)
    expect(findDialogContainer()).toBeFalsy()
  })

  test('Should allow deleting', async () => {
    mockImport('services/cd-ng', {
      useDeleteServiceV2: () => ({
        mutate
      })
    })

    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container, getByText } = renderSetup(responseData)

    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    let menuDailog = findDialogMenu()
    expect(menuDailog).toBeTruthy()

    fireEvent.click(menuDailog!.querySelector('[icon="trash"]') as HTMLElement)
    let form = findDialogContainer()
    expect(form).toMatchSnapshot()
    expect(getByText('confirm')).toBeDefined()
    fireEvent.click(getByText('confirm') as HTMLButtonElement)
    await waitFor(() => expect(mutate).toBeCalledTimes(1))

    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    menuDailog = findDialogMenu()
    fireEvent.click(menuDailog!.querySelector('[icon="trash"]') as HTMLElement)
    form = findDialogContainer()
    await waitFor(() => expect(getByText('common.deleteService')))
    expect(getByText('cancel')).toBeDefined()
    fireEvent.click(getByText('cancel') as HTMLButtonElement)
    expect(findDialogContainer()).toBeFalsy()
  })

  test('Delete with error', async () => {
    mockImport('services/cd-ng', {
      useDeleteServiceV2: jest.fn().mockImplementation(() => {
        return {
          mutate: jest.fn().mockRejectedValue({
            data: {
              message: 'Deletion failed'
            }
          })
        }
      })
    })

    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container, getByText } = renderSetup(responseData)

    fireEvent.click(container.querySelector('[data-icon="Options"]') as HTMLElement)
    const menuDailog = findDialogMenu()
    expect(menuDailog).toBeTruthy()

    fireEvent.click(menuDailog!.querySelector('[icon="trash"]') as HTMLElement)
    const form = findDialogContainer()
    await waitFor(() => expect(form).toBeTruthy())
    expect(getByText('confirm')).toBeDefined()
    fireEvent.click(getByText('confirm') as HTMLButtonElement)
    await waitFor(() => expect(mutate).toBeCalledTimes(1))

    expect(findDialogContainer()).toBeFalsy()
    await waitFor(() => expect(getByText('Deletion failed')).toBeDefined())
  })
})

describe('DeploymentType in ServicesList ', () => {
  test('render Kubernetes deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="service-kubernetes"]')).toBeTruthy()
  })

  test('render NativeHelm deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['NativeHelm']
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="service-helm"]')).toBeTruthy()
  })

  test('render ServerlessAwsLambda deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['ServerlessAwsLambda']
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="service-serverless"]')).toBeTruthy()
  })

  test('render Ssh deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['Ssh']
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="secret-ssh"]')).toBeTruthy()
  })

  test('render WinRm deployment type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['WinRm']
    const { container } = renderSetup(responseData)
    expect(container.querySelector('[data-icon="command-winrm"]')).toBeTruthy()
  })

  test('render more than 2 deployments type', () => {
    const responseData = serviceDetails.data.serviceDeploymentDetailsList as unknown as ServiceDetailsDTO[]
    responseData[1].deploymentTypeList = ['Kubernetes', 'NativeHelm', 'ServerlessAwsLambda', 'Ssh', 'WinRm']
    const { container, getByText } = renderSetup(responseData)

    //first 2 types should be visible
    expect(container.querySelector('[data-icon="service-kubernetes"]')).toBeTruthy()
    expect(container.querySelector('[data-icon="service-helm"]')).toBeTruthy()

    // for the remaining type should show '+ remainingCount'
    const remainingTypes = responseData[1].deploymentTypeList.length - 2
    expect(getByText(`+ ${remainingTypes}`)).toBeTruthy()
  })
})
