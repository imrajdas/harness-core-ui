/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
import type { FormikProps } from 'formik'
import { TestWrapper } from '@common/utils/testUtils'
import CustomDomainMapping from '../CustomDomainMapping'
import { initialGatewayDetails } from './data'

describe('Custom domain mapping', () => {
  test('mapping for other DNS providers', () => {
    const { container, getByTestId } = render(
      <TestWrapper>
        <CustomDomainMapping
          formikProps={{ setFieldValue: jest.fn(), values: { dnsProvider: 'route53' } } as unknown as FormikProps<any>}
          hostedZonesList={[]}
          setDNSProvider={jest.fn()}
          setHelpTextSections={jest.fn()}
          setGatewayDetails={jest.fn()}
          gatewayDetails={initialGatewayDetails}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    const others = getByTestId('otherDnsProvider')
    act(() => {
      fireEvent.click(others)
    })

    expect(container).toMatchSnapshot()
  })

  test('mapping for route53 DNS providers', () => {
    const { container } = render(
      <TestWrapper>
        <CustomDomainMapping
          formikProps={{ setFieldValue: jest.fn(), values: { dnsProvider: 'others' } } as unknown as FormikProps<any>}
          hostedZonesList={[]}
          setDNSProvider={jest.fn()}
          setHelpTextSections={jest.fn()}
          setGatewayDetails={jest.fn()}
          gatewayDetails={initialGatewayDetails}
          overrideRoute53={false}
          setOverrideRoute53={jest.fn()}
          domainsToOverlap={[]}
          setDomainsToOverlap={jest.fn()}
        />
      </TestWrapper>
    )

    const route53Option = container.querySelector('input[name="route53RadioBtn"]') as HTMLInputElement
    act(() => {
      fireEvent.click(route53Option)
    })

    expect(container).toMatchSnapshot()
  })
})
