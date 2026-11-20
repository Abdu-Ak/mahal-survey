'use client';

import { useEffect, useId, useRef, useState } from 'react';

type Option = { value: string; label: string };

type Props = {
  id?: string;
  value: string;
  options: readonly Option[];
  placeholder: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function CompactSelect({ id, value, options, placeholder, onChange, onBlur }: Props) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const listId = `${selectId}-options`;
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [opensUp, setOpensUp] = useState(false);
  const selectedIndex = options.findIndex((option) => option.value === value);
  const selected = value && selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useEffect(() => {
    function closeOnOutsideClick(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }
    document.addEventListener('pointerdown', closeOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeOnOutsideClick);
  }, [onBlur]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function show() {
    const rect = rootRef.current?.getBoundingClientRect();
    if (rect) setOpensUp(window.innerHeight - rect.bottom < 260 && rect.top > 260);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
    onBlur?.();
    buttonRef.current?.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open && ['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      show();
      return;
    }
    if (!open) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % options.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      choose(activeIndex);
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false);
      onBlur?.();
    }
  }

  return (
    <div ref={rootRef} className="compact-select">
      <button
        ref={buttonRef}
        id={selectId}
        type="button"
        className="compact-select-trigger"
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? `${selectId}-option-${activeIndex}` : undefined}
        onClick={() => open ? setOpen(false) : show()}
        onKeyDown={handleKeyDown}
      >
        <span className={selected ? '' : 'text-slate-500'}>{selected?.label ?? placeholder}</span>
        <svg className={`compact-select-chevron ${open ? 'rotate-180' : ''}`} viewBox="0 0 20 20" aria-hidden="true">
          <path d="m5.5 7.5 4.5 4.5 4.5-4.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
        </svg>
      </button>
      {open && (
        <div id={listId} role="listbox" aria-labelledby={selectId} className={`compact-select-menu ${opensUp ? 'compact-select-menu-up' : ''}`}>
          {options.map((option, index) => (
            <button
              ref={(element) => { optionRefs.current[index] = element; }}
              id={`${selectId}-option-${index}`}
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              tabIndex={-1}
              className={`compact-select-option ${index === activeIndex ? 'is-active' : ''} ${option.value === value ? 'is-selected' : ''}`}
              onPointerMove={() => setActiveIndex(index)}
              onClick={() => choose(index)}
            >
              <span>{option.label}</span>
              {option.value === value && <span aria-hidden="true" className="text-emerald-700">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
