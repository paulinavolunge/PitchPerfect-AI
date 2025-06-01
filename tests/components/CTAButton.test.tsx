
import React from 'react';
import { render, screen, fireEvent } from '@/utils/testUtils';
import CTAButton from '@/components/ui/cta-button';

describe('CTAButton', () => {
  it('renders correctly with default props', () => {
    render(<CTAButton>Click me</CTAButton>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-gradient-to-r', 'from-[#8B5CF6]', 'to-[#7C3AED]');
  });

  it('shows loading state correctly', () => {
    render(
      <CTAButton loading={true}>
        Loading Button
      </CTAButton>
    );
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(
      <CTAButton onClick={handleClick}>
        Clickable Button
      </CTAButton>
    );
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies different variants correctly', () => {
    const { rerender } = render(
      <CTAButton variant="secondary">Secondary Button</CTAButton>
    );
    
    expect(screen.getByRole('button')).toHaveClass('bg-white', 'text-[#8B5CF6]');
    
    rerender(<CTAButton variant="outline">Outline Button</CTAButton>);
    expect(screen.getByRole('button')).toHaveClass('border-2', 'border-[#8B5CF6]');
  });

  it('shows arrow by default and hides when specified', () => {
    const { rerender } = render(<CTAButton>With Arrow</CTAButton>);
    
    expect(screen.getByTestId('arrow-right-icon')).toBeInTheDocument();
    
    rerender(<CTAButton showArrow={false}>Without Arrow</CTAButton>);
    expect(screen.queryByTestId('arrow-right-icon')).not.toBeInTheDocument();
  });

  it('applies full width when specified', () => {
    render(<CTAButton fullWidth>Full Width Button</CTAButton>);
    
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });
});
