// cypress/e2e/smoke_test.cy.js
describe('AegisVee Smoke Test', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('should load the dashboard, create a new project, and navigate to Engineering OS', () => {
        // 1. Verify Dashboard Loads
        cy.contains('AegisVee').should('be.visible');

        // 2. Create New Project
        cy.get('button').contains('Add Project').click();

        // 3. Fill Project Details
        cy.get('#title').should('be.visible');
        const projectName = 'SmokeTestProject_' + Date.now();
        cy.get('#title').type(projectName);
        cy.get('.ant-modal-footer .ant-btn-primary').click();

        // 4. Verify Project Appears in Dashboard
        cy.contains(projectName).should('be.visible');

        // 5. Enter Project
        cy.contains(projectName).click();

        // 6. Verify Project Detail View matches expected MVP state
        // It should have "Back to Dashboard" button
        cy.contains('Back to Dashboard').should('be.visible');

        // Note: The title might default to "Project Details" for new projects due to MVP limitations
        cy.contains('Project Details').should('be.visible');

        // 7. Navigate to Engineering OS via Sidebar
        // The sidebar should be visible
        cy.get('.ant-layout-sider').should('be.visible');
        cy.contains('Engineering OS').click();

        // 8. Verify Engineering OS Canvas
        // We look for the react-flow canvas or specific nodes
        cy.get('.react-flow').should('exist');

        // Optional: Check if we can context click or interaction
        // cy.get('.react-flow__renderer').trigger('contextmenu');
    });
});
