import {
  accountConnectorTestConnection,
  accountResourceConnectors,
  ceConnectorOverviewSave,
  connectorsCatalogueAPI,
  getGcpPermissions
} from '../../support/35-connectors/constants'
import { featureFlagsCall, pageHeaderClassName } from '../../support/70-pipeline/constants'

describe('CE GCP Connector', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })

    cy.fixture('api/users/feature-flags/accountId').then(featureFlagsData => {
      const chooseGcpRequirements = ['CE_AS_GCP_VM_SUPPORT']

      const updatedFeatureFlagsList = featureFlagsData.resource.reduce((acc, currentFlagData) => {
        if (chooseGcpRequirements.includes(currentFlagData.name)) {
          acc.push({
            uuid: null,
            name: currentFlagData.name,
            enabled: true,
            lastUpdatedAt: 0
          })
          return acc
        }

        acc.push(currentFlagData)
        return acc
      }, [])

      cy.intercept('GET', featureFlagsCall, {
        ...featureFlagsData,
        resource: updatedFeatureFlagsList
      })
    })

    cy.initializeRoute()
    cy.visit(accountResourceConnectors, {
      timeout: 30000
    })
  })

  it('Create CE GCP connector', () => {
    cy.intercept('GET', connectorsCatalogueAPI, { fixture: 'ng/api/connectors/catalogue.json' }).as(
      'connectorsCatalogue'
    )
    cy.intercept('POST', ceConnectorOverviewSave, { fixture: '/ng/api/connectors/CEConnectors/connectorList.json' }).as(
      'connectorsList'
    )
    cy.intercept('GET', getGcpPermissions, { fixture: 'ng/api/connectors/CEConnectors/getGcpPermission.json' }).as(
      'getGcpPermission'
    )
    cy.intercept('POST', accountConnectorTestConnection, { fixture: '/ng/api/connectors/testConnection.json' }).as(
      'testConnection'
    )

    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@connectorsCatalogue')

    cy.contains('p', 'There are no connectors in your project').should('be.visible')
    cy.contains('span', 'Create a Connector').should('be.visible')
    cy.contains('span', 'Create a Connector').click()

    cy.get('[data-cy="Cloud Costs_GCP"]').click()
    cy.contains('span', 'GCP Connector').should('be.visible')

    // Overview step
    cy.get('[data-cy="gcp-overview"]').should('be.visible')
    cy.fillName('testConnector')
    cy.fillField('projectId', 'durable-circle-282815')
    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Connector Description')
    cy.contains('textarea', 'Test Connector Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('connTag').type('{enter}')
    cy.contains('span', 'connTag').should('be.visible')

    cy.contains('span', 'Continue').click()
    cy.wait('@connectorsList')

    // Billing exports step
    cy.contains('p', 'Setup Billing Export').should('be.visible')
    cy.fillField('datasetId', 'bill_test_doc')
    cy.fillField('tableId', 'gcp_billing_export_v1_014665_7E972A_C61BCD')
    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    // Choose Requirements step
    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    // Grant permission step
    cy.contains('p', 'Grant Permissions').should('be.visible')
    cy.contains('span', 'Continue').click()
    cy.wait('@getGcpPermission')
    cy.wait(1000)

    // Test Connection step
    cy.wait('@testConnection')

    cy.wait(1000)
    cy.contains('p', 'Verification successful').should('be.visible')
    cy.contains('span', 'Finish').click()
  })
})
