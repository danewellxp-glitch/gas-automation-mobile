import React, { useState, useRef, useEffect } from 'react';
import { IonIcon } from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';

interface SwipeButtonProps {
    onComplete: () => void;
    loading?: boolean;
    text?: string;
    color?: string; // e.g. 'linear-gradient(135deg, #FF6B35, #E55A26)' or '#FFD100' for Uber-like yellow
    textColor?: string;
}

export function SwipeButton({
    onComplete,
    loading = false,
    text = 'Deslize para Confirmar',
    color = '#FFD100', // Uber-like yellow
    textColor = '#000000',
}: SwipeButtonProps) {
    const [position, setPosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const knobRef = useRef<HTMLDivElement>(null);
    const maxDrag = useRef(0);
    const completed = useRef(false);

    useEffect(() => {
        if (containerRef.current && knobRef.current) {
            maxDrag.current = containerRef.current.offsetWidth - knobRef.current.offsetWidth - 8;
        }
    }, []);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (loading || completed.current) return;
        setIsDragging(true);
        if (e.target instanceof Element) e.target.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging || loading || completed.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        let newX = e.clientX - containerRect.left - knobRef.current!.offsetWidth / 2;

        if (newX < 0) newX = 0;
        if (newX > maxDrag.current) newX = maxDrag.current;

        setPosition(newX);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isDragging || loading || completed.current) return;
        setIsDragging(false);
        if (e.target instanceof Element) e.target.releasePointerCapture(e.pointerId);

        if (position >= maxDrag.current * 0.9) {
            // Completed!
            setPosition(maxDrag.current);
            completed.current = true;
            onComplete();
        } else {
            // Snap back
            setPosition(0);
        }
    };

    const isLoading = loading || completed.current;

    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                height: 56,
                borderRadius: 28,
                background: isLoading ? 'rgba(255, 255, 255, 0.1)' : color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: isLoading ? 'none' : '0 4px 16px rgba(0,0,0,0.1)',
                opacity: isLoading ? 0.7 : 1,
                transition: 'background 0.3s, opacity 0.3s',
                touchAction: 'none', // Prevent scrolling while dragging
            }}
        >
            {/* Background text */}
            <span
                style={{
                    position: 'absolute',
                    fontWeight: 700,
                    fontSize: 16,
                    color: isLoading ? '#8B9AB0' : textColor,
                    opacity: isDragging && !completed.current ? Math.max(0, 1 - position / (maxDrag.current * 0.5)) : 1,
                    transition: 'opacity 0.1s',
                    pointerEvents: 'none',
                    letterSpacing: 0.5,
                }}
            >
                {isLoading ? 'Aguarde...' : text}
            </span>

            {/* The draggable knob */}
            {!isLoading && (
                <div
                    ref={knobRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    style={{
                        position: 'absolute',
                        left: 4,
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        background: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'grab',
                        transform: `translateX(${position}px)`,
                        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        zIndex: 2,
                    }}
                >
                    <IonIcon icon={chevronForwardOutline} style={{ fontSize: 24, color: '#000' }} />
                    <IonIcon icon={chevronForwardOutline} style={{ fontSize: 24, color: '#000', marginLeft: -14, opacity: 0.5 }} />
                </div>
            )}
        </div>
    );
}
