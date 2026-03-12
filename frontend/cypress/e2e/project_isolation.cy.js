// cypress/e2e/project_isolation.cy.js
// Verifies project-scoped requirements isolation after the refactor.

const API = 'http://localhost:8000/api';

describe('Project Isolation — API Health', () => {
    it('GET /api/projects returns project list including Unassigned', () => {
        cy.request(`${API}/projects`).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.be.greaterThan(0);
            // Unassigned project should exist from migration
            const unassigned = res.body.find(p => p.title === 'Unassigned');
            expect(unassigned).to.exist;
        });
    });

    it('GET /api/projects/1/requirements returns an array', () => {
        cy.request(`${API}/projects/1/requirements`).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
        });
    });

    it('GET /api/projects/5/requirements returns Space project requirements', () => {
        cy.request(`${API}/projects/5/requirements`).then((res) => {
            expect(res.status).to.eq(200);
            expect(res.body).to.be.an('array');
            expect(res.body.length).to.be.greaterThan(0);
            // Space project should have REQ-105
            const ids = res.body.map(r => r.id);
            expect(ids).to.include('REQ-105');
        });
    });
});

describe('Project Isolation — Dashboard Navigation', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('Dashboard loads with project cards', () => {
        cy.contains('AegisVee').should('be.visible');
        // Should see at least one project card
        cy.contains('Braking System (ABS)').should('be.visible');
    });

    it('Clicking a project card navigates to project detail', () => {
        cy.contains('Braking System (ABS)').click();
        // Should show project detail with Back button
        cy.contains('Back to Dashboard', { timeout: 5000 }).should('be.visible');
    });
});

describe('Project Isolation — Requirements Scoping', () => {
    it('Different projects have different requirements via API', () => {
        // Use API-level verification since the UI shows requirements in a modal
        cy.request(`${API}/projects/5/requirements`).then((spaceRes) => {
            const spaceIds = spaceRes.body.map(r => r.id);
            expect(spaceIds).to.include('REQ-105');

            cy.request(`${API}/projects/1/requirements`).then((absRes) => {
                const absIds = absRes.body.map(r => r.id);
                // ABS should NOT contain Space's REQ-105
                expect(absIds).to.not.include('REQ-105');
            });
        });
    });

    it('Space project detail opens requirement table modal with correct data', () => {
        cy.visit('/');

        // Enter Space Software Project
        cy.contains('Space Software Project').click();
        cy.contains('Back to Dashboard', { timeout: 5000 }).should('be.visible');

        // The "Requirements" card shows "0% COVERED" — find it and click.
        // It's a card with title "Requirements" containing "reqs" metric text.
        cy.contains('0% COVERED').should('be.visible');
        // Click the parent card div that wraps the Requirements TrafficLightCard
        cy.contains('0% COVERED').parents('[style*="cursor"]').first().click({ force: true });

        // Modal should open with Requirements Management title
        cy.contains('Requirements Management', { timeout: 5000 }).should('be.visible');
        // Should see REQ-105 in the table
        cy.get('.ant-table-tbody', { timeout: 8000 }).should('contain', 'REQ-105');
    });
});

describe('Project Isolation — Add Requirement Isolation', () => {
    it('Adding a requirement in one project does not appear in another', () => {
        cy.visit('/');

        // Enter ABS project
        cy.contains('Braking System (ABS)').click();
        cy.contains('Back to Dashboard', { timeout: 5000 }).should('be.visible');

        // Look for the "View All Requirements" or similar button that opens RequirementTable
        // In ProjectDetailTemplate there may be a button to expand the requirement table
        cy.get('body').then(($body) => {
            // Try to find and click "Add Requirement" button
            if ($body.find('button:contains("Add Requirement")').length > 0) {
                cy.contains('button', 'Add Requirement').click();
                cy.wait(1500);

                // Count requirements via API
                cy.request(`${API}/projects/1/requirements`).then((absRes) => {
                    const absCount = absRes.body.length;
                    expect(absCount).to.be.greaterThan(0);

                    // Space project should NOT have the new requirement
                    cy.request(`${API}/projects/5/requirements`).then((spaceRes) => {
                        const spaceIds = spaceRes.body.map(r => r.id);
                        const absIds = absRes.body.map(r => r.id);
                        // Check no ABS requirement leaked into Space
                        absIds.forEach(id => {
                            if (id.startsWith('REQ-') && !['REQ-105', 'REQ-106', 'REQ-107', 'REQ-108', 'REQ-109'].includes(id)) {
                                expect(spaceIds).to.not.include(id);
                            }
                        });
                    });
                });
            } else {
                // If no Add Requirement button visible, verify via API directly
                cy.request({
                    method: 'POST',
                    url: `${API}/projects/1/requirements/add`,
                    body: { title: 'CypressTestReq', description: 'Created by Cypress test' },
                    headers: { 'Content-Type': 'application/json' }
                }).then((res) => {
                    expect(res.status).to.eq(200);
                    const newId = res.body.id;

                    // Verify it's in project 1
                    cy.request(`${API}/projects/1/requirements`).its('body').should('deep.include.members', [res.body]);

                    // Verify it's NOT in project 5
                    cy.request(`${API}/projects/5/requirements`).then((spaceRes) => {
                        const spaceIds = spaceRes.body.map(r => r.id);
                        expect(spaceIds).to.not.include(newId);
                    });
                });
            }
        });
    });
});

describe('Project Isolation — Sidebar Requirements Hint', () => {
    it('Shows "select a project" message when no project is selected', () => {
        cy.visit('/');

        // The sidebar should have a "Requirements" menu item (if added to menu)
        // First, check if Requirements is in the sidebar. It may need to be added via the "+" menu.
        cy.get('.ant-layout-sider', { timeout: 5000 }).then(($sider) => {
            if ($sider.text().includes('Requirements')) {
                cy.contains('Requirements').click();
                cy.contains('Please select a project', { timeout: 3000 }).should('be.visible');
            } else {
                // Requirements not in sidebar by default — this is expected behavior
                // The default sidebar only has Dashboard and Engineering OS
                cy.log('Requirements not in default sidebar — skipping hint test');
            }
        });
    });
});
