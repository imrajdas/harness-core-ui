import type { QlceViewFieldInputInput } from 'services/ce/services'
import { DEFAULT_COLS, getGridColumnsByGroupBy, LABELS_COLS } from '../Columns'

describe('Test cases for Columns utils', () => {
  test('Should return default columns', () => {
    const groupBy = {
      fieldId: 'gcpProjectId',
      fieldName: 'Project',
      identifier: 'GCP',
      identifierName: 'GCP'
    }
    expect(getGridColumnsByGroupBy(groupBy as QlceViewFieldInputInput, true)).toMatchObject(DEFAULT_COLS)
  })

  test('Should return Label columns', () => {
    const groupBy = {
      fieldId: 'gcpProjectId',
      fieldName: 'Project',
      identifier: 'LABEL',
      identifierName: 'GCP'
    }
    expect(getGridColumnsByGroupBy(groupBy as QlceViewFieldInputInput, true)).toMatchObject(LABELS_COLS)
  })
})
