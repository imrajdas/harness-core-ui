import {
  accountResourceConnectors,
  connectorsCatalogueAPI,
  accountConnectorTestConnection
} from '../../support/35-connectors/constants'
import { pageHeaderClassName } from '../../support/70-pipeline/constants'

describe('CE Azure Connector', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.visit(accountResourceConnectors, {
      timeout: 30000
    })
  })

  it('Create CE Azure connector', () => {
    cy.intercept('GET', connectorsCatalogueAPI, { fixture: 'ng/api/connectors/catalogue.json' }).as(
      'connectorsCatalogue'
    )
    cy.intercept('POST', accountConnectorTestConnection, { fixture: '/ng/api/connectors/testConnection.json' }).as(
      'testConnection'
    )

    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@connectorsCatalogue')

    cy.contains('p', 'There are no connectors in your project').should('be.visible')
    cy.contains('span', 'Create a Connector').should('be.visible')
    cy.contains('span', 'Create a Connector').click()

    cy.get('[data-cy="Cloud Costs_Azure"]').click()
    cy.contains('span', 'Azure Connector').should('be.visible')

    // Overview step
    cy.get('[data-cy="azure-overview"]').should('be.visible')
    cy.fillName('testConnector')
    cy.fillField('tenantId', '902ce9bd-e39e-4972-8a0c-5a4e39b96bd8')
    cy.fillField('subscriptionId', '2b7651d4-7034-4af5-ab7d-c53f98d69afa')
    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Connector Description')
    cy.contains('textarea', 'Test Connector Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('connTag').type('{enter}')
    cy.contains('span', 'connTag').should('be.visible')

    cy.contains('span', 'Continue').click()

    // Billing exports step
    cy.contains('p', 'Azure Billing Exports').should('be.visible')
    cy.fillField('storageAccountName', 'cesrcbillingstoragedev')
    cy.fillField('subscriptionId', '2b7651d4-7034-4af5-ab7d-c53f98d69afa')
    cy.fillField('containerName', 'cesrcbillingcontainerdev')
    cy.fillField('directoryName', 'billingdirectory')
    cy.fillField('reportName', 'billingreport')
    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    // Choose required features step
    cy.contains('p', 'Choose Requirements').should('be.visible')
    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    // Create Service Principal step
    cy.contains('p', 'Create Service Principal').should('be.visible')
    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    // Test Connection step
    cy.wait('@testConnection')

    cy.wait(1000)
    cy.contains('p', 'Verification successful').should('be.visible')
    cy.contains('span', 'Finish').click()
  })
})
