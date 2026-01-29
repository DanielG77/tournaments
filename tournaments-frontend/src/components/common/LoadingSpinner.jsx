import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'lol-gold' }) => {
    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
    };

    const colorClasses = {
        'lol-gold': 'border-lol-gold',
        white: 'border-white',
        blue: 'border-blue-500',
        green: 'border-green-500',
        red: 'border-red-500',
    };

    return (
        <div className="flex items-center justify-center">
            <div
                className={`${sizeClasses[size]} animate-spin rounded-full border-4 border-solid ${colorClasses[color]} border-t-transparent`}
            ></div>
        </div>
    );
};

export default LoadingSpinner;