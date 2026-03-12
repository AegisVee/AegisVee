import React from 'react';
import RequirementNode from '../../src/components/EngineeringOS/nodes/RequirementNode';
import { ReactFlowProvider } from '@xyflow/react';

const WrappedNode = (props) => (
    <ReactFlowProvider>
        <RequirementNode {...props} />
    </ReactFlowProvider>
);

describe('RequirementNode Component', () => {
    it('renders correctly with verified status', () => {
        const data = {
            id: 'REQ-001',
            title: 'Safety Interlock',
            status: 'Verified',
            compliance: 'compliant'
        };

        cy.mount(<WrappedNode data={data} />);

        cy.contains('REQ-001').should('be.visible');
        cy.contains('Safety Interlock').should('be.visible');
        cy.contains('Verified').should('have.class', 'text-green-400');
    });

    it('renders warning icon when compliance is warning', () => {
        const data = {
            id: 'REQ-002',
            title: 'Battery Voltage',
            status: 'Review',
            compliance: 'warning'
        };

        cy.mount(<WrappedNode data={data} />);

        // Lucide icons render as SVGs, we can check existence or class
        cy.get('svg.text-yellow-500').should('exist'); // AlertTriangle
        cy.contains('Review').should('have.class', 'text-blue-400');
    });

    it('renders handles', () => {
        const data = { id: 'REQ-003', title: 'Test', status: 'Draft' };
        cy.mount(<WrappedNode data={data} />);

        cy.get('.react-flow__handle-top').should('exist');
        cy.get('.react-flow__handle-bottom').should('exist');
    });
});
