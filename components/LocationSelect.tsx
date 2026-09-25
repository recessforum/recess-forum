"use client";

import { COUNTRIES, US_STATES } from "@/lib/location";

/** US states first, then other countries. The value is an encoded place
 *  (see encodePlace/decodePlace in lib/location). */
export function LocationSelect({
  value,
  onChange,
  placeholder,
  className,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
  id?: string;
}) {
  return (
    <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={className}>
      <option value="">{placeholder}</option>
      <optgroup label="United States">
        {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
      </optgroup>
      <optgroup label="Outside the US">
        {COUNTRIES.map((c) => <option key={c.code} value={`c:${c.code}`}>{c.name}</option>)}
      </optgroup>
    </select>
  );
}
