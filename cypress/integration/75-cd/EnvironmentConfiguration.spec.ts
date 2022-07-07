import { pageHeaderClassName, featureFlagsCall } from '../../support/70-pipeline/constants'
import {
  environmentConfigurationRoute,
  environmentConfigurationCall,
  environmentConfigurationSecretCall
} from '../../support/75-cd/constants'

describe('EnvironmentsV2 Configuration Page', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })

    cy.fixture('api/users/feature-flags/accountId').then(featureFlagsData => {
      cy.intercept('GET', featureFlagsCall, {
        ...featureFlagsData,
        resource: [
          ...featureFlagsData.resource,
          {
            uuid: null,
            name: 'NG_SVC_ENV_REDESIGN',
            enabled: true,
            lastUpdatedAt: 0
          }
        ]
      })
    })

    cy.initializeRoute()
    cy.visit(environmentConfigurationRoute, {
      timeout: 30000
    })
  })

  it('Environment Variables Addition & YAML/Visual parity', () => {
    cy.intercept('GET', environmentConfigurationCall, {
      fixture: 'ng/api/environmentConfiguration/environmentConfiguration.json'
    })
    cy.intercept('GET', environmentConfigurationSecretCall, {
      fixture: 'ng/api/environmentConfiguration/createEnvironmentConfigurationSecret.json'
    }).as('envSecretCall')
    cy.wait(3000)

    cy.visitPageAssertion(pageHeaderClassName)
    cy.get('[data-testid="advanced-panel"]').click()
    cy.contains('p', 'Variables').should('be.visible')
    cy.contains('button[type="button"]', '+ Add Variable').should('be.visible').as('addVariable')

    // Adding var1
    cy.get('@addVariable').click()
    cy.get('input[placeholder="Enter Variable Name"]').clear().type('var1').should('have.value', 'var1')
    cy.get('input[placeholder="- Enter Type -"]').should('be.visible').as('selectType')
    cy.get('@selectType').click()
    cy.get('li.Select--menuItem').should('have.length', 3).as('menuItem')
    cy.get('@menuItem').eq(0).should('contain.text', 'String').as('typeString')
    cy.get('@menuItem').eq(1).should('contain.text', 'Secret').as('typeSecret')
    cy.get('@menuItem').eq(2).should('contain.text', 'Number').as('typeNumber')
    cy.get('@typeNumber').click()
    cy.get('button[data-testid="addVariableSave"]').should('not.be.disabled').as('saveButton')
    cy.get('@saveButton').click()

    cy.get('input[name="variables[0].name"]').should('be.disabled').should('have.value', 'var1')
    cy.contains('span[data-testid="variables[0].type"]', 'Number').should('be.visible')

    // Editing var1 type
    cy.get('button[data-testid="edit-variable-0"]').should('be.visible').click()
    cy.get('@selectType').click()
    cy.get('@typeString').click()
    cy.get('@saveButton').click()
    cy.contains('span[data-testid="variables[0].type"]', 'String').should('be.visible')

    cy.get('span[data-icon="fixed-input"]').should('be.visible').click()
    cy.get('a.bp3-menu-item').should('have.length', 3).as('valueList')
    cy.get('@valueList').eq(0).should('contain.text', 'Fixed value').as('fixedValue')
    cy.get('@valueList').eq(1).should('contain.text', 'Runtime input').as('runtimeValue')
    cy.get('@valueList').eq(2).should('contain.text', 'Expression').as('expressionValue')
    cy.get('@expressionValue').click()
    cy.get('span[data-icon="expression-input"]').should('be.visible') // Expression Icon
    cy.get('input[name="variables[0].value"]') // Input val
      .should('not.be.disabled')
      .clear()
      .type('<+17>')
      .should('have.value', '<+17>')

    // Adding var2
    cy.get('@addVariable').click()
    cy.get('input[placeholder="Enter Variable Name"]').clear().type('var2').should('have.value', 'var2')
    cy.get('@selectType').click()
    cy.get('@typeNumber').click()
    cy.get('@saveButton').click()

    cy.get('input[name="variables[1].name"]').should('be.disabled').should('have.value', 'var2')
    cy.contains('span[data-testid="variables[1].type"]', 'Number').should('be.visible')

    cy.get('span[data-icon="fixed-input"]').should('be.visible').click()
    cy.get('span[icon="cross"]').as('crossIcon').click()
    cy.get('@runtimeValue').click()
    cy.get('span[data-icon="runtime-input"]').should('be.visible') // Runtime Icon
    cy.get('input[name="variables[1].value"]').should('be.disabled').should('have.value', '<+input>')

    // Adding var3
    cy.get('@addVariable').click()
    cy.get('input[placeholder="Enter Variable Name"]').clear().type('var3').should('have.value', 'var3')
    cy.get('@selectType').click()
    cy.get('@typeSecret').click()
    cy.get('@saveButton').click()

    cy.get('input[name="variables[2].name"]').should('be.disabled').should('have.value', 'var3')
    cy.contains('span[data-testid="variables[2].type"]', 'Secret').should('be.visible')

    cy.get('span[data-icon="fixed-input"]').should('be.visible').click()
    cy.get('@crossIcon').click()
    cy.get('@fixedValue').click()
    cy.get('button[data-testid="create-or-select-secret"]').should('not.be.disabled').click()

    cy.wait('@envSecretCall')

    cy.contains('p', 'Id: secretId.harnessSecretManager').should('be.visible').click()
    cy.get('span[data-icon="pipeline-approval"]').should('be.visible') // Approval Icon visible
    cy.contains('button[type="button"]', 'Apply Selected').should('be.visible').click()

    cy.get('span[data-icon="key-main"]').should('be.visible')
    cy.contains('p', 'secretId').should('be.visible')

    // Adding var4
    cy.get('@addVariable').click()
    cy.get('input[placeholder="Enter Variable Name"]').clear().type('var4').should('have.value', 'var4')
    cy.get('@selectType').click()
    cy.get('@typeString').click()
    cy.get('@saveButton').click()

    cy.get('input[name="variables[3].name"]').should('be.disabled').should('have.value', 'var4')
    cy.contains('span[data-testid="variables[3].type"]', 'String').should('be.visible')

    cy.get('span[data-icon="fixed-input"]').eq(1).should('be.visible').click()
    cy.get('@crossIcon').click()
    cy.get('@runtimeValue').click()
    cy.get('input[name="variables[3].value"]').should('be.disabled').should('have.value', '<+input>')

    cy.get('svg[data-icon="cog"]').eq(1).should('be.visible').click() // Configuration Icon
    cy.get('input[name="defaultValue"]').clear().type('dummyVal').should('have.value', 'dummyVal')
    cy.contains('button', 'Submit').should('not.be.disabled').click()

    // Adding var5 & Deleting
    cy.get('@addVariable').click()
    cy.get('input[placeholder="Enter Variable Name"]').clear().type('var5').should('have.value', 'var5')
    cy.get('@selectType').click()
    cy.get('@typeSecret').click()
    cy.get('@saveButton').click()

    cy.get('button[data-testid="create-or-select-secret"]').eq(1).should('not.be.disabled').click()
    cy.wait('@envSecretCall', { timeout: 10000 })

    cy.contains('p', 'Id: secretId.harnessSecretManager').should('be.visible').click()
    cy.get('span[data-icon="pipeline-approval"]').should('be.visible') // Approval Icon visible
    cy.contains('button[type="button"]', 'Apply Selected').should('be.visible').click()
    cy.get('button[data-testid="delete-variable-4"]').should('be.visible').click() // Deleting var5
    cy.wait(1000)
    cy.get('input[name="variables[4].name"]').should('not.exist')

    // YAML View
    cy.contains('div[data-name="toggle-option-two"]', 'YAML').should('be.visible').click()
    cy.contains('span', 'testEnvConfig').should('be.visible')
    cy.contains('span', 'PreProduction').should('be.visible')
    cy.contains('span', 'default').should('be.visible')
    cy.contains('span', 'project1').should('be.visible')
    cy.contains('span', 'var1').should('be.visible')
    cy.contains('span', 'String').should('be.visible')
    cy.contains('span', '<+17>').should('be.visible')
    cy.contains('span', 'var2').should('be.visible')
    cy.contains('span', 'Number').should('be.visible')
    cy.contains('span', '<+input>').should('be.visible')
    cy.contains('span', 'var3').should('be.visible')
    cy.contains('span', 'Secret').should('be.visible')
    cy.contains('span', 'secretId').should('be.visible')
    cy.contains('span', 'var4').should('be.visible')
    cy.contains('span', 'dummyVal').should('be.visible')
    cy.contains('span', 'var5').should('not.exist')

    // Saving Env Details
    cy.get('button[data-id="environment-edit"]').should('not.be.disabled').click()
    cy.wait(1000)
    cy.contains('span', 'Environment updated successfully').should('be.visible')
  })
})
