import { useEffect, useRef, useState } from "react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  displayLabel: string;
  onSelect: (value: string) => void;
}

/**
 * A minimal custom dropdown, used in place of a native <select> specifically
 * because native selects don't fire onChange when re-selecting the value
 * that's already chosen, and don't fire onBlur when a picked option closes
 * the dropdown while keeping focus on the same element. Both of those gaps
 * made it impossible to reliably collapse a native select back to text.
 * A fully custom menu, where every option click is a real onClick we
 * control, closes correctly in every case.
 */
export function Dropdown({ options, displayLabel, onSelect }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <p
        className="issue-meta"
        onClick={() => setOpen((o) => !o)}
        style={{ cursor: "pointer", textDecoration: "underline dotted", marginBottom: 8 }}
      >
        {displayLabel}
      </p>
      {open && (
        <div className="dropdown-menu">
          {options.map((opt) => (
            <div
              key={opt.value}
              className="dropdown-option"
              onClick={() => {
                onSelect(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}