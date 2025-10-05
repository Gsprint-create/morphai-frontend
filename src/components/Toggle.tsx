"use client";

import { useId } from "react";

type Props = {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
  disabled?: boolean;
};

export default function Toggle({ label, description, checked, onChange, disabled }: Props) {
  const id = useId();
  return (
    <label htmlFor={id} className={`flex items-start gap-3 select-none ${disabled ? "opacity-60" : ""}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition
          ${checked ? "bg-blue-600" : "bg-gray-400/60"}
          ${disabled ? "cursor-not-allowed" : ""}`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 translate-x-0.5 rounded-full bg-white shadow transition
            ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>

      <div className="leading-tight">
        <div className="font-medium">{label}</div>
        {description ? <div className="text-sm opacity-75">{description}</div> : null}
      </div>
    </label>
  );
}
