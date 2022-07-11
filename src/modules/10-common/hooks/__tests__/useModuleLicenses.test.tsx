import * as licenseStoreContextMock from 'framework/LicenseStore/LicenseStoreContext'
import * as moduleMock from '../useModuleInfo'
import { useAnyEnterpriseLicense, useCurrentEnterpriseLicense } from '../useModuleLicenses'

describe('useModuleLicenses tests', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })
  describe('useAnyEnterpriseLicense tests', () => {
    test('should return true when one license is enterprise', () => {
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CI: { edition: 'ENTERPRISE', status: 'ACTIVE' },
          CD: { edition: 'FREE', status: 'ACTIVE' }
        }
      } as any)

      expect(useAnyEnterpriseLicense()).toBe(true)
    })

    test('should return false when no licenses are enterprise', () => {
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CI: { edition: 'FREE', status: 'ACTIVE' },
          CD: { edition: 'FREE', status: 'EXPIRED' }
        }
      } as any)

      expect(useAnyEnterpriseLicense()).toBe(false)
    })
  })

  describe('useCurrentEnterpriseLicense tests', () => {
    test('should return true when current license is enterprise', () => {
      jest.spyOn(moduleMock, 'useModuleInfo').mockReturnValue({
        module: 'cd'
      })
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CD: { edition: 'ENTERPRISE', status: 'ACTIVE' }
        }
      } as any)

      expect(useCurrentEnterpriseLicense()).toBe(true)
    })

    test('should return false when current licenses is not enterprise', () => {
      jest.spyOn(moduleMock, 'useModuleInfo').mockReturnValue({
        module: 'cd'
      })
      jest.spyOn(licenseStoreContextMock, 'useLicenseStore').mockReturnValue({
        licenseInformation: {
          CD: { edition: 'FREE', status: 'ACTIVE' }
        }
      } as any)

      expect(useCurrentEnterpriseLicense()).toBe(false)
    })
  })
})
