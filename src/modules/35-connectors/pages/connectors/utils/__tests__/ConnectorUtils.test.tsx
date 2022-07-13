/*
 * Copyright 2022 Harness Inc. All rights reserved.
 * Use of this source code is governed by the PolyForm Shield 1.0.0 license
 * that can be found in the licenses directory at the root of this repository, also available at
 * https://polyformproject.org/wp-content/uploads/2020/06/PolyForm-Shield-1.0.0.txt.
 */

import { EntityTypes, Connectors } from '@connectors/constants'
import {
  buildAWSPayload,
  buildArtifactoryPayload,
  buildGitPayload,
  removeErrorCode,
  buildKubPayload,
  setupKubFormData,
  setupGithubFormData,
  buildGithubPayload,
  setupAzureKeyVaultFormData,
  buildAzureKeyVaultPayload,
  setupVaultFormData,
  buildVaultPayload,
  getIconByEntityType,
  getReferredEntityLabelByType,
  getConnectorDisplayName,
  getIconByType,
  isSMConnector
} from '../ConnectorUtils'

jest.mock('services/cd-ng', () => ({
  getSecretV2Promise: jest.fn().mockImplementation(() =>
    Promise.resolve({
      data: {
        secret: {
          name: 'secretdevxDDUx'
        }
      }
    })
  )
}))

describe('Connector Utils', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  test(' test buildAWSPayload', () => {
    expect(
      buildAWSPayload({
        name: 'dummyaws',
        description: '',
        identifier: 'dummyaws',
        tags: {},
        delegateType: 'ManualConfig',
        username: 'usename',
        secretKeyRef: { name: 'mysecretappd', identifier: 'mysecretappd', referenceString: 'account.mysecretappd' },
        crossAccountAccess: false,
        accessKey: { type: 'TEXT', value: 'accesskey' }
      })
    ).toEqual({
      connector: {
        name: 'dummyaws',
        description: '',
        orgIdentifier: undefined,
        projectIdentifier: undefined,
        identifier: 'dummyaws',
        tags: {},
        type: 'Aws',
        spec: {
          credential: {
            type: 'ManualConfig',
            spec: { accessKey: 'accesskey', accessKeyRef: undefined, secretKeyRef: 'account.mysecretappd' },
            crossAccountAccess: null
          }
        }
      }
    })
  }),
    test(' test buildArtifactoryPayload', () => {
      expect(
        buildArtifactoryPayload({
          name: 'dummy name',
          description: '',
          identifier: 'dummy_name',
          tags: {},
          artifactoryServerUrl: 'dummyurl',
          authType: 'UsernamePassword',
          username: { type: 'TEXT', value: 'dummyusername' },
          password: { name: 'jkdhkjdhk', identifier: 'jkdhkjdhk', referenceString: 'account.jkdhkjdhk' }
        })
      ).toEqual({
        connector: {
          type: 'Artifactory',
          name: 'dummy name',
          identifier: 'dummy_name',
          description: '',
          tags: {},
          spec: {
            artifactoryServerUrl: 'dummyurl',
            auth: {
              type: 'UsernamePassword',
              spec: { username: 'dummyusername', usernameRef: undefined, passwordRef: 'account.jkdhkjdhk' }
            }
          }
        }
      })
    }),
    test(' test buildGitPayload with ssh', () => {
      expect(
        buildGitPayload({
          name: 'dummy name',
          description: '',
          identifier: 'dummy_name',
          tags: {},
          connectionType: 'Ssh',
          url: 'url',
          urlType: 'Repo',
          connectType: 'Ssh',
          sshKey: { referenceString: 'sshKeyRef' }
        })
      ).toEqual({
        connector: {
          type: 'Git',
          name: 'dummy name',
          identifier: 'dummy_name',
          orgIdentifier: undefined,
          projectIdentifier: undefined,
          description: '',
          tags: {},
          spec: {
            connectionType: 'Repo',
            url: 'url',
            type: 'Ssh',
            spec: {
              sshKeyRef: 'sshKeyRef'
            }
          }
        }
      })
    }),
    test(' test remove error code ', () => {
      expect(
        removeErrorCode([
          {
            message:
              'No eligible delegates could perform the required capabilities for this task: [ dhgjdgk ]↵  -  The capabilities were tested by the following delegates: [ Meenakshi-Raikwar-MBP ]↵  -  Following delegates were validating but never returned: [  ]↵  -  Other delegates (if any) may have been offline or were not eligible due to tag or scope restrictions.',
            reason: ' No Eligible Delegate Found',
            code: 450
          }
        ])
      ).toEqual([
        {
          message:
            'No eligible delegates could perform the required capabilities for this task: [ dhgjdgk ]↵  -  The capabilities were tested by the following delegates: [ Meenakshi-Raikwar-MBP ]↵  -  Following delegates were validating but never returned: [  ]↵  -  Other delegates (if any) may have been offline or were not eligible due to tag or scope restrictions.',
          reason: ' No Eligible Delegate Found'
        }
      ])
    }),
    test(' test buildKubPayload for ManualConfig All auth Type', async () => {
      expect(
        buildKubPayload({
          name: 'K8ManualUserPass',
          description: 'description',
          identifier: 'K8ManualUserPass',
          tags: {},
          delegateType: 'ManualConfig',
          authType: 'UsernamePassword',
          username: { value: 'username', type: 'TEXT' },
          password: { name: 'secretdevxEMfT', identifier: 'secretdevxDDUx', referenceString: 'account.secretdevxDDUx' },
          oidcIssuerUrl: '',
          oidcScopes: '',
          clientKeyAlgo: '',
          delegateSelectors: ['meenakshi-raikwar-mbp'],
          skipDefaultValidation: false,
          usernamefieldType: 'TEXT',
          masterUrl: 'masterurl',
          usernametextField: 'username'
        })
      ).toEqual({
        connector: {
          name: 'K8ManualUserPass',
          description: 'description',
          identifier: 'K8ManualUserPass',
          tags: {},
          type: 'K8sCluster',
          spec: {
            delegateSelectors: ['meenakshi-raikwar-mbp'],
            credential: {
              type: 'ManualConfig',
              spec: {
                masterUrl: 'masterurl',
                auth: {
                  type: 'UsernamePassword',
                  spec: { username: 'username', passwordRef: 'account.secretdevxDDUx' }
                }
              }
            }
          }
        }
      })

      expect(
        buildKubPayload({
          name: 'K8ManualServiceToken',
          identifier: 'K8ManualUserPass',
          description: 'description',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'K8sCluster',
          delegateType: 'ManualConfig',
          delegateName: '',
          masterUrl: 'masterurl',
          authType: 'ServiceAccount',
          skipDefaultValidation: false,
          username: { value: 'username', type: 'TEXT' },
          password: {
            identifier: 'secretdevxDDUx',
            name: 'secretdevxEMfT',
            referenceString: 'account.secretdevxDDUx',
            accountIdentifier: 'accountId'
          },
          serviceAccountToken: {
            name: 'secretdevxEMfT',
            identifier: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx'
          },
          usernamefieldType: 'TEXT',
          usernametextField: 'username',
          delegateSelectors: []
        })
      ).toEqual({
        connector: {
          name: 'K8ManualServiceToken',
          description: 'description',
          projectIdentifier: null,
          orgIdentifier: null,
          identifier: 'K8ManualUserPass',
          tags: {},
          type: 'K8sCluster',
          spec: {
            delegateSelectors: [],
            credential: {
              type: 'ManualConfig',
              spec: {
                masterUrl: 'masterurl',
                auth: { type: 'ServiceAccount', spec: { serviceAccountTokenRef: 'account.secretdevxDDUx' } }
              }
            }
          }
        }
      })
      expect(
        buildKubPayload({
          name: 'K8ManualOIDC',
          identifier: 'K8ManualUserPass',
          description: 'description',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'K8sCluster',
          delegateType: 'ManualConfig',
          delegateName: '',
          masterUrl: 'masterurl',
          authType: 'OpenIdConnect',
          skipDefaultValidation: false,
          oidcIssuerUrl: 'oidc url',
          oidcPassword: {
            name: 'secretdevxEMfT',
            identifier: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx'
          },
          oidcCleintId: {
            name: 'secretdevxEMfT',
            identifier: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx'
          },
          oidcCleintSecret: {
            name: 'secretdevxEMfT',
            identifier: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx'
          },
          oidcScopes: 'scope',
          oidcUsernamefieldType: 'TEXT',
          oidcUsernametextField: 'username',
          oidcUsername: { value: 'username', type: 'TEXT' },
          delegateSelectors: []
        })
      ).toEqual({
        connector: {
          name: 'K8ManualOIDC',
          description: 'description',
          projectIdentifier: null,
          orgIdentifier: null,
          identifier: 'K8ManualUserPass',
          tags: {},
          type: 'K8sCluster',
          spec: {
            delegateSelectors: [],
            credential: {
              type: 'ManualConfig',
              spec: {
                masterUrl: 'masterurl',
                auth: {
                  type: 'OpenIdConnect',
                  spec: {
                    oidcIssuerUrl: 'oidc url',
                    oidcUsername: 'username',
                    oidcPasswordRef: 'account.secretdevxDDUx',
                    oidcClientIdRef: 'account.secretdevxDDUx',
                    oidcSecretRef: 'account.secretdevxDDUx',
                    oidcScopes: 'scope'
                  }
                }
              }
            }
          }
        }
      })
      expect(
        buildKubPayload({
          name: 'K8ManualClientId',
          identifier: 'K8ManualUserPass',
          description: 'description',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'K8sCluster',
          delegateType: 'ManualConfig',
          delegateName: '',
          masterUrl: 'masterurl',
          authType: 'ClientKeyCert',
          skipDefaultValidation: false,
          clientKey: {
            name: 'secretdevxEMfT',
            identifier: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx'
          },
          clientKeyCertificate: {
            name: 'secretdevxEMfT',
            identifier: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx'
          },
          clientKeyPassphrase: {
            name: 'secretdevxEMfT',
            identifier: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx'
          },
          clientKeyCACertificate: {
            name: 'secretdevxEMfT',
            identifier: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx'
          },
          clientKeyAlgo: 'key algo',

          delegateSelectors: []
        })
      ).toEqual({
        connector: {
          name: 'K8ManualClientId',
          description: 'description',
          projectIdentifier: null,
          orgIdentifier: null,
          identifier: 'K8ManualUserPass',
          tags: {},
          type: 'K8sCluster',
          spec: {
            delegateSelectors: [],
            credential: {
              type: 'ManualConfig',
              spec: {
                masterUrl: 'masterurl',
                auth: {
                  type: 'ClientKeyCert',
                  spec: {
                    clientKeyRef: 'account.secretdevxDDUx',
                    clientCertRef: 'account.secretdevxDDUx',
                    clientKeyPassphraseRef: 'account.secretdevxDDUx',
                    caCertRef: 'account.secretdevxDDUx',
                    clientKeyAlgo: 'key algo'
                  }
                }
              }
            }
          }
        }
      })
    }),
    test('test setupKubFormData', () => {
      expect(
        setupKubFormData(
          {
            name: 'K8ManualClientId',
            identifier: 'K8ManualUserPass',
            description: 'description',
            tags: {},
            type: 'K8sCluster',
            spec: {
              credential: {
                type: 'ManualConfig',
                spec: {
                  masterUrl: 'masterurl',
                  auth: {
                    type: 'ClientKeyCert',
                    spec: {
                      caCertRef: 'account.secretdevxDDUx',
                      clientCertRef: 'account.secretdevxDDUx',
                      clientKeyRef: 'account.secretdevxDDUx',
                      clientKeyPassphraseRef: 'account.secretdevxDDUx',
                      clientKeyAlgo: 'key algo'
                    }
                  }
                }
              },
              delegateSelectors: []
            }
          },
          'accountId'
        )
      ).resolves.toEqual({
        delegateType: 'ManualConfig',
        delegateName: '',
        masterUrl: 'masterurl',
        authType: 'ClientKeyCert',
        skipDefaultValidation: false,
        clientKey: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: 'accountId'
        },
        clientKeyCertificate: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: 'accountId'
        },
        clientKeyPassphrase: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: 'accountId'
        },
        clientKeyCACertificate: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: 'accountId'
        },
        clientKeyAlgo: 'key algo'
      })

      expect(
        setupKubFormData(
          {
            name: 'K8ManualOIDC',
            identifier: 'K8ManualUserPass',
            description: 'description',
            tags: {},
            type: 'K8sCluster',
            spec: {
              credential: {
                type: 'ManualConfig',
                spec: {
                  masterUrl: 'masterurl',
                  auth: {
                    type: 'OpenIdConnect',
                    spec: {
                      oidcIssuerUrl: 'url',
                      oidcUsername: 'username',
                      oidcUsernameRef: null,
                      oidcClientIdRef: 'account.secretdevxDDUx',
                      oidcPasswordRef: 'account.secretdevxDDUx',
                      oidcSecretRef: 'account.secretdevxDDUx',
                      oidcScopes: 'scope'
                    }
                  }
                }
              },
              delegateSelectors: []
            }
          },
          'accountId'
        )
      ).resolves.toEqual({
        delegateType: 'ManualConfig',
        delegateName: '',
        masterUrl: 'masterurl',
        authType: 'OpenIdConnect',
        skipDefaultValidation: false,
        oidcIssuerUrl: 'url',
        oidcUsername: { value: 'username', type: 'TEXT' },
        oidcPassword: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: 'accountId'
        },
        oidcCleintId: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: 'accountId'
        },
        oidcCleintSecret: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: 'accountId'
        },
        oidcScopes: 'scope'
      })

      expect(
        setupKubFormData(
          {
            name: 'K8Manualservice',
            identifier: 'K8ManualUserPass',
            description: 'description',
            tags: {},
            type: 'K8sCluster',
            spec: {
              credential: {
                type: 'ManualConfig',
                spec: {
                  masterUrl: 'masterurl',
                  auth: { type: 'ServiceAccount', spec: { serviceAccountTokenRef: 'account.secretdevxDDUx' } }
                }
              },
              delegateSelectors: ['meenakshi-raikwar-mbp']
            }
          },
          'accountId'
        )
      ).resolves.toEqual({
        delegateType: 'ManualConfig',
        delegateName: '',
        masterUrl: 'masterurl',
        authType: 'ServiceAccount',
        skipDefaultValidation: false,
        serviceAccountToken: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: 'accountId'
        }
      })
    }),
    test('test setupGithubFormData', () => {
      expect(
        setupGithubFormData(
          {
            name: 'NG - P024',
            identifier: 'NG_P024',
            description: '',
            tags: {},
            type: 'Github',
            spec: {
              url: 'https://github.com/wings-software',
              validationRepo: 'https://github.com/wings-software/nextgenui',
              authentication: {
                type: 'Http',
                spec: {
                  type: 'UsernameToken',
                  spec: {
                    username: 'username',
                    usernameRef: null,
                    tokenRef: 'account.secretdevxDDUx'
                  }
                }
              },
              apiAccess: {
                type: 'Token',
                spec: {
                  tokenRef: 'account.secretdevxDDUx'
                }
              },
              delegateSelectors: [],
              type: 'Account'
            }
          },
          'accountId'
        )
      ).resolves.toEqual({
        authType: 'UsernameToken',
        username: {
          type: 'TEXT',
          value: 'username'
        },
        accessToken: {
          accountIdentifier: 'accountId',
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx'
        },
        enableAPIAccess: true,
        apiAccessToken: {
          accountIdentifier: 'accountId',
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx'
        },
        apiAuthType: 'Token',
        connectivityMode: 'Delegate'
      })

      expect(
        setupGithubFormData(
          {
            name: 'SSH - P024',
            identifier: 'SSH_P024',
            description: '',
            tags: {},
            type: 'Github',
            spec: {
              url: 'git@github.com:wings-software/nextgenui.git',
              validationRepo: null,
              authentication: {
                type: 'Ssh',
                spec: {
                  sshKeyRef: 'account.secret_p024_ssh_password'
                }
              },
              apiAccess: null,
              delegateSelectors: [],
              type: 'Repo'
            }
          },
          'accountId'
        )
      ).resolves.toEqual({
        sshKey: {
          accountIdentifier: 'accountId',
          identifier: 'secret_p024_ssh_password',
          name: 'secretdevxDDUx',
          referenceString: 'account.secret_p024_ssh_password'
        },
        enableAPIAccess: false,
        connectivityMode: 'Delegate'
      })
    }),
    test('test buildGithubPayload', () => {
      expect(
        buildGithubPayload({
          name: 'SSH - P024',
          identifier: 'SSH_P024',
          description: '',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'Github',
          urlType: 'Repo',
          url: 'git@github.com:wings-software/nextgenui.git',
          validationRepo: null,
          connectionType: 'Ssh',
          sshKey: {
            identifier: 'secretdevxDDUx',
            name: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx',
            accountIdentifier: 'zEaak-FLS425IEO7OLzMUg'
          },
          enableAPIAccess: false,
          delegateSelectors: []
        })
      ).toEqual({
        connector: {
          name: 'SSH - P024',
          description: '',
          projectIdentifier: null,
          orgIdentifier: null,
          identifier: 'SSH_P024',
          tags: {},
          type: 'Github',
          spec: {
            delegateSelectors: [],
            executeOnDelegate: true,
            type: 'Repo',
            url: 'git@github.com:wings-software/nextgenui.git',
            authentication: {
              type: 'Ssh',
              spec: {
                sshKeyRef: 'account.secretdevxDDUx'
              }
            }
          }
        }
      })

      expect(
        buildGithubPayload({
          name: 'NG - P024',
          identifier: 'NG_P024',
          description: '',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'Github',
          urlType: 'Account',
          url: 'https://github.com/wings-software',
          validationRepo: 'https://github.com/wings-software/nextgenui',
          connectionType: 'Http',
          authType: 'UsernameToken',
          username: {
            value: 'username',
            type: 'TEXT'
          },
          accessToken: {
            identifier: 'secretdevxDDUx',
            name: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx',
            accountIdentifier: 'zEaak-FLS425IEO7OLzMUg'
          },
          apiAccessToken: {
            identifier: 'secretdevxDDUx',
            name: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx',
            accountIdentifier: 'zEaak-FLS425IEO7OLzMUg'
          },
          enableAPIAccess: true,
          apiAuthType: 'Token',
          usernamefieldType: 'TEXT',
          usernametextField: 'username',
          delegateSelectors: []
        })
      ).toEqual({
        connector: {
          name: 'NG - P024',
          description: '',
          projectIdentifier: null,
          orgIdentifier: null,
          identifier: 'NG_P024',
          tags: {},
          type: 'Github',
          spec: {
            delegateSelectors: [],
            executeOnDelegate: true,
            type: 'Account',
            url: 'https://github.com/wings-software',
            validationRepo: 'https://github.com/wings-software/nextgenui',
            authentication: {
              type: 'Http',
              spec: {
                type: 'UsernameToken',
                spec: {
                  username: 'username',
                  tokenRef: 'account.secretdevxDDUx'
                }
              }
            },
            apiAccess: {
              type: 'Token',
              spec: {
                tokenRef: 'account.secretdevxDDUx'
              }
            }
          }
        }
      })
    }),
    test('test setupAzureKeyVaultFormData', () => {
      expect(
        setupAzureKeyVaultFormData(
          {
            name: 'Vault 2 - P024',
            identifier: 'Vault_2_P024',
            description: '',
            tags: {},
            type: 'AzureKeyVault',
            spec: {
              clientId: '123',
              secretKey: 'account.secretdevxDDUx',
              tenantId: '123',
              vaultName: 'Aman-test',
              subscription: '123',
              delegateSelectors: [],
              default: false
            }
          },
          ''
        )
      ).resolves.toEqual({
        clientId: '123',
        secretKey: {
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx',
          accountIdentifier: ''
        },
        tenantId: '123',
        subscription: '123',
        default: false
      })
    }),
    test('test buildAzureKeyVaultPayload', () => {
      expect(
        buildAzureKeyVaultPayload({
          name: 'Vault 2 - P024',
          identifier: 'Vault_2_P024',
          description: '',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'AzureKeyVault',
          clientId: '123',
          secretKey: {
            identifier: 'secretdevxDDUx',
            name: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx',
            accountIdentifier: 'zEaak-FLS425IEO7OLzMUg'
          },
          tenantId: '123',
          subscription: '123',
          default: false,
          delegateSelectors: [],
          vaultName: 'Aman-test'
        })
      ).toEqual({
        connector: {
          name: 'Vault 2 - P024',
          description: '',
          projectIdentifier: null,
          identifier: 'Vault_2_P024',
          orgIdentifier: null,
          tags: {},
          type: 'AzureKeyVault',
          spec: {
            clientId: '123',
            tenantId: '123',
            default: false,
            subscription: '123',
            vaultName: 'Aman-test',
            delegateSelectors: [],
            secretKey: 'account.secretdevxDDUx'
          }
        }
      })
    }),
    test('test setupVaultFormData', () => {
      expect(
        setupVaultFormData(
          {
            name: 'Vault 1 - P024',
            identifier: 'Vault_1_P024',
            description: '',
            tags: {},
            type: 'Vault',
            spec: {
              authToken: 'account.secretdevxDDUx',
              basePath: '/harness',
              vaultUrl: 'https://vaultqa.harness.io',
              renewalIntervalMinutes: 10,
              secretEngineManuallyConfigured: false,
              secretEngineName: 'harness',
              secretId: null,
              secretEngineVersion: 2,
              delegateSelectors: [],
              default: false,
              accessType: 'TOKEN',
              readOnly: false
            }
          },
          'accountId'
        )
      ).resolves.toEqual({
        vaultUrl: 'https://vaultqa.harness.io',
        basePath: '/harness',
        readOnly: false,
        default: false,
        accessType: 'TOKEN',
        appRoleId: '',
        authToken: {
          accountIdentifier: 'accountId',
          identifier: 'secretdevxDDUx',
          name: 'secretdevxDDUx',
          referenceString: 'account.secretdevxDDUx'
        },
        sinkPath: '',
        renewalIntervalMinutes: 10,
        awsRegion: undefined,
        namespace: undefined,
        secretId: undefined,
        k8sAuthEndpoint: '',
        serviceAccountTokenPath: '',
        useAwsIam: undefined,
        useK8sAuth: undefined,
        vaultAwsIamRole: undefined,
        vaultK8sAuthRole: '',
        xvaultAwsIamServerId: undefined
      })
    }),
    test('test buildVaultPayload', () => {
      expect(
        buildVaultPayload({
          name: 'Vault 1 - P024',
          identifier: 'Vault_1_P024',
          description: '',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'Vault',
          vaultUrl: 'https://vaultqa.harness.io',
          basePath: '/harness',
          readOnly: false,
          default: false,
          accessType: 'TOKEN',
          appRoleId: '',
          authToken: {
            identifier: 'secretdevxDDUx',
            name: 'secretdevxDDUx',
            referenceString: 'account.secretdevxDDUx',
            accountIdentifier: 'zEaak-FLS425IEO7OLzMUg'
          },
          renewalIntervalMinutes: 10,
          delegateSelectors: [],
          secretEngine: 'harness@@@2',
          engineType: 'fetch',
          secretEngineName: 'harness',
          secretEngineVersion: 2
        })
      ).toEqual({
        connector: {
          name: 'Vault 1 - P024',
          description: '',
          projectIdentifier: null,
          identifier: 'Vault_1_P024',
          orgIdentifier: null,
          tags: {},
          type: 'Vault',
          spec: {
            basePath: '/harness',
            vaultUrl: 'https://vaultqa.harness.io',
            readOnly: false,
            default: false,
            delegateSelectors: [],
            xvaultAwsIamServerId: undefined,
            useAwsIam: false,
            renewalIntervalMinutes: 10,
            authToken: 'account.secretdevxDDUx',
            appRoleId: undefined,
            secretId: undefined,
            useVaultAgent: false,
            sinkPath: undefined,
            secretEngineManuallyConfigured: false,
            secretEngineName: 'harness',
            secretEngineVersion: '2',
            vaultK8sAuthRole: undefined,
            k8sAuthEndpoint: undefined,
            serviceAccountTokenPath: undefined,
            useK8sAuth: false
          }
        }
      })
    }),
    test('test setupVaultFormData', () => {
      expect(
        setupVaultFormData(
          {
            name: 'Vault 2',
            identifier: 'Vault_2',
            description: '',
            tags: {},
            type: 'Vault',
            spec: {
              basePath: '/harness',
              vaultUrl: 'https://vaultqa.harness.io',
              renewalIntervalMinutes: 10,
              secretEngineManuallyConfigured: false,
              secretEngineName: 'harness',
              secretId: null,
              secretEngineVersion: 2,
              delegateSelectors: [],
              default: false,
              accessType: 'K8s_AUTH',
              useK8sAuth: true,
              k8sAuthEndpoint: 'dummy/k8s/login',
              serviceAccountTokenPath: 'dummy/serviceaccount/token/path',
              vaultK8sAuthRole: 'dummyRole',
              readOnly: false
            }
          },
          'accountId'
        )
      ).resolves.toEqual({
        vaultUrl: 'https://vaultqa.harness.io',
        basePath: '/harness',
        readOnly: false,
        default: false,
        authToken: undefined,
        accessType: 'K8s_AUTH',
        appRoleId: '',
        sinkPath: '',
        renewalIntervalMinutes: 10,
        awsRegion: undefined,
        namespace: undefined,
        secretId: undefined,
        k8sAuthEndpoint: 'dummy/k8s/login',
        serviceAccountTokenPath: 'dummy/serviceaccount/token/path',
        useAwsIam: undefined,
        useK8sAuth: true,
        vaultAwsIamRole: undefined,
        vaultK8sAuthRole: 'dummyRole',
        xvaultAwsIamServerId: undefined
      })
    }),
    test('test buildVaultPayload', () => {
      expect(
        buildVaultPayload({
          name: 'Vault 2',
          identifier: 'Vault_2',
          description: '',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'Vault',
          vaultUrl: 'https://vaultqa.harness.io',
          basePath: '/harness',
          readOnly: false,
          default: false,
          accessType: 'K8s_AUTH',
          appRoleId: '',
          useK8sAuth: true,
          k8sAuthEndpoint: 'dummy/k8s/login',
          serviceAccountTokenPath: 'dummy/serviceaccount/token/path',
          vaultK8sAuthRole: 'dummyRole',
          renewalIntervalMinutes: 10,
          delegateSelectors: [],
          secretEngine: 'harness@@@2',
          engineType: 'fetch',
          secretEngineName: 'harness',
          secretEngineVersion: 2
        })
      ).toEqual({
        connector: {
          name: 'Vault 2',
          description: '',
          projectIdentifier: null,
          identifier: 'Vault_2',
          orgIdentifier: null,
          tags: {},
          type: 'Vault',
          spec: {
            basePath: '/harness',
            vaultUrl: 'https://vaultqa.harness.io',
            readOnly: false,
            default: false,
            delegateSelectors: [],
            xvaultAwsIamServerId: undefined,
            useAwsIam: false,
            renewalIntervalMinutes: 10,
            authToken: undefined,
            appRoleId: undefined,
            secretId: undefined,
            useVaultAgent: false,
            sinkPath: undefined,
            secretEngineManuallyConfigured: false,
            secretEngineName: 'harness',
            secretEngineVersion: '2',
            vaultK8sAuthRole: 'dummyRole',
            k8sAuthEndpoint: 'dummy/k8s/login',
            serviceAccountTokenPath: 'dummy/serviceaccount/token/path',
            useK8sAuth: true
          }
        }
      })
    }),
    test('test buildVaultPayload_withNullAsK8sAuthEndpoint', () => {
      expect(
        buildVaultPayload({
          name: 'Vault 3',
          identifier: 'Vault_3',
          description: '',
          orgIdentifier: null,
          projectIdentifier: null,
          tags: {},
          type: 'Vault',
          vaultUrl: 'https://vaultqa.harness.io',
          basePath: '/harness',
          readOnly: false,
          default: false,
          accessType: 'K8s_AUTH',
          appRoleId: '',
          useK8sAuth: true,
          k8sAuthEndpoint: null,
          serviceAccountTokenPath: 'dummy/serviceaccount/token/path',
          vaultK8sAuthRole: 'dummyRole',
          renewalIntervalMinutes: 10,
          delegateSelectors: [],
          secretEngine: 'harness@@@2',
          engineType: 'fetch',
          secretEngineName: 'harness',
          secretEngineVersion: 2
        })
      ).toEqual({
        connector: {
          name: 'Vault 3',
          description: '',
          projectIdentifier: null,
          identifier: 'Vault_3',
          orgIdentifier: null,
          tags: {},
          type: 'Vault',
          spec: {
            basePath: '/harness',
            vaultUrl: 'https://vaultqa.harness.io',
            readOnly: false,
            default: false,
            delegateSelectors: [],
            xvaultAwsIamServerId: undefined,
            useAwsIam: false,
            renewalIntervalMinutes: 10,
            authToken: undefined,
            appRoleId: undefined,
            secretId: undefined,
            useVaultAgent: false,
            sinkPath: undefined,
            secretEngineManuallyConfigured: false,
            secretEngineName: 'harness',
            secretEngineVersion: '2',
            vaultK8sAuthRole: 'dummyRole',
            k8sAuthEndpoint: null,
            serviceAccountTokenPath: 'dummy/serviceaccount/token/path',
            useK8sAuth: true
          }
        }
      })
    }),
    test('test getIconByEntityType', () => {
      expect(getIconByEntityType(EntityTypes.PROJECT as string)).toEqual('nav-project')
      expect(getIconByEntityType(EntityTypes.PIPELINE as string)).toEqual('pipeline')
      expect(getIconByEntityType(EntityTypes.SECRET as string)).toEqual('key-main')
      expect(getIconByEntityType(EntityTypes.CV_CONFIG as string)).toEqual('desktop')
      expect(getIconByEntityType(EntityTypes.CV_K8_ACTIVITY_SOURCE as string)).toEqual('square')
      expect(getIconByEntityType(EntityTypes.CV_VERIFICATION_JOB as string)).toEqual('confirm')
      expect(getIconByEntityType(EntityTypes.default as string)).toEqual('')
    }),
    test('test getReferredEntityLabelByType', () => {
      expect(getReferredEntityLabelByType(EntityTypes.PROJECT as string)).toEqual('Project')
      expect(getReferredEntityLabelByType(EntityTypes.PIPELINE as string)).toEqual('Pipeline')
      expect(getReferredEntityLabelByType(EntityTypes.SECRET as string)).toEqual('Secret')
      expect(getReferredEntityLabelByType(EntityTypes.CV_CONFIG as string)).toEqual('Monitoring Source')
      expect(getReferredEntityLabelByType(EntityTypes.CV_K8_ACTIVITY_SOURCE as string)).toEqual('Change Source')
      expect(getReferredEntityLabelByType(EntityTypes.CV_VERIFICATION_JOB as string)).toEqual('Verification Job')
      expect(getReferredEntityLabelByType(EntityTypes.default as string)).toEqual('')
    }),
    test('test getConnectorDisplayName', () => {
      expect(getConnectorDisplayName(Connectors.KUBERNETES_CLUSTER)).toEqual('Kubernetes cluster')
      expect(getConnectorDisplayName(Connectors.GIT)).toEqual('Git')
      expect(getConnectorDisplayName(Connectors.GITHUB)).toEqual('GitHub')
      expect(getConnectorDisplayName(Connectors.GITLAB)).toEqual('GitLab')
      expect(getConnectorDisplayName(Connectors.BITBUCKET)).toEqual('Bitbucket')
      expect(getConnectorDisplayName(Connectors.DOCKER)).toEqual('Docker Registry')
      expect(getConnectorDisplayName(Connectors.GCP)).toEqual('GCP')
      expect(getConnectorDisplayName(Connectors.APP_DYNAMICS)).toEqual('AppDynamics')
      expect(getConnectorDisplayName(Connectors.SPLUNK)).toEqual('Splunk')
      expect(getConnectorDisplayName(Connectors.NEW_RELIC)).toEqual('New Relic')
      expect(getConnectorDisplayName(Connectors.PROMETHEUS)).toEqual('Prometheus')
      expect(getConnectorDisplayName(Connectors.AWS)).toEqual('AWS')
      expect(getConnectorDisplayName(Connectors.AWS_CODECOMMIT)).toEqual('AWS CodeCommit')
      expect(getConnectorDisplayName(Connectors.NEXUS)).toEqual('Nexus')
      expect(getConnectorDisplayName(Connectors.LOCAL)).toEqual('Local Secret Manager')
      expect(getConnectorDisplayName(Connectors.VAULT)).toEqual('HashiCorp Vault')
      expect(getConnectorDisplayName(Connectors.GCP_KMS)).toEqual('GCP KMS')
      expect(getConnectorDisplayName(Connectors.HttpHelmRepo)).toEqual('HTTP Helm Repo')
      expect(getConnectorDisplayName(Connectors.AWS_KMS)).toEqual('AWS KMS')
      expect(getConnectorDisplayName(Connectors.AZURE_KEY_VAULT)).toEqual('Azure Key Vault')
      expect(getConnectorDisplayName(Connectors.DYNATRACE)).toEqual('Dynatrace')
      expect(getConnectorDisplayName(Connectors.CEAWS)).toEqual('AWS')
      expect(getConnectorDisplayName(Connectors.AWS_SECRET_MANAGER)).toEqual('AWS Secrets Manager')
      expect(getConnectorDisplayName(Connectors.CE_AZURE)).toEqual('Azure')
      expect(getConnectorDisplayName(Connectors.CE_KUBERNETES)).toEqual('Kubernetes')
      expect(getConnectorDisplayName(Connectors.CE_GCP)).toEqual('GCP')
      expect(getConnectorDisplayName('')).toEqual('')
    }),
    test('test getIconByType', () => {
      expect(getIconByType(Connectors.KUBERNETES_CLUSTER)).toEqual('service-kubernetes')
      expect(getIconByType(Connectors.GIT)).toEqual('service-github')
      expect(getIconByType(Connectors.HttpHelmRepo)).toEqual('service-helm')
      expect(getIconByType(Connectors.GITHUB)).toEqual('github')
      expect(getIconByType(Connectors.GITLAB)).toEqual('service-gotlab')
      expect(getIconByType(Connectors.BITBUCKET)).toEqual('bitbucket-selected')
      expect(getIconByType(Connectors.VAULT)).toEqual('hashiCorpVault')
      expect(getIconByType(Connectors.LOCAL)).toEqual('secret-manager')
      expect(getIconByType(Connectors.APP_DYNAMICS)).toEqual('service-appdynamics')
      expect(getIconByType(Connectors.SPLUNK)).toEqual('service-splunk')
      expect(getIconByType(Connectors.NEW_RELIC)).toEqual('service-newrelic')
      expect(getIconByType(Connectors.PROMETHEUS)).toEqual('service-prometheus')
      expect(getIconByType(Connectors.DOCKER)).toEqual('service-dockerhub')
      expect(getIconByType(Connectors.AWS)).toEqual('service-aws')
      expect(getIconByType(Connectors.CEAWS)).toEqual('service-aws')
      expect(getIconByType(Connectors.AWS_CODECOMMIT)).toEqual('service-aws-code-deploy')
      expect(getIconByType(Connectors.NEXUS)).toEqual('service-nexus')
      expect(getIconByType(Connectors.ARTIFACTORY)).toEqual('service-artifactory')
      expect(getIconByType(Connectors.GCP)).toEqual('service-gcp')
      expect(getIconByType(Connectors.Jira)).toEqual('service-jira')
      expect(getIconByType(Connectors.AWS_KMS)).toEqual('aws-kms')
      expect(getIconByType(Connectors.AWS_SECRET_MANAGER)).toEqual('aws-secret-manager')
      expect(getIconByType(Connectors.CE_AZURE)).toEqual('service-azure')
      expect(getIconByType(Connectors.DATADOG)).toEqual('service-datadog')
      expect(getIconByType(Connectors.SUMOLOGIC)).toEqual('service-sumologic')
      expect(getIconByType(Connectors.AZURE_KEY_VAULT)).toEqual('azure-key-vault')
      expect(getIconByType(Connectors.DYNATRACE)).toEqual('service-dynatrace')
      expect(getIconByType(Connectors.CE_KUBERNETES)).toEqual('service-kubernetes')
      expect(getIconByType(Connectors.CE_GCP)).toEqual('service-gcp')
      expect(getIconByType(Connectors.PAGER_DUTY)).toEqual('service-pagerduty')
    }),
    test('test isSMConnector', () => {
      expect(isSMConnector('AwsSecretManager')).toBeTruthy()
      expect(isSMConnector()).toBeUndefined()
    })
})
