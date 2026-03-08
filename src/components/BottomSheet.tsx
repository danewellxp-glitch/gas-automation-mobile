import React, { useState } from 'react';

interface BottomSheetProps {
    children: React.ReactNode;
    initialHeight?: number; // e.g. 250px
    maxHeight?: number | string; // e.g. '80vh'
}

export function BottomSheet({ children, initialHeight = 300, maxHeight = '85vh' }: BottomSheetProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: '#1A1F2E',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                padding: '24px 16px 32px',
                zIndex: 1000, // Above leaflet map
                transition: 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
                transform: expanded ? 'translateY(0)' : `translateY(calc(100% - ${initialHeight}px))`,
                maxHeight,
                overflowY: 'auto',
            }}
        >
            {/* Drag Handle to signal it's a sheet */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    width: 40,
                    height: 5,
                    backgroundColor: '#4B5A6E',
                    borderRadius: 3,
                    margin: '0 auto 20px',
                    cursor: 'pointer'
                }}
            />
            {children}
        </div>
    );
}
