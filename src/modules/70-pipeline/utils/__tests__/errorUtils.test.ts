/*
 * Copyright 2021 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { getErrorsList } from '@pipeline/utils/errorUtils'

jest.mock('@common/utils/YamlUtils', () => ({
  validateJSONWithSchema: jest.fn(() => Promise.resolve(new Map())),
  useValidationError: () => ({ errorMap: new Map() })
}))

describe('Test errorUtils', () => {
  test('Test getErrorsList method', () => {
    const errors = {
      properties: { ci: { codebase: 'CI Codebase is a required field' } },
      stages: [
        {
          stage: {
            spec: {
              execution: {
                steps: [{ step: { spec: { image: 'Image is a required field', type: 'Type is a required field' } } }]
              }
            }
          }
        }
      ]
    }
    const { errorStrings, errorCount } = getErrorsList(errors)
    expect(errorStrings.length).toBe(3)
    expect(errorCount).toBe(3)
  })
})
