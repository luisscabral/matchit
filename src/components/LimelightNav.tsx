import React, { useState, useRef, useLayoutEffect, cloneElement } from 'react';
import { cn } from "../lib/utils";

type NavItem = {
  id: string | number;
  icon: React.ReactElement;
  label?: string;
  onClick?: () => void;
};

type LimelightNavProps = {
  items: NavItem[];
  defaultActiveIndex?: number;
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

/**
 * An adaptive-width navigation bar with a "limelight" effect that highlights the active item.
 */
export const LimelightNav = ({
  items,
  defaultActiveIndex = 0,
  onTabChange,
  className,
  limelightClassName,
  iconContainerClassName,
  iconClassName,
}: LimelightNavProps) => {
  const [activeIndex, setActiveIndex] = useState(defaultActiveIndex);
  const [isReady, setIsReady] = useState(false);
  const navItemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (items.length === 0) return;

    const limelight = limelightRef.current;
    const activeItem = navItemRefs.current[activeIndex];
    
    if (limelight && activeItem) {
      const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;

      if (!isReady) {
        setTimeout(() => setIsReady(true), 50);
      }
    }
  }, [activeIndex, isReady, items]);

  if (items.length === 0) {
    return null; 
  }

  const handleItemClick = (index: number, itemOnClick?: () => void) => {
    setActiveIndex(index);
    onTabChange?.(index);
    itemOnClick?.();
  };

  return (
    <nav className={cn("relative inline-flex items-center h-16 rounded-xl bg-white/10 border border-white/20 px-2", className)}>
      {items.map(({ id, icon, label, onClick }, index) => (
          <a
            key={id}
            ref={(el) => { navItemRefs.current[index] = el; }}
            className={cn("relative z-20 flex h-full cursor-pointer items-center justify-center p-5 hover:bg-white/5 transition-colors duration-200 rounded-lg", iconContainerClassName)}
            onClick={() => handleItemClick(index, onClick)}
            aria-label={label}
          >
            {cloneElement(icon as React.ReactElement<any>, {
              className: cn(`w-6 h-6 text-white transition-opacity duration-100 ease-in-out ${
                activeIndex === index ? 'opacity-100' : 'opacity-40'
              }`, (icon.props as any).className, iconClassName),
            })}
          </a>
      ))}

      <div 
        ref={limelightRef}
        className={cn(`absolute top-0 z-10 w-11 h-[5px] rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)] ${
          isReady ? 'transition-[left] duration-400 ease-in-out' : ''
        }`, limelightClassName)}
        style={{ left: '-999px' }}
      >
        <div className="absolute left-[-30%] top-[5px] w-[160%] h-14 [clip-path:polygon(5%_100%,25%_0,75%_0,95%_100%)] bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
      </div>
    </nav>
  );
};
