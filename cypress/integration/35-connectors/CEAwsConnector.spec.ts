import {
  accountConnectorTestConnection,
  accountResourceConnectors,
  ceAWSConnectionData,
  ceConnectorOverviewSave,
  connectorsCatalogueAPI
} from '../../support/35-connectors/constants'
import { pageHeaderClassName } from '../../support/70-pipeline/constants'

describe('CE AWS Connector', () => {
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

  it('Create CE AWS connector', () => {
    cy.intercept('GET', connectorsCatalogueAPI, { fixture: 'ng/api/connectors/catalogue.json' }).as(
      'connectorsCatalogue'
    )
    cy.intercept('POST', ceConnectorOverviewSave, { fixture: '/ng/api/connectors/CEConnectors/connectorList.json' }).as(
      'connectorsList'
    )
    cy.intercept('GET', ceAWSConnectionData, { fixture: '/ng/api/connectors/CEConnectors/connectionData.json' }).as(
      'connectionDetails'
    )
    cy.intercept('POST', accountConnectorTestConnection, { fixture: '/ng/api/connectors/testConnection.json' }).as(
      'testConnection'
    )

    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@connectorsCatalogue')

    cy.contains('p', 'There are no connectors in your project').should('be.visible')
    cy.contains('span', 'Create a Connector').should('be.visible')
    cy.contains('span', 'Create a Connector').click()

    cy.get('[data-cy="Cloud Costs_AWS"]').click()
    cy.contains('span', 'AWS Connector').should('be.visible')

    // Overview step
    cy.get('[data-cy="aws-overview"]').should('be.visible')
    cy.fillName('testConnector')
    cy.fillField('awsAccountId', '448640225317')
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

    // Cost and Usage report step
    cy.contains('p', 'Cost and Usage Report').should('be.visible')
    cy.fillField('reportName', 'testReport')
    cy.fillField('s3BucketName', 'testBucketName')
    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    // Choose required features step
    cy.contains('p', 'Choose Requirements').should('be.visible')
    cy.contains('span', 'Continue').click()
    cy.wait('@connectionDetails')

    // Cross account role step
    cy.fillField('crossAccountRoleArn', 'arn:aws:iam::448640225317:role/HarnessCERole-fpl67ag7opru')
    cy.contains('span', 'Save and Continue').click()
    cy.wait(1000)

    // Test Connection step
    cy.wait('@testConnection')

    cy.wait(1000)
    cy.contains('p', 'Verification successful').should('be.visible')
    cy.contains('span', 'Finish').click()
  })
})
