'use client'
import { useState, useRef } from 'react';
import Image from 'next/image';
import { motion, PanInfo } from 'framer-motion';

interface Card {
    id: number;
    src: string;
    name: string;
    role: string;
    zIndex: number;
}

interface ImgStackProps {
    items: {
        src: string;
        name: string;
        role: string;
    }[];
}

export default function ImgStack({ items }: ImgStackProps) {
    const [cards, setCards] = useState<Card[]>(
        items.map((item, index) => ({
            id: index,
            src: item.src,
            name: item.name,
            role: item.role,
            zIndex: 50 - (index * 10)
        }))
    );
    const [isAnimating, setIsAnimating] = useState<boolean>(false);
    const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const minDragDistance: number = 50;

    const getCardStyles = (index: number) => {
        // Always return tiled state - no initial animation to prevent jumping
        const baseRotation = 2; // Base tilt angle
        const rotationIncrement = 3; // Additional tilt per card
        const offsetIncrement = -12; // Horizontal offset per card
        const verticalOffset = -8; // Vertical offset per card

        return {
            x: (index * offsetIncrement) + 24, // Shift right to visually center the stack (compensating for negative offset)
            y: index * verticalOffset,
            // Keep first card straight (index 0), others get tilt
            rotate: index === 0 ? 0 : -(baseRotation + (index * rotationIncrement)),
            scale: 1,
            transition: { duration: 0.5 }
        };
    };

    const handleDragStart = (_: any, info: PanInfo) => {
        dragStartPos.current = { x: info.point.x, y: info.point.y };
    };

    const handleDragEnd = (_: any, info: PanInfo) => {
        const dragDistance = Math.sqrt(
            Math.pow(info.point.x - dragStartPos.current.x, 2) +
            Math.pow(info.point.y - dragStartPos.current.y, 2)
        );

        if (isAnimating) return;

        if (dragDistance < minDragDistance) {
            // Let Motion handle the snap-back automatically by not doing anything
            return;
        }

        setIsAnimating(true);

        // Move card to back and reassign proper z-index values
        setCards(prevCards => {
            const newCards = [...prevCards];
            const cardToMove = newCards.shift()!; // Remove first card
            newCards.push(cardToMove); // Add to end

            // Reassign z-index values to maintain proper stacking order
            return newCards.map((card, index) => ({
                ...card,
                zIndex: 50 - (index * 10) // Top card gets 50, next gets 40, etc.
            }));
        });

        // Brief delay to allow the position change to register
        setTimeout(() => {
            setIsAnimating(false);
        }, 300);
    };

    return (
        <div className="relative flex items-center justify-center w-full max-w-[300px] h-[400px] md:w-96 md:h-96 my-12 mx-auto">
            {cards.map((card: Card, index: number) => {
                const isTopCard = index === 0;
                const cardStyles = getCardStyles(index);
                const canDrag = isTopCard && !isAnimating;

                return (
                    <motion.div
                        key={card.id}
                        className="absolute w-64 md:w-72 aspect-[5/7] origin-bottom-center overflow-hidden rounded-xl shadow-2xl bg-white cursor-grab active:cursor-grabbing border border-gray-800"
                        style={{
                            zIndex: card.zIndex,
                        }}
                        animate={cardStyles}
                        drag={canDrag}
                        dragElastic={0.2}
                        dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
                        dragSnapToOrigin={true}
                        dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                        whileHover={isTopCard ? {
                            scale: 1.05,
                            transition: { duration: 0.2 }
                        } : {}}
                        whileDrag={{
                            scale: 1.1,
                            rotate: 0,
                            zIndex: 100,
                            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                            transition: { duration: 0.1 }
                        }}
                    >
                        <Image
                            src={card.src}
                            alt={`Card ${card.id + 1}`}
                            fill
                            className="object-cover pointer-events-none"
                            sizes="(max-width: 768px) 100vw, 300px"
                            draggable={false}
                        />
                        {/* Card Overlay for definition */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                        {/* Mentor Info */}
                        <div className="absolute bottom-6 left-6 pointer-events-none">
                            <h3 className="text-2xl font-black text-white uppercase leading-none mb-1 tracking-tight drop-shadow-md">
                                {card.name}
                            </h3>
                            <p className="text-xs font-bold text-white/80 uppercase tracking-[0.2em] drop-shadow-sm">
                                {card.role}
                            </p>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
