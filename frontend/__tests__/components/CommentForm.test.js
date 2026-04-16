/**
 * Frontend component tests with Jest and React Testing Library
 */

import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CommentForm from '@/components/CommentForm';

describe('CommentForm Component', () => {
    const mockOnSubmit = jest.fn();

    beforeEach(() => {
        mockOnSubmit.mockClear();
        localStorage.clear();
    });

    test('renders comment form with placeholder', () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        expect(textarea).toBeInTheDocument();
    });

    test('displays character counter', () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        fireEvent.change(textarea, { target: { value: 'Test comment' } });

        expect(screen.getByText(/12 \/ 5000/)).toBeInTheDocument();
    });

    test('shows green counter for valid length', () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        fireEvent.change(textarea, { target: { value: 'Valid comment' } });

        const counter = screen.getByText(/13 \/ 5000/);
        expect(counter).toHaveClass('text-green-500');
    });

    test('shows yellow counter when approaching limit', () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        const longText = 'a'.repeat(4800);
        fireEvent.change(textarea, { target: { value: longText } });

        const counter = screen.getByText(/4800 \/ 5000/);
        expect(counter).toHaveClass('text-yellow-500');
    });

    test('shows red counter at max length', () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        const maxText = 'a'.repeat(5000);
        fireEvent.change(textarea, { target: { value: maxText } });

        const counter = screen.getByText(/5000 \/ 5000/);
        expect(counter).toHaveClass('text-red-500');
    });

    test('prevents input beyond max length', () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        const veryLongText = 'a'.repeat(6000);
        fireEvent.change(textarea, { target: { value: veryLongText } });

        expect(textarea.value.length).toBeLessThanOrEqual(5000);
    });

    test('submits form with content', async () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        const submitBtn = screen.getByRole('button', { name: /post comment/i });

        fireEvent.change(textarea, { target: { value: 'Test comment content' } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(mockOnSubmit).toHaveBeenCalledWith({
                content: 'Test comment content',
            });
        });
    });

    test('disables submit button for empty comment', () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const submitBtn = screen.getByRole('button', { name: /post comment/i });
        expect(submitBtn).toBeDisabled();
    });

    test('enables submit button with valid content', () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        fireEvent.change(textarea, { target: { value: 'Valid comment' } });

        const submitBtn = screen.getByRole('button', { name: /post comment/i });
        expect(submitBtn).not.toBeDisabled();
    });

    test('displays reply-to badge when replying', () => {
        const replyToAuthor = 'John Doe';
        render(
            <CommentForm onSubmit={mockOnSubmit} replyingTo={replyToAuthor} />
        );

        expect(screen.getByText(new RegExp(`Replying to ${replyToAuthor}`))).toBeInTheDocument();
    });

    test('displays error message on submission failure', async () => {
        mockOnSubmit.mockRejectedValue(new Error('Server error'));

        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        const submitBtn = screen.getByRole('button', { name: /post comment/i });

        fireEvent.change(textarea, { target: { value: 'Test comment' } });
        fireEvent.click(submitBtn);

        await waitFor(() => {
            expect(screen.getByText(/failed to post comment/i)).toBeInTheDocument();
        });
    });

    test('clears form after successful submission', async () => {
        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        fireEvent.change(textarea, { target: { value: 'Test comment' } });
        fireEvent.click(screen.getByRole('button', { name: /post comment/i }));

        await waitFor(() => {
            expect(textarea.value).toBe('');
        });
    });

    test('shows loading state while submitting', () => {
        mockOnSubmit.mockImplementation(() => new Promise(() => { })); // Never resolves

        render(<CommentForm onSubmit={mockOnSubmit} />);

        const textarea = screen.getByPlaceholderText(/Share your thoughts/i);
        const submitBtn = screen.getByRole('button', { name: /post comment/i });

        fireEvent.change(textarea, { target: { value: 'Test' } });
        fireEvent.click(submitBtn);

        expect(submitBtn).toHaveAttribute('disabled');
    });

    test('respects custom placeholder', () => {
        const customPlaceholder = 'Write something amazing...';
        render(
            <CommentForm
                onSubmit={mockOnSubmit}
                placeholder={customPlaceholder}
            />
        );

        expect(screen.getByPlaceholderText(customPlaceholder)).toBeInTheDocument();
    });
});
