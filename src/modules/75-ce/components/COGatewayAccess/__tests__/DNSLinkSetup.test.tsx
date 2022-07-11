/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act } from 'react-dom/test-utils'
import { findByText, fireEvent, queryByText, render, waitFor } from '@testing-library/react'
import { TestWrapper } from '@common/utils/testUtils'
import type { AccessPoint, AccessPointCore } from 'services/lw'
import * as lwServices from 'services/lw'
import DNSLinkSetup from '../DNSLinkSetup'
import { initialGatewayDetails, mockedSecurityGroupResponse } from './data'

let mockAccessPointList = {
  response: [
    {
      name: 'mock.com',
      id: 'mock.com',
      host_name: 'mock.com',
      metadata: {
        albArn: 'mockalbARN'
      }
    } as AccessPoint
  ]
}
const mockedCreateAp = {
  response: {
    id: 'mockalbArn',
    status: 'created',
    name: 'mock.com',
    host_name: 'mock.com',
    metadata: {
      albArn: 'mockalbARN'
    }
  }
}
let mockedHostedZonesData = {
  data: {
    response: [{ id: 'route53mock.com', name: 'route53mock.com' }]
  },
  loading: false,
  refetch: jest.fn(() => Promise.resolve({ data: { response: [{ id: 'route53mock.com', name: 'route53mock.com' }] } }))
}
const mockURL = 'mock.com'
const testpath = '/account/:accountId/ce/orgs/:orgIdentifier/projects/:projectIdentifier/autostopping-rules/create'
const testparams = { accountId: 'accountId', orgIdentifier: 'orgIdentifier', projectIdentifier: 'projectIdentifier' }

const mockAccessPointResourceData = {
  response: [
    {
      details: {
        albARN: 'mockalbARN',
        name: 'mockALBname',
        id: 'mock.com'
      }
    }
  ] as AccessPointCore[]
}

const mockObj = { response: { id: 'mock' } }

const mockedRegionsData = { data: { response: [{ name: 'ap-southeast-1', label: 'ap-southeast-1' }] }, loading: false }
const mockedCertificatesData = {
  data: { response: [{ name: '*.lightwingtest.com', id: '*.lightwingtest.com' }] },
  loading: false,
  refetch: jest.fn(() => mockObj)
}
const mockedVpnData = {
  data: {
    response: [{ name: 'testvpn', id: 'testvpn' }]
  },
  loading: false,
  refetch: jest.fn(() => mockObj)
}

jest.mock('services/lw', () => ({
  useListAccessPoints: jest.fn().mockImplementation(() => ({
    data: mockAccessPointList,
    loading: false,
    refetch: jest.fn(() => mockAccessPointList)
  })),
  useAllHostedZones: jest.fn().mockImplementation(() => mockedHostedZonesData),
  useAccessPointResources: jest.fn().mockImplementation(() => ({
    data: mockAccessPointResourceData,
    loading: false,
    refetch: jest.fn(() => mockAccessPointResourceData)
  })),
  useCreateAccessPoint: jest.fn().mockImplementation(() => ({
    mutate: jest.fn().mockImplementation(() => Promise.resolve({ response: { id: 'mockalbArn' } }))
  })),
  useGetAccessPoint: jest
    .fn()
    .mockImplementation(() => ({ data: mockedCreateAp, loading: false, refetch: Promise.resolve({}) })),
  useAllRegions: jest.fn().mockImplementation(() => mockedRegionsData),
  useAllVPCs: jest.fn().mockImplementation(() => mockedVpnData),
  useAllCertificates: jest.fn().mockImplementation(() => mockedCertificatesData),
  useAllSecurityGroups: jest
    .fn()
    .mockImplementation(() => ({ data: { response: [] }, loading: false, refetch: jest.fn() })),
  useSecurityGroupsOfInstances: jest.fn().mockImplementation(() => ({
    mutate: jest.fn(() => Promise.resolve({ response: mockedSecurityGroupResponse })),
    loading: false
  })),
  useEditAccessPoint: jest.fn().mockImplementation(() => ({ mutate: Promise.resolve() })),
  useValidateCustomDomains: jest
    .fn()
    .mockImplementation(() => ({ mutate: jest.fn(() => Promise.resolve({ response: null })) }))
}))

describe('Use DNS for Setup', () => {
  test('renders without crashing', () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={initialGatewayDetails}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('creating a new access point', async () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={initialGatewayDetails}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    const newAp = await findByText(container, '+ce.co.accessPoint.new')
    expect(newAp).toBeDefined()
    act(() => {
      fireEvent.click(newAp)
    })
    const apDialog = document.body.querySelector('.bp3-dialog')
    expect(apDialog).toBeDefined()
    const nameInput = (apDialog as HTMLElement).querySelector('input[name="lbName"]') as HTMLInputElement
    expect(nameInput).toBeDefined()
    waitFor(() => {
      fireEvent.change(nameInput, { target: { value: 'AWS AP' } })
    })
    expect(nameInput.value).toBe('AWS AP')

    const customDomainInput = (apDialog as HTMLElement).querySelector(
      'input[name="customDomainPrefix"]'
    ) as HTMLInputElement
    expect(customDomainInput).toBeDefined()
    waitFor(() => {
      fireEvent.change(customDomainInput, { target: { value: 'test.lwtest.com' } })
    })
    expect(customDomainInput.value).toBe('test.lwtest.com')
    const continueBtn = queryByText(apDialog as HTMLElement, 'Continue')
    expect(continueBtn).toBeDefined()

    await waitFor(() => {
      fireEvent.click(continueBtn!)
    })
    const saveApBtn = queryByText(apDialog as HTMLElement, 'Save Load Balancer')
    await waitFor(() => {
      fireEvent.click(saveApBtn!)
    })
    expect(container.querySelector('.bp3-dialog')).toBeFalsy()
  })

  test('form fills without error', async () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={initialGatewayDetails}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    const newAp = await findByText(container, '+ce.co.accessPoint.new')
    expect(newAp).toBeDefined()
    act(() => {
      fireEvent.click(newAp)
    })
    const apDialog = document.body.querySelector('.bp3-dialog')
    expect(apDialog).toBeDefined()
    const nameInput = (apDialog as HTMLElement).querySelector('input[name="lbName"]') as HTMLInputElement
    expect(nameInput).toBeDefined()
    waitFor(() => {
      fireEvent.change(nameInput, { target: { value: 'AWS AP' } })
    })
    expect(nameInput.value).toBe('AWS AP')

    const customDomainInput = (apDialog as HTMLElement).querySelector(
      'input[name="customDomainPrefix"]'
    ) as HTMLInputElement
    expect(customDomainInput).toBeDefined()
    waitFor(() => {
      fireEvent.change(customDomainInput, { target: { value: 'test.lwtest.com' } })
    })
    expect(customDomainInput.value).toBe('test.lwtest.com')
    const continueBtn = queryByText(apDialog as HTMLElement, 'Continue')
    expect(continueBtn).toBeDefined()

    await waitFor(() => {
      fireEvent.click(continueBtn!)
    })
    const saveApBtn = queryByText(apDialog as HTMLElement, 'Save Load Balancer')
    await waitFor(() => {
      fireEvent.click(saveApBtn!)
    })
    expect(container.querySelector('.bp3-dialog')).toBeFalsy()
  })

  test('form fills without error', async () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={initialGatewayDetails}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    const notUsingCustomDomain = container.querySelector('input[name="notUsingCustomDomain"]') as HTMLInputElement
    expect(notUsingCustomDomain).toBeDefined()

    const accessPointDropDown = container.querySelector('input[name="accessPoint"]') as HTMLInputElement
    expect(accessPointDropDown).toBeDefined()

    // selecting resource
    const accessPointCaret = container
      .querySelector(`input[name="accessPoint"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    await waitFor(() => {
      fireEvent.click(accessPointCaret!)
    })
    const apToSelect = await findByText(container, 'mockALBname')
    expect(apToSelect).toBeDefined()
    act(() => {
      fireEvent.click(apToSelect)
    })
    expect(accessPointDropDown.value).toBe('mockALBname')

    // adding custom url
    const customURL = container.querySelector('input[name="customURL"]') as HTMLInputElement
    expect(customURL).toBeDefined()
    expect(customURL.value).toBe('')

    const usingCustomDomain = container.querySelector('input[name="usingCustomDomain"]') as HTMLInputElement
    act(() => {
      fireEvent.click(usingCustomDomain)
    })
    expect(usingCustomDomain.checked).toBe(true)
    await waitFor(() => {
      fireEvent.change(customURL, { target: { value: mockURL } })
    })
    expect(customURL.value).toBe(mockURL)

    // mapping other/route53 domain
    const route53 = container.querySelector('input[name="route53RadioBtn"]') as HTMLInputElement
    expect(route53).toBeDefined()
    act(() => {
      fireEvent.click(route53)
    })
    expect(route53.checked).toBe(true)

    const route53Account = container.querySelector('input[name="route53Account"]') as HTMLInputElement
    expect(route53Account).toBeDefined()
    const route53Caret = container
      .querySelector(`input[name="route53Account"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    await waitFor(() => {
      fireEvent.click(route53Caret!)
    })
    const route53ToSelect = await findByText(container, 'route53mock.com')
    act(() => {
      fireEvent.click(route53ToSelect)
    })
    expect(route53Account.value).toBe('route53mock.com')
  })

  test('No Access Point is available', () => {
    mockAccessPointList = { response: [] }
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={initialGatewayDetails}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('No hosted zone is available', () => {
    mockedHostedZonesData = {
      data: {
        response: []
      },
      loading: false,
      refetch: jest.fn(() => Promise.resolve({ data: { response: [] } }))
    }
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={initialGatewayDetails}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()
  })

  test('option for creating new ALB should not be available for ECS rule', () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={{
            ...initialGatewayDetails,
            selectedInstances: [],
            routing: {
              ...initialGatewayDetails.routing,
              container_svc: {
                cluster: 'EcsDemo',
                region: 'us-east-1',
                service: 'ToDoAppECS',
                task_count: 1
              }
            }
          }}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})

describe('Azure DNS setup', () => {
  test('render azure dns setup page', async () => {
    const azureProvider = {
      name: 'Azure',
      value: 'azure',
      icon: 'service-azure'
    }

    mockAccessPointList = {
      response: [
        {
          name: 'mock.com',
          id: 'mock.com',
          host_name: 'mock.com',
          metadata: {
            albArn: 'mockalbARN',
            app_gateway_id: 'mock.com'
          }
        }
      ]
    }
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={{ ...initialGatewayDetails, provider: azureProvider }}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )
    expect(container).toMatchSnapshot()

    const accessPointDropDown = container.querySelector('input[name="accessPoint"]') as HTMLInputElement
    expect(accessPointDropDown).toBeDefined()

    // selecting resource
    const accessPointCaret = container
      .querySelector(`input[name="accessPoint"] + [class*="bp3-input-action"]`)
      ?.querySelector('[data-icon="chevron-down"]')
    await waitFor(() => {
      fireEvent.click(accessPointCaret!)
    })
    const apToSelect = await findByText(container, 'mockALBname')
    expect(apToSelect).toBeDefined()
    act(() => {
      fireEvent.click(apToSelect)
    })
    expect(accessPointDropDown.value).toBe('mockALBname')
  })
})

describe('Resource Access url selector tests', () => {
  test('remove added custom domains', () => {
    const { container, getByTestId } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={{ ...initialGatewayDetails, customDomains: [mockURL] }}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    const input = getByTestId('noCustomDomain')
    expect(input).toBeDefined()
    act(() => {
      fireEvent.click(input)
    })

    const customURL = container.querySelector('input[name="customURL"]') as HTMLInputElement
    expect(customURL.value).toBe('')
  })

  test('hosted zone id is present', () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={{
            ...initialGatewayDetails,
            customDomains: [mockURL],
            routing: {
              ...initialGatewayDetails.routing,
              custom_domain_providers: {
                route53: {
                  hosted_zone_id: 'testHostedZoneId'
                }
              }
            }
          }}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('no hosted zone response', () => {
    jest.spyOn(lwServices, 'useAllHostedZones').mockImplementation(
      () =>
        ({
          data: null,
          loading: false,
          refetch: jest.fn()
        } as any)
    )
    const { container, getByTestId } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={{ ...initialGatewayDetails, customDomains: undefined }}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    const input = getByTestId('noCustomDomain')
    expect(input).toBeDefined()
    act(() => {
      fireEvent.click(input)
    })

    const customURL = container.querySelector('input[name="customURL"]') as HTMLInputElement
    expect(customURL.value).toBe('')
  })
})

describe('Load balancer advanced config', () => {
  test('remove health check data and add again with default values', () => {
    const { container, getByTestId } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={{ ...initialGatewayDetails }}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    const routingTab = container.querySelector('.bp3-tab-list div[data-tab-id="healthcheck"]')
    expect(routingTab).toBeDefined()
    act(() => {
      fireEvent.click(routingTab!)
    })
    const toggle = getByTestId('toggleHealthCheck')
    act(() => {
      fireEvent.click(toggle)
    })

    expect(container).toMatchSnapshot()

    act(() => {
      fireEvent.click(toggle)
    })

    expect(container).toMatchSnapshot()
  })

  test('show routing table in case of empty selected instances', () => {
    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={{ ...initialGatewayDetails, selectedInstances: [] }}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })

  test('show error', () => {
    jest.spyOn(lwServices, 'useSecurityGroupsOfInstances').mockImplementation(
      () =>
        ({
          mutate: jest.fn(() => Promise.reject({ message: 'error message' })),
          loading: false
        } as any)
    )

    const { container } = render(
      <TestWrapper path={testpath} pathParams={testparams}>
        <DNSLinkSetup
          gatewayDetails={initialGatewayDetails}
          setGatewayDetails={jest.fn()}
          setHelpTextSections={jest.fn()}
          serverNames={[]}
          setServerNames={jest.fn()}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    expect(container).toMatchSnapshot()
  })
})
