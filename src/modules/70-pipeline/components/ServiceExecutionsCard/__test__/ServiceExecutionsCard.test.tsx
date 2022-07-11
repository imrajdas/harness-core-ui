/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import React from 'react'
import { render } from '@testing-library/react'
import { DashboardSelected, ServiceExecutionsCard, ServiceExecutionsCardProps } from '../ServiceExecutionsCard'

const props: ServiceExecutionsCardProps = {
  envIdentifiers: ['e1', 'e2'],
  serviceIdentifiers: ['s1', 's2'],
  caller: DashboardSelected.SERVICEDETAIL
}

describe('ServiceExecutionsCard ', () => {
  test('initial render', () => {
    const { container } = render(<ServiceExecutionsCard {...props} />)
    expect(container).toMatchSnapshot()
  })
  test('render when called from overview dashboard', () => {
    props.caller = DashboardSelected.OVERVIEW
    props.envIdentifiers = ['e1', 'e2', 'e3', 'e4']
    const { container } = render(<ServiceExecutionsCard {...props} />)
    expect(container).toMatchSnapshot()
  })
  test('empty state', () => {
    props.envIdentifiers = []
    props.serviceIdentifiers = []
    const { container } = render(<ServiceExecutionsCard {...props} />)
    expect(container).toMatchSnapshot()
  })
})
