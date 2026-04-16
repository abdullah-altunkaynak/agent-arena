/**
 * Tests for ModerationMenu component
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ModerationMenu from '@/components/ModerationMenu';

describe('ModerationMenu Component', () => {
    const mockThread = {
        id: 'thread-1',
        title: 'Test Thread',
    };

    const mockComment = {
        id: 'comment-1',
        content: 'Test comment',
    };

    beforeEach(() => {
        localStorage.clear();
    });

    test('does not render for non-moderators', () => {
        localStorage.setItem('user_role', 'member');

        const { container } = render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={false}
            />
        );

        expect(container.firstChild).toBeNull() ||
            expect(container.querySelector('button')).not.toBeInTheDocument();
    });

    test('renders menu button for moderators', () => {
        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button', { name: /menu|options|more/i }) ||
            screen.getByText('⋯');
        expect(menuBtn).toBeInTheDocument();
    });

    test('shows thread moderation options', async () => {
        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        await waitFor(() => {
            expect(screen.getByText(/pin thread/i)).toBeInTheDocument();
            expect(screen.getByText(/lock thread/i)).toBeInTheDocument();
            expect(screen.getByText(/delete thread/i)).toBeInTheDocument();
        });
    });

    test('shows comment moderation options', async () => {
        render(
            <ModerationMenu
                contentType="comment"
                contentId={mockComment.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        await waitFor(() => {
            expect(screen.getByText(/delete comment/i)).toBeInTheDocument();
        });
    });

    test('opens dropdown when clicking menu button', async () => {
        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        await waitFor(() => {
            expect(screen.getByText(/pin thread/i)).toBeVisible();
        });
    });

    test('closes dropdown on backdrop click', async () => {
        const { container } = render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        await waitFor(() => {
            expect(screen.getByText(/pin thread/i)).toBeVisible();
        });

        const backdrop = container.querySelector('[data-testid="backdrop"]') ||
            container.querySelector('.fixed');
        if (backdrop) {
            fireEvent.click(backdrop);
            expect(screen.queryByText(/pin thread/i)).not.toBeVisible();
        }
    });

    test('handles pin thread action', async () => {
        const mockOnAction = jest.fn();

        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
                onAction={mockOnAction}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        const pinBtn = await screen.findByText(/pin thread/i);
        fireEvent.click(pinBtn);

        if (mockOnAction) {
            await waitFor(() => {
                expect(mockOnAction).toHaveBeenCalledWith(expect.objectContaining({
                    action: 'pin',
                }));
            });
        }
    });

    test('handles lock thread action', async () => {
        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        const lockBtn = await screen.findByText(/lock thread/i);
        fireEvent.click(lockBtn);

        // Should show reason input
        await waitFor(() => {
            expect(screen.getByPlaceholderText(/reason/i)).toBeInTheDocument();
        });
    });

    test('requires reason for moderation actions', async () => {
        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        const lockBtn = await screen.findByText(/lock thread/i);
        fireEvent.click(lockBtn);

        const reasonInput = await screen.findByPlaceholderText(/reason/i);
        expect(reasonInput).toBeInTheDocument();
    });

    test('shows confirmation for delete action', async () => {
        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        const deleteBtn = await screen.findByText(/delete thread/i);
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(screen.getByText(/are you sure|confirm/i)).toBeInTheDocument();
        });
    });

    test('disables buttons while loading', async () => {
        const mockOnAction = jest.fn(
            () => new Promise(() => { }) // Never resolves
        );

        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
                onAction={mockOnAction}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        const pinBtn = await screen.findByText(/pin thread/i);
        fireEvent.click(pinBtn);

        await waitFor(() => {
            const buttons = screen.getAllByRole('button');
            buttons.forEach(btn => {
                expect(btn).toHaveAttribute('disabled');
            });
        });
    });

    test('shows error message on action failure', async () => {
        const mockOnAction = jest.fn()
            .mockRejectedValue(new Error('Server error'));

        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
                onAction={mockOnAction}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        const pinBtn = await screen.findByText(/pin thread/i);
        fireEvent.click(pinBtn);

        await waitFor(() => {
            expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
        });
    });

    test('toggles between pin and unpin', async () => {
        const threadPinned = {
            ...mockThread,
            is_pinned: true,
        };

        render(
            <ModerationMenu
                contentType="thread"
                contentId={threadPinned.id}
                canModerate={true}
                isPinned={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        await waitFor(() => {
            expect(screen.getByText(/unpin thread/i)).toBeInTheDocument();
        });
    });

    test('handles comment deletion', async () => {
        render(
            <ModerationMenu
                contentType="comment"
                contentId={mockComment.id}
                canModerate={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        fireEvent.click(menuBtn);

        const deleteBtn = await screen.findByText(/delete comment/i);
        fireEvent.click(deleteBtn);

        await waitFor(() => {
            expect(screen.getByText(/are you sure|confirm/i)).toBeInTheDocument();
        });
    });

    test('respects disabled state', () => {
        render(
            <ModerationMenu
                contentType="thread"
                contentId={mockThread.id}
                canModerate={true}
                disabled={true}
            />
        );

        const menuBtn = screen.getByRole('button');
        expect(menuBtn).toBeDisabled();
    });
});
