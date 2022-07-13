import React from 'react'
import { render, screen } from '@testing-library/react'
import UserHint from '../UserHint'

describe('UserHint', () => {
  test('UserHint compoenent renders with correct props', () => {
    render(<UserHint userMessage="test message" dataTestId="userHintTestID" />)

    expect(screen.getByTestId('userHintTestID')).toBeInTheDocument()
    expect(screen.getByText('test message')).toBeInTheDocument()
  })
})
