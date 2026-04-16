/**
 * Cypress E2E tests for moderation workflows
 */

describe('Moderation Workflow E2E', () => {
    beforeEach(() => {
        // Login as moderator
        cy.visit('/auth/signin');
        cy.get('input[type="email"]').type('moderator@example.com');
        cy.get('input[type="password"]').type('moderator_password');
        cy.get('button[type="submit"]').click();
        cy.url().should('include', '/');
    });

    describe('Moderation Dashboard', () => {
        it('should access moderation dashboard', () => {
            cy.visit('/moderation/dashboard');

            cy.contains('Moderation Dashboard').should('be.visible');
            cy.contains('Open Reports').should('be.visible');
            cy.contains('Reviewing').should('be.visible');
            cy.contains('Resolved').should('be.visible');
        });

        it('should display report statistics', () => {
            cy.visit('/moderation/dashboard');

            cy.get('[data-testid="stat-card"]').should('have.length.gte', 4);
            cy.contains(/\d+ Open/).should('be.visible');
        });

        it('should list all reports', () => {
            cy.visit('/moderation/dashboard');

            cy.get('[data-testid="report-row"]').should('have.length.greaterThan', 0);
        });

        it('should filter reports by status', () => {
            cy.visit('/moderation/dashboard');

            cy.contains('button', 'Resolved').click();
            cy.get('[data-testid="report-status"]').each(($el) => {
                cy.wrap($el).should('contain', 'Resolved');
            });
        });
    });

    describe('Report Management', () => {
        it('should update report status to reviewing', () => {
            cy.visit('/moderation/dashboard');

            cy.get('[data-testid="report-row"]').first().within(() => {
                cy.get('select').select('reviewing');
            });

            cy.contains('Status updated').should('be.visible');
        });

        it('should resolve report', () => {
            cy.visit('/moderation/dashboard');

            cy.get('[data-testid="report-row"]').first().within(() => {
                cy.get('select').select('resolved');
            });

            cy.contains('Status updated').should('be.visible');
        });

        it('should dismiss report', () => {
            cy.visit('/moderation/dashboard');

            cy.get('[data-testid="report-row"]').first().within(() => {
                cy.get('select').select('dismissed');
            });

            cy.contains('Status updated').should('be.visible');
        });

        it('should view report details', () => {
            cy.visit('/moderation/dashboard');

            cy.get('[data-testid="report-row"]').first().click();

            cy.contains('Report Details').should('be.visible');
            cy.contains('Type').should('be.visible');
            cy.contains('Reason').should('be.visible');
        });
    });

    describe('Thread Moderation', () => {
        it('should pin important thread', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="mod-menu"]').click();
            cy.contains('Pin Thread').click();

            cy.get('textarea[placeholder*="reason"]').type('Important announcement');
            cy.contains('button', 'Confirm').click();

            cy.contains('Thread pinned').should('be.visible');
            cy.contains('📌').should('be.visible');
        });

        it('should lock off-topic thread', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="mod-menu"]').click();
            cy.contains('Lock Thread').click();

            cy.get('textarea[placeholder*="reason"]').type('Off-topic discussion');
            cy.contains('button', 'Confirm').click();

            cy.contains('Thread locked').should('be.visible');
        });

        it('should prevent comments on locked thread', () => {
            // Navigate to a locked thread
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            // Assuming we find a locked thread
            cy.get('[data-testid="thread-card"]').contains('locked').click();

            cy.get('textarea[placeholder*="thoughts"]').should('be.disabled');
            cy.contains('This discussion is locked').should('be.visible');
        });

        it('should delete spam thread', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="mod-menu"]').click();
            cy.contains('Delete Thread').click();

            cy.get('textarea[placeholder*="reason"]').type('Spam');
            cy.contains('button', 'Confirm').click();

            cy.contains('Thread deleted').should('be.visible');
            cy.url().should('include', '/community/');
        });

        it('should unpin thread', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            // Find a pinned thread
            cy.get('[data-testid="thread-card"]').contains('📌').click();

            cy.get('[data-testid="mod-menu"]').click();
            cy.contains('Unpin Thread').click();

            cy.contains('Thread unpinned').should('be.visible');
        });
    });

    describe('Comment Moderation', () => {
        it('should delete offensive comment', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            cy.get('[data-testid="comment-menu"]').first().click();
            cy.contains('Delete Comment').click();

            cy.get('textarea[placeholder*="reason"]').type('Offensive language');
            cy.contains('button', 'Confirm').click();

            cy.contains('Comment deleted').should('be.visible');
        });

        it('should handle bulk comment deletion', () => {
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            // Select multiple comments if bulk delete is available
            cy.get('[data-testid="comment-checkbox"]').each(($checkbox) => {
                cy.wrap($checkbox).click();
            });

            const bulkDeleteBtn = cy.get('[data-testid="bulk-delete"]');
            bulkDeleteBtn.should('be.visible');
        });
    });

    describe('User Warnings', () => {
        it('should issue warning to user', () => {
            cy.visit('/moderation/dashboard');

            cy.get('[data-testid="report-row"]').first().within(() => {
                cy.get('[data-testid="warn-user"]').click();
            });

            cy.get('select').select('low');
            cy.get('textarea').type('First violation warning');
            cy.contains('button', 'Submit').click();

            cy.contains('Warning issued').should('be.visible');
        });

        it('should view user warnings history', () => {
            // Navigate to user profile (implementation may vary)
            cy.visit('/community');
            // Find and click a user that has warnings
            cy.get('[data-testid="user-profile"]').first().click();

            if (cy.contains('Warnings').should.exist) {
                cy.contains('Warnings').click();
                cy.get('[data-testid="warning-item"]').should('have.length.greaterThan', 0);
            }
        });

        it('should auto-suspend on high severity warning', () => {
            cy.visit('/moderation/dashboard');

            cy.get('[data-testid="report-row"]').first().within(() => {
                cy.get('[data-testid="warn-user"]').click();
            });

            cy.get('select').select('high');
            cy.get('textarea').type('Severe policy violation');
            cy.contains('button', 'Submit').click();

            cy.contains('User suspended').should('be.visible');
        });
    });

    describe('Moderation Log', () => {
        it('should view moderation audit log', () => {
            cy.visit('/moderation/dashboard');

            if (cy.contains('Audit Log').should.exist) {
                cy.contains('Audit Log').click();
                cy.get('[data-testid="log-entry"]').should('have.length.greaterThan', 0);
            }
        });

        it('should filter audit log by action', () => {
            cy.visit('/moderation/dashboard');

            if (cy.contains('Audit Log').should.exist) {
                cy.contains('Audit Log').click();
                cy.get('select[name="action"]').select('delete');

                cy.get('[data-testid="log-entry"]').each(($el) => {
                    cy.wrap($el).should('contain', 'deleted');
                });
            }
        });
    });

    describe('Permission Checks', () => {
        it('should deny access to non-moderators', () => {
            // Logout
            cy.get('[data-testid="user-menu"]').click();
            cy.contains('Logout').click();

            // Login as regular user
            cy.get('input[type="email"]').type('user@example.com');
            cy.get('input[type="password"]').type('user_password');
            cy.get('button[type="submit"]').click();

            // Try to access moderation dashboard
            cy.visit('/moderation/dashboard', { failOnStatusCode: false });

            cy.contains('access denied|not authorized|forbidden').should('be.visible');
        });

        it('should prevent non-moderators from using mod menu', () => {
            // Regular user visits thread
            cy.visit('/community');
            cy.get('[data-testid="community-card"]').first().click();
            cy.get('[data-testid="thread-card"]').first().click();

            // Mod menu should not be visible
            cy.get('[data-testid="mod-menu"]').should('not.exist');
        });
    });
});
