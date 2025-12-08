import { useRef, useState, type MouseEvent } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface Tag {
    id: string | null;
    label: string;
    zh: string;
}

interface ScrollableTagListProps {
    tags: Tag[];
    activeTag: string | null;
    onSelect: (tagId: string | null) => void;
    language: 'en' | 'zh';
}

export function ScrollableTagList({ tags, activeTag, onSelect, language }: ScrollableTagListProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    // Mouse Events for Dragging
    const handleMouseDown = (e: MouseEvent) => {
        if (!listRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - listRef.current.offsetLeft);
        setScrollLeft(listRef.current.scrollLeft);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !listRef.current) return;
        e.preventDefault();
        const x = e.pageX - listRef.current.offsetLeft;
        const walk = (x - startX) * 1.0; // Natural 1:1 scroll
        listRef.current.scrollLeft = scrollLeft - walk;
    };

    // Prevent click event when dragging logic might have fired (optional, but good for "drag vs click" distinction)
    // For simple implementation, clicking a button inside might still trigger unless we block it.
    // Since buttons are children, we might need `pointer-events-none` on children while dragging? 
    // Or just simple `onClick` on buttons works fine if drag didn't move much.
    // Let's implement a simple threshold check if needed, but usually default behavior is distinct enough or we use `Capture`.

    return (
        <div
            className="relative w-full overflow-hidden"
            style={{
                // Gradient Mask for Fade Effect
                maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 12px, black calc(100% - 12px), transparent)',
            }}
        >
            <div
                ref={listRef}
                className={cn(
                    "flex gap-2 overflow-x-auto pb-1 pt-1 px-4 no-scrollbar select-none",
                    isDragging ? "cursor-grabbing" : "cursor-grab"
                )}
                onMouseDown={handleMouseDown}
                onMouseLeave={handleMouseLeave}
                onMouseUp={handleMouseUp}
                onMouseMove={handleMouseMove}
            >
                {tags.map((tag) => (
                    <button
                        key={tag.id || 'all'}
                        onClick={() => {
                            // Prevent click if we were dragging? 
                            // Simple heuristic: if isDragging is true (it is during mouse up?), actually isDragging sets to false on MouseUp.
                            // Better to handle click in the container? 
                            // Standard button onClick should fire. We rely on standard behavior.
                            onSelect(tag.id);
                        }}
                        className={cn(
                            "whitespace-nowrap px-4 py-1.5 rounded-full text-xs transition-colors border font-medium",
                            activeTag === tag.id
                                ? "bg-primary text-black border-primary shadow-[0_0_10px_rgba(0,255,255,0.4)]"
                                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:border-white/30 hover:text-white"
                        )}
                        // Prevent the drag from selecting text or image ghostly dragging
                        onDragStart={(e) => e.preventDefault()}
                    >
                        {language === 'zh' ? tag.zh : tag.label}
                    </button>
                ))}
                {/* Spacer for end of list */}
                <div className="w-2 shrink-0" />
            </div>
        </div>
    );
}
