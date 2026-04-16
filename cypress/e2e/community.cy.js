/**
 * Cypress E2E tests for community workflows
 */

describe('Community Workflow E2E', () => {
    beforeEach(() => {
        // Login before each test
        cy.visit('/auth/signin');
        cy.get('input[type="email"]').type('testuser@example.com');
        cy.get('input[type="password"]').type('your_password');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/');
    });

    describe('Community Browsing', () => {
        it('should browse communities page', () => {
            cy.visit('/community');
            cy.contains('Communities').should('be.visible');
            cy.get('[data-testid="community-card"]').should('have.length.greaterThan', 0);
        });

        it('should search communities', () => {
            cy.visit('/community');
            cy.get('input[placeholder*="Search"]').type('Python');
            cy.contains('Python').should('be.visible');
        });

        it('should filter public and private communities', () => {
            cy.visit('/community');
            cy.contains('Public Communities').click();
            cy.contains('Private Communities').click();
        });

        it('should view community details', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.url().should('include', '/community/');
            cy.contains('Members').should('be.visible');
            cy.contains('Discussions').should('be.visible');
        });

        it('should navigate between pages with pagination', () => {
            cy.visit('/community?page=1');
            cy.contains('Next').click();
            cy.url().should('include', 'page=2');
        });
    });

    describe('Thread Creation', () => {
        it('should create new thread in community', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.contains('Start Discussion').click();
            cy.url().should('include', '/create-thread');

            // Fill form
            cy.get('input[placeholder*="What"]').type('Test Discussion Title');
            cy.get('textarea').first().type(
                'This is a comprehensive discussion with enough content to pass validation'
            );
            cy.get('select').select('general');

            cy.contains('button', 'Create Discussion').click();
            cy.contains('Discussion Created!').should('be.visible');
        });

        it('should validate thread title length', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.contains('Start Discussion').click();

            // Too short title
            cy.get('input[placeholder*="What"]').type('Hi');
            cy.get('textarea').first().type('Valid content here');

            cy.contains('button', 'Create Discussion').should('be.disabled');
        });

        it('should show character counter', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.contains('Start Discussion').click();

            cy.get('textarea').first().type('Test content');
            cy.contains(/12 \/ \d+/).should('be.visible');
        });
    });

    describe('Thread Interactions', () => {
        it('should view thread details', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.contains('Comments').should('be.visible');
            cy.contains('Likes').should('be.visible');
        });

        it('should post comment on thread', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('textarea[placeholder*="thoughts"]').type('Great discussion!');
            cy.contains('button', 'Post Comment').click();

            cy.contains('Comment posted successfully').should('be.visible');
            cy.contains('Great discussion!').should('be.visible');
        });

        it('should like thread', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('button').contains(/Likes/).click();
            cy.contains('1 Likes').should('be.visible');
        });

        it('should reply to comment', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="comment-reply"]').first().click();
            cy.get('textarea[placeholder*="thoughts"]').type('I agree!');
            cy.contains('button', 'Post Comment').click();

            cy.contains('Comment posted successfully').should('be.visible');
        });

        it('should like comment', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="comment-like"]').first().click();
            cy.get('[data-testid="comment-like-count"]').first().should('contain', '1');
        });
    });

    describe('Content Reporting', () => {
        it('should report inappropriate thread', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="more-menu"]').click();
            cy.contains('Report').click();

            cy.get('select').select('spam');
            cy.get('textarea').type('This is spam content');
            cy.contains('button', 'Submit Report').click();

            cy.contains('Report Submitted').should('be.visible');
        });

        it('should report inappropriate comment', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="comment-menu"]').first().click();
            cy.contains('Report').click();

            cy.get('select').select('harassment');
            cy.get('textarea').type('Offensive content');
            cy.contains('button', 'Submit Report').click();

            cy.contains('Report Submitted').should('be.visible');
        });

        it('should show all report reasons', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="more-menu"]').click();
            cy.contains('Report').click();

            const reasons = ['spam', 'harassment', 'hate_speech', 'misinformation', 'copyright', 'off_topic', 'other'];
            reasons.forEach(reason => {
                cy.get('select').should('contain', reason);
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle empty thread creation', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.contains('Start Discussion').click();

            cy.contains('button', 'Create Discussion').should('be.disabled');
        });

        it('should handle network errors gracefully', () => {
            cy.intercept('POST', '/api/threads', { statusCode: 500 });

            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.contains('Start Discussion').click();

            cy.get('input[placeholder*="What"]').type('Test Title');
            cy.get('textarea').first().type('Valid content here');
            cy.contains('button', 'Create Discussion').click();

            cy.contains('error|Error').should('be.visible');
        });

        it('should handle 404 errors for missing communities', () => {
            cy.visit('/community/invalid-id', { failOnStatusCode: false });

            cy.contains('not found|not exist|error').should('be.visible');
        });
    });
});
