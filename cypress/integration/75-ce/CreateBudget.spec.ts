import { aliasQuery } from '../../utils/graphql-utils'

describe('CCM Budget Creation flow', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.login('test', 'test')
  })

  it('should be able to create budgets', () => {
    cy.intercept('POST', '/ccm/api/graphql?accountIdentifier=accountId&routingId=accountId', req => {
      const { body } = req
      if (body.operationName === 'FetchCcmMetaData') {
        aliasQuery(req, 'FetchCcmMetaData')
        req.reply({
          fixture: 'ccm/api/fetchccmmetadata'
        })
      }
      if (body.operationName === 'FetchBudget') {
        aliasQuery(req, 'FetchBudget')
        req.reply({
          fixture: 'ccm/api/FetchBudget'
        })
      }
      if (body.operationName === 'FetchPerspectiveList') {
        aliasQuery(req, 'FetchPerspectiveList')
        req.reply({
          fixture: 'ccm/api/FetchPerspectiveList'
        })
      }
    })

    cy.visitPageAssertion('[class^=MainNav-module_main]')
    cy.contains('p', 'Cloud Costs').click()
    cy.wait('@gqlFetchCcmMetaDataQuery')
    cy.contains('p', 'Budgets').click()

    cy.wait('@gqlFetchBudgetQuery')
    cy.wait(1000)
    cy.contains('span', 'New Budget').click()

    cy.wait('@gqlFetchPerspectiveListQuery')
    cy.get('input[name="perspective"]').click()
    cy.contains('p', 'Cluster').click()
    cy.get(`[name="budgetName"]`).clear().type('Test Budget 12')
    cy.clickSubmit()

    cy.get(`input[name="period"]`).click()
    cy.contains('p', 'Daily').click()

    cy.get(`input[name="type"]`).click()
    cy.contains('p', `Last period's spend`).click()

    cy.get(`input[name="type"]`).click()
    cy.contains('p', `Specified amount`).click()

    cy.get(`[name="budgetAmount"]`).clear().type('10000')
    cy.clickSubmit()

    cy.get(`.bp3-tag-input-values > input`).type('test@test.com').type('{enter}')
    cy.contains('span', 'Save').click()
    cy.contains('p', 'Configure Alerts').should('not.exist')
  })

  it('should be able to show error while create budgets', () => {
    cy.intercept('POST', '/ccm/api/graphql?accountIdentifier=accountId&routingId=accountId', req => {
      const { body } = req
      if (body.operationName === 'FetchCcmMetaData') {
        aliasQuery(req, 'FetchCcmMetaData')
        req.reply({
          fixture: 'ccm/api/fetchccmmetadata'
        })
      }
      if (body.operationName === 'FetchBudget') {
        aliasQuery(req, 'FetchBudget')
        req.reply({
          fixture: 'ccm/api/FetchBudget'
        })
      }
      if (body.operationName === 'FetchPerspectiveList') {
        aliasQuery(req, 'FetchPerspectiveList')
        req.reply({
          fixture: 'ccm/api/FetchPerspectiveList'
        })
      }
    })

    cy.intercept('POST', 'ccm/api/budgets?routingId=accountId&accountIdentifier=accountId', req => {
      req.reply({
        statusCode: 400,
        fixture: 'ccm/api/BudgetSaveError'
      })
    }).as('budgetSave')

    cy.visitPageAssertion('[class^=MainNav-module_main]')
    cy.contains('p', 'Cloud Costs').click()
    cy.wait('@gqlFetchCcmMetaDataQuery')
    cy.contains('p', 'Budgets').click()

    cy.intercept('POST', '/ccm/api/graphql?accountIdentifier=accountId&routingId=accountId', req => {
      const { body } = req
      if (body.operationName === 'FetchCcmMetaData') {
        req.alias = `gqlFetchCcmMetaDataQuery`
        req.reply({
          fixture: 'ccm/api/fetchccmmetadata'
        })
      }
      if (body.operationName === 'FetchBudget') {
        req.alias = `gqlFetchBudgetQuery`
        req.reply({
          fixture: 'ccm/api/FetchBudget'
        })
      }
      if (body.operationName === 'FetchPerspectiveList') {
        req.alias = `gqlFetchPerspectiveListQuery`
        req.reply({
          fixture: 'ccm/api/FetchPerspectiveList'
        })
      }
    })

    cy.wait('@gqlFetchBudgetQuery')
    cy.wait(1000)
    cy.contains('span', 'New Budget').click()

    cy.wait('@gqlFetchPerspectiveListQuery')
    cy.get('input[name="perspective"]').click()
    cy.contains('p', 'Cluster').click()
    cy.get(`[name="budgetName"]`).clear().type('Test Budget 12')
    cy.clickSubmit()

    cy.get(`input[name="type"]`).click()
    cy.contains('p', `Specified amount`).click()

    cy.get(`[name="budgetAmount"]`).clear().type('10000')
    cy.clickSubmit()

    cy.get(`.bp3-tag-input-values > input`).type('test@test.com').type('{enter}')
    cy.contains('span', 'Save').click()
    cy.wait('@budgetSave')
    cy.contains('p', 'Invalid request').should('exist')
  })
})
