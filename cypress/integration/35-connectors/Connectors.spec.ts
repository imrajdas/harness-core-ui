import {
  connectorsRoute,
  connectorsCatalogueAPI,
  delegatesListAPI,
  connectorsListAPI,
  connectorStats,
  connectorsListRoute,
  connectorInfo,
  accountConnectorsListRoute,
  accountConnectorStats,
  accountConnectorsListAPI,
  accountConnectorInfo,
  jenkinsSecretKeys,
  delegatesInfo,
  delegatesList,
  testConnection,
  addConnector
} from '../../support/35-connectors/constants'
import { pageHeaderClassName } from '../../support/70-pipeline/constants'

describe('Connectors list', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.visit(connectorsRoute, {
      timeout: 30000
    })
  })

  it('Connector addition', () => {
    cy.intercept('GET', connectorsCatalogueAPI, { fixture: 'ng/api/connectors/catalogue.json' }).as(
      'connectorsCatalogue'
    )
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@connectorsCatalogue')

    cy.contains('p', 'There are no connectors in your project').should('be.visible')
    cy.contains('span', 'Create a Connector').should('be.visible')
    cy.contains('span', 'Create a Connector').click()

    cy.contains('div', 'Cloud Providers').should('be.visible')
    cy.contains('section', 'GCP').should('be.visible')
    cy.contains('section', 'GCP').click()

    cy.contains('span', 'Google Cloud Provider').should('be.visible')

    // Overview step

    cy.get('[data-cy="connector-overview-heading"]').should('be.visible')
    cy.fillName('testConnector')
    cy.get('span[data-testid="description-edit"]').should('be.visible')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('span[data-testid="tags-edit"]').should('be.visible')
    cy.get('span[data-testid="tags-edit"]').click()

    cy.fillField('description', 'Test Connector Description')
    cy.contains('textarea', 'Test Connector Description').should('be.visible')
    cy.get('input[data-mentions]').clear().type('connTag').type('{enter}')
    cy.contains('span', 'connTag').should('be.visible')

    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    // Details step
    cy.contains('p', 'Details').should('be.visible')

    cy.contains('p', `Use the credentials of a specific Harness Delegate (IAM role, service account, etc)`).click({
      force: true
    })

    cy.contains('span', 'Continue').click()
    cy.wait(1000)

    //Delegate step
    cy.contains('p', 'Delegates Setup').should('be.visible')

    cy.intercept('GET', delegatesListAPI, { fixture: 'ng/api/connectors/delegates.json' }).as('connectorsCatalogue')

    cy.wait(1000)

    cy.get('input[placeholder="Select or Enter Delegates"]').type('arpit').type('{enter}')
    cy.contains('span', 'Save and Continue').click()

    cy.contains('span', 'Connector created successfully').should('be.visible')

    cy.contains('span', 'Finish').click()
  })

  it('Connector deletion', () => {
    cy.intercept('POST', connectorsListAPI, { fixture: '/ng/api/connectors.json' }).as('connectorsList')

    cy.intercept('GET', connectorsCatalogueAPI, { fixture: 'ng/api/connectors/catalogue.json' }).as(
      'connectorsCatalogue'
    )
    cy.wait(1000)
    cy.visitPageAssertion(pageHeaderClassName)
    cy.wait('@connectorsList')
    cy.wait(1000)

    cy.contains('div', 'dynatrace').should('be.visible')

    cy.get('span[data-icon="Options"]').first().click({ force: true })
    cy.contains('div', 'Delete').should('be.visible')
    cy.contains('div', 'Delete').click()
    cy.contains('span', 'Delete').should('be.visible')
    cy.contains('span', 'Delete').click()

    cy.contains('span', 'Connector dynatrace deleted').should('be.visible')
  })
})

describe('Project level jenkins connector', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.intercept('POST', connectorsListAPI, { fixture: 'pipeline/api/connector/connectorList.json' }).as(
      'connectorsListCall'
    )
    cy.intercept('POST', addConnector, { fixture: 'pipeline/api/connector/addConnectorAPIResponse.json' }).as(
      'addConnector'
    )
    cy.intercept('GET', connectorsCatalogueAPI, { fixture: 'pipeline/api/connector/connectorCatalogue.json' }).as(
      'connectorsCatalogueAPI'
    )
    cy.intercept('GET', jenkinsSecretKeys, { fixture: 'pipeline/api/connector/secretKeys.json' }).as(
      'jenkinsSecretKeys'
    )
    cy.intercept('GET', connectorStats, { fixture: 'pipeline/api/connector/connectorStats.json' }).as('connectorStats')
    cy.intercept('GET', connectorInfo, { fixture: 'pipeline/api/connector/connectorInfo.json' }).as('connectorInfo')
    cy.visit(connectorsListRoute, {
      timeout: 30000
    })
    cy.wait(2000)
  })
  it('jenkins connector name field should not be empty', () => {
    cy.contains('span', 'New Connector').should('be.visible')
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.contains('span', 'Continue').click()
    cy.contains('span', 'Name is required').should('be.visible')
  })
  it('jenkins connector name field should not contain only whitespace', () => {
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.get('input[name="name"]').clear().type('  ')
    cy.contains('span', 'Continue').click()
    cy.contains('span', 'Name is required').should('be.visible')
  })

  it('jenkins connector name field should accept alphanumeric', () => {
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.get('input[name="name"]').clear().type('ap5')
    cy.contains('span', 'Continue').click()
    cy.contains('span', 'Username').should('be.visible')
  })

  it('jenkins connector name field should not accept special characters', () => {
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.get('input[name="name"]').clear().type('ap5$-&')
    cy.contains('span', 'Continue').click()
    cy.contains('span', 'Name can only contain alphanumerics, _ and -').should('be.visible')
  })

  it('jenkins connector description field is not mandatory', () => {
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.get('input[name="name"]').clear().type('ap5')
    cy.get('span[data-testid="description-edit"]').click()
    cy.contains('span', 'Continue').click()
    cy.contains('span', 'Username').should('be.visible')
  })

  it('jenkins connector description field should accept string', () => {
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.get('input[name="name"]').clear().type('ap5')
    cy.get('span[data-testid="description-edit"]').click()
    cy.get('textarea[name="description"]').clear().type('hello there')
    cy.contains('span', 'Continue').click()
    cy.contains('span', 'Username').should('be.visible')
  })

  it('jenkins connector identifier field should not be empty', () => {
    cy.contains('span', 'New Connector').should('be.visible')
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.contains('span', 'Continue').click()
    cy.contains('span', 'Name is required').should('be.visible')
  })
  it('Verifying details in YAML', () => {
    cy.contains('div', 'testConnector').should('be.visible')
    cy.contains('div', 'testConnector').click()
    cy.get('div[data-name="toggle-option-two"]').click()
    cy.wait(1000)
    // Verify all details in YAML view
    cy.contains('span', 'Jenkins').should('be.visible') // Connector type is jenkins
    cy.contains('span', 'https://jenkins.dev.harness.io').should('be.visible') // Jenkins URL is present
    cy.contains('span', 'UsernamePassword').should('be.visible') // Spec->Auth->Type is mandatory
    cy.contains('span', 'harnessadmin').should('be.visible') // Spec->Auth->Spec->Username is mandatory
    cy.contains('span', 'jenkinsPass').should('be.visible') // Spec->Auth->Spec->PasswordRef is mandatory
    cy.contains('span', 'default').should('be.visible') // OrgId is mandatory
  })

  it('Connector creation should be successful only when specified delegate is available and connected', () => {
    cy.intercept('GET', delegatesInfo, { fixture: 'pipeline/api/connector/delegatesInfo.json' }).as('delegatesInfo')
    cy.intercept('POST', testConnection, { fixture: 'pipeline/api/connector/testConnector.json' }).as('testConnection')
    cy.intercept('GET', delegatesList, { fixture: 'pipeline/api/connector/delegatesList.json' }).as('delegatesList')
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.get('input[name="name"]').clear().type('testConnector')
    cy.contains('span', 'Continue').click()
    cy.get('input[name="jenkinsUrl"]').clear().type('https://jenkins.dev.harness.io')
    cy.get('input[name="usernametextField"]').clear().type('harnessadmin')
    cy.get('a[data-testid="password"]').click()
    cy.contains('p', 'jenkinsSecret').click()
    cy.contains('span', 'Apply Selected').click()
    cy.contains('span', 'Continue').click()
    cy.get('input[placeholder="Select or Enter Delegates"]').click()
    cy.contains('div', 'temp-delegate-pr').click()
    cy.contains('span', 'Save and Continue').click()
    cy.contains('p', 'Verification successful').should('be.visible')
  })
  it('Connector creation should fail only when no delegate is available and connected', () => {
    cy.intercept('GET', delegatesInfo, { fixture: 'pipeline/api/connector/emptyDelegates.json' }).as('delegatesInfo')
    cy.intercept('POST', testConnection, { fixture: 'pipeline/api/connector/testConnectionFailed.json' }).as(
      'testConnection'
    )
    cy.intercept('GET', delegatesList, { fixture: 'pipeline/api/connector/emptyDelegatesList.json' }).as(
      'delegatesList'
    )
    cy.contains('span', 'New Connector').click()
    cy.get('[data-cy="Artifact Repositories_Jenkins"]').click()
    cy.get('input[name="name"]').clear().type('testConnector')
    cy.contains('span', 'Continue').click()
    cy.get('input[name="jenkinsUrl"]').clear().type('https://jenkins.dev.harness.io')
    cy.get('input[name="usernametextField"]').clear().type('harnessadmin')
    cy.get('a[data-testid="password"]').click()
    cy.contains('p', 'jenkinsSecret').click()
    cy.contains('span', 'Apply Selected').click()
    cy.contains('span', 'Continue').click()
    cy.get('input[placeholder="Select or Enter Delegates"]').click()
    cy.contains('span', 'Save and Continue').click()
    cy.contains('p', 'Test failed for the Connector').should('be.visible')
  })
})

describe('Account level jenkins connector', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.initializeRoute()
    cy.intercept('POST', accountConnectorsListAPI, { fixture: 'pipeline/api/connector/accountConnectotList.json' }).as(
      'connectorsListCall'
    )
    cy.intercept('GET', connectorsCatalogueAPI, {
      fixture: 'pipeline/api/connector/accountConnectorCatalogue.json'
    }).as('connectorsCatalogueAPI')
    cy.intercept('GET', accountConnectorStats, { fixture: 'pipeline/api/connector/accountConnectorStats.json' }).as(
      'connectorStats'
    )
    cy.intercept('GET', accountConnectorInfo, { fixture: 'pipeline/api/connector/accountConnectorInfo.json' }).as(
      'connectorInfo'
    )

    cy.visit(accountConnectorsListRoute, {
      timeout: 30000
    })
    cy.wait(2000)
  })
  it('Verifying details in YAML', () => {
    cy.contains('div', 'testConnector').should('be.visible')
    cy.contains('div', 'testConnector').click()
    cy.get('div[data-name="toggle-option-two"]').click()
    cy.wait(1000)
    // Verify all details in YAML view
    cy.contains('span', 'Jenkins').should('be.visible') // Connector type is jenkins
    cy.contains('span', 'https://jenkins.dev.harness.io').should('be.visible') // Jenkins URL is present
    cy.contains('span', 'UsernamePassword').should('be.visible') // Spec->Auth->Type is mandatory
    cy.contains('span', 'harnessadmin').should('be.visible') // Spec->Auth->Spec->Username is mandatory
    cy.contains('span', 'account.accountJenkinsSecret').should('be.visible') // Spec->Auth->Spec->PasswordRef is mandatory
  })
})
