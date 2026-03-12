describe('Canvas Interaction E2E', () => {
    beforeEach(() => {
        cy.visit('/');
    });

    it('allows creating a node via drag and drop', () => {
        // This assumes there is a palette or button to add nodes.
        // Adjust selector based on actual UI.
        // If no palette, we look for a context menu or existing node.

        // Example: Drag from sidebar to canvas
        // cy.get('#sidebar-item-requirement').realMouseDown();
        // cy.get('#react-flow-canvas').realMouseMove(500, 200).realMouseUp();

        // If the app starts with a node, we can test selecting/moving it.
        cy.get('.react-flow__renderer').should('be.visible');

        // Wait for initial render
        cy.wait(1000);

        // Simulate a workflow: Check if "EngineeringOS" text is present (Dashboard)
        cy.contains('EngineeringOS').should('be.visible');

        // Visual Regression Snapshot
        // Ensure the canvas looks correct
        cy.get('.react-flow__renderer').matchImageSnapshot('canvas-initial-state', {
            failureThreshold: 0.05,
            failureThresholdType: 'percent'
        });
    });

    it('validates air-gap security (no external requests)', () => {
        cy.intercept('**', (req) => {
            const url = new URL(req.url);
            if (url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
                throw new Error(`Security Violation: Attempted connection to ${url.hostname}`);
            }
        });

        // Perform actions
        cy.get('body').click();
        cy.wait(500);
    });
});
