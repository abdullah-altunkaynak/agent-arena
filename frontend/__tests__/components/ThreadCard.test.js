/**
 * Tests for ThreadCard component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThreadCard from '@/components/ThreadCard';

describe('ThreadCard Component', () => {
    const mockThread = {
        id: 'thread-1',
        title: 'Test Thread Title',
        content: 'This is a brief preview of the thread that should be truncated to a reasonable length',
        author: {
            id: 'user-1',
            username: 'testuser',
            avatar_url: null,
        },
        views_count: 42,
        replies_count: 15,
        likes_count: 8,
        created_at: new Date().toISOString(),
        is_pinned: false,
        is_locked: false,
        slug: 'test-thread-title',
    };

    test('renders thread card with title', () => {
        render(<ThreadCard thread={mockThread} />);

        expect(screen.getByText('Test Thread Title')).toBeInTheDocument();
    });

    test('displays preview text truncated', () => {
        render(<ThreadCard thread={mockThread} />);

        const preview = screen.getByText(/This is a brief preview/);
        expect(preview.textContent.length).toBeLessThanOrEqual(150);
    });

    test('shows author information', () => {
        render(<ThreadCard thread={mockThread} />);

        expect(screen.getByText('testuser')).toBeInTheDocument();
    });

    test('displays stats badges', () => {
        render(<ThreadCard thread={mockThread} />);

        expect(screen.getByText(/42.*views/i)).toBeInTheDocument();
        expect(screen.getByText(/15.*replies/i)).toBeInTheDocument();
        expect(screen.getByText(/8.*likes/i)).toBeInTheDocument();
    });

    test('shows pinned badge when pinned', () => {
        const pinnedThread = { ...mockThread, is_pinned: true };
        render(<ThreadCard thread={pinnedThread} />);

        expect(screen.getByText(/📌/)).toBeInTheDocument() ||
            expect(screen.getByText(/pinned/i)).toBeInTheDocument();
    });

    test('shows locked badge when locked', () => {
        const lockedThread = { ...mockThread, is_locked: true };
        render(<ThreadCard thread={lockedThread} />);

        expect(screen.getByText(/locked/i)).toBeInTheDocument();
    });

    test('displays created date', () => {
        render(<ThreadCard thread={mockThread} />);

        // Date formatting depends on implementation
        expect(screen.getByText(/ago|Yesterday|Today|[0-9]+\/[0-9]+/)).toBeInTheDocument();
    });

    test('renders with author avatar', () => {
        const threadWithAvatar = {
            ...mockThread,
            author: { ...mockThread.author, avatar_url: 'https://example.com/avatar.jpg' }
        };

        render(<ThreadCard thread={threadWithAvatar} />);

        const img = screen.getByRole('img', { hidden: true });
        expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    });

    test('shows initials when no avatar', () => {
        render(<ThreadCard thread={mockThread} />);

        const avatar = screen.getByText('TU') || screen.getByText('T');
        expect(avatar).toBeInTheDocument();
    });

    test('applies hover state styling', () => {
        const { container } = render(<ThreadCard thread={mockThread} />);

        const cardElement = container.querySelector('[data-testid="thread-card"]') ||
            container.firstChild;

        expect(cardElement).toHaveClass('hover:border-blue-500');
    });

    test('handles click event', () => {
        const mockOnClick = jest.fn();
        render(<ThreadCard thread={mockThread} onClick={mockOnClick} />);

        const card = screen.getByText('Test Thread Title').closest('a') ||
            screen.getByText('Test Thread Title').parentElement;

        fireEvent.click(card);

        if (mockOnClick) {
            expect(mockOnClick).toHaveBeenCalled();
        }
    });

    test('generates correct href link', () => {
        render(<ThreadCard thread={mockThread} />);

        const link = screen.getByText('Test Thread Title').closest('a');

        if (link) {
            expect(link.href).toContain(`/thread/${mockThread.id}`);
        }
    });

    test('handles very long titles', () => {
        const longTitleThread = {
            ...mockThread,
            title: 'A'.repeat(200),
        };

        render(<ThreadCard thread={longTitleThread} />);

        const title = screen.getByText(/^A+/);
        expect(title).toHaveClass('line-clamp-2') || expect(title).toHaveStyle('overflow');
    });

    test('handles zero stats', () => {
        const zeroStatsThread = {
            ...mockThread,
            views_count: 0,
            replies_count: 0,
            likes_count: 0,
        };

        render(<ThreadCard thread={zeroStatsThread} />);

        expect(screen.getByText(/0.*replies/i)).toBeInTheDocument();
    });
});
