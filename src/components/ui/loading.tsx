import React from 'react';

/**
 * Enhanced loading spinner with smooth animations
 * Used throughout the app for better perceived performance
 */
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; text?: string }> = ({
    size = 'md',
    text
}) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3" role="status" aria-live="polite">
            <div className={`${sizeClasses[size]} animate-spin`}>
                <svg
                    className="text-primary-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            </div>
            {text && (
                <p className="text-sm text-muted-foreground animate-pulse">
                    {text}
                </p>
            )}
            <span className="sr-only">Loading...</span>
        </div>
    );
};

/**
 * Full-page loading state
 */
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-primary-200">
            <div className="text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
                        <span className="text-white font-bold text-2xl">P</span>
                    </div>
                    <h2 className="text-xl font-semibold text-deep-navy mb-2">PitchPerfect AI</h2>
                </div>
                <LoadingSpinner size="lg" text={message} />
            </div>
        </div>
    );
};

/**
 * Skeleton loader for content
 */
export const SkeletonLoader: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} aria-hidden="true" />
    );
};
