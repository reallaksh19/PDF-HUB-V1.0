import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Modal } from './Modal';

describe('Modal Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nothing when not open', () => {
    render(<Modal isOpen={false} onClose={() => {}} title="Test">Content</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders and enforces aria roles when open', () => {
    render(<Modal isOpen={true} onClose={() => {}} title="Test Modal">Content</Modal>);
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(screen.getByText('Test Modal')).toHaveAttribute('id', 'modal-title');
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = vi.fn();
    render(<Modal isOpen={true} onClose={onClose} title="Test">Content</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
