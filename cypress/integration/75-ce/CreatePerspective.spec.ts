import { aliasQuery } from '../../utils/graphql-utils'

describe('CCM Perspective Creation flow', () => {
  beforeEach(() => {
    cy.on('uncaught:exception', () => {
      // returning false here prevents Cypress from
      // failing the test
      return false
    })
    cy.login('test', 'test')
  })

  it('should be able to create perspective', () => {
    cy.intercept('POST', '/ccm/api/graphql?accountIdentifier=accountId&routingId=accountId', req => {
      const { body } = req
      if (body.operationName === 'FetchCcmMetaData') {
        aliasQuery(req, 'FetchCcmMetaData')
        req.reply({
          fixture: 'ccm/api/fetchccmmetadata'
        })
      }

      if (body.operationName === 'FetchViewFields') {
        aliasQuery(req, 'FetchViewFields')
        req.reply({
          fixture: 'ccm/api/ViewFields'
        })
      }

      if (body.operationName === 'FetchPerspectiveFiltersValue') {
        aliasQuery(req, 'FetchPerspectiveFiltersValue')
        req.reply({
          fixture: 'ccm/api/FetchRegions'
        })
      }
    })

    cy.intercept('POST', 'ccm/api/perspective?routingId=accountId&accountIdentifier=accountId', req => {
      req.reply({
        statusCode: 200,
        fixture: 'ccm/api/CreatePerspective'
      })
    }).as('createPerspective')

    cy.intercept(
      'GET',
      'ccm/api/perspective?routingId=accountId&perspectiveId=sampleUUID&accountIdentifier=accountId',
      req => {
        req.reply({
          statusCode: 200,
          fixture: 'ccm/api/FetchPerspective'
        })
      }
    ).as('getPerspective')

    cy.intercept('GET', 'ccm/api/perspectiveFolders?routingId=accountId&accountIdentifier=accountId', req => {
      req.reply({
        statusCode: 200,
        fixture: 'ccm/api/FetchFolders'
      })
    }).as('getFolders')

    cy.intercept(
      'GET',
      'ccm/api/budgets/perspectiveBudgets?routingId=accountId&accountIdentifier=accountId&perspectiveId=sampleUUID',
      req => {
        req.reply({
          statusCode: 200,
          fixture: 'ccm/api/FetchBudgetsEmpty'
        })
      }
    ).as('getBudgets')

    cy.intercept('GET', 'ccm/api/perspectiveReport/accountId?routingId=accountId&perspectiveId=sampleUUID', req => {
      req.reply({
        statusCode: 200,
        fixture: 'ccm/api/FetchReportsEmpty'
      })
    }).as('getReports')

    cy.visitPageAssertion('[class^=MainNav-module_main]')
    cy.contains('p', 'Cloud Costs').click()
    cy.wait('@gqlFetchCcmMetaDataQuery')

    cy.contains('p', 'Perspectives').click()
    cy.wait('@getFolders')

    cy.contains('span', 'New Perspective').click()
    cy.wait('@getPerspective')

    cy.contains('span', 'Last 7 Days').click()
    cy.contains('div', 'Last 30 Days').click()
    cy.contains('span', 'Last 30 Days').should('exist')

    cy.contains('span', 'Add rule').click()
    cy.contains('div', 'Choose Operand').click()
    cy.contains('p', 'Common').trigger('mouseover')
    cy.contains('p', 'Region').click({ force: true })
    cy.contains('div', 'Common > Region').should('exist')

    cy.wait('@gqlFetchPerspectiveFiltersValueQuery')
    cy.get(`.bp3-tag-input-values`).type('us-east-1,us-west-1,sa-east-1').type('{enter}')

    cy.get('body').click(600, 10)

    cy.contains('span', 'Next').click()

    cy.contains('p', 'Report Schedules(0)').should('exist')
    cy.contains('p', 'Budget(0)').should('exist')

    cy.contains('span', '+ create new Report schedule').should('exist')
    cy.contains('span', '+ create new Budget').should('exist')

    cy.contains('span', 'Save Perspective').click()
  })
})
