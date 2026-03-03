import React from "react";

type SelectProps = {
  label?: string;
  options: string[];
  error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({
  label,
  options,
  error,
  ...props
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600">{label}</label>

      <select
        {...props}
        className={`border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-black
          ${error ? "border-red-500" : "border-gray-300"}
        `}
      >
        <option value="">Select</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>

      {error && (
        <span className="text-xs text-red-500">{error}</span>
      )}
    </div>
  );
}
