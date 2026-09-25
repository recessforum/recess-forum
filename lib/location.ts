/* Zip → state (approximate, by 3-digit prefix — good enough until this is
   backed by a real zip database or geocoding API; wrong at boundaries).
   We only ever store/display the derived state, never the raw zip, to keep
   posts from exposing a parent's precise location. */
const ZIP3_RANGES: [number, number, string][] = [
  [0, 5, "NY"], [6, 9, "PR"],
  [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"], [50, 59, "VT"], [60, 69, "CT"],
  [70, 89, "NJ"],
  [100, 149, "NY"],
  [150, 196, "PA"],
  [197, 199, "DE"],
  [200, 205, "DC"],
  [206, 219, "MD"],
  [220, 246, "VA"],
  [247, 268, "WV"],
  [270, 289, "NC"],
  [290, 299, "SC"],
  [300, 319, "GA"], [398, 399, "GA"],
  [320, 339, "FL"], [341, 349, "FL"],
  [350, 369, "AL"],
  [370, 385, "TN"],
  [386, 397, "MS"],
  [400, 427, "KY"],
  [430, 459, "OH"],
  [460, 479, "IN"],
  [480, 499, "MI"],
  [500, 528, "IA"],
  [530, 549, "WI"],
  [550, 567, "MN"],
  [570, 577, "SD"],
  [580, 588, "ND"],
  [590, 599, "MT"],
  [600, 629, "IL"],
  [630, 658, "MO"],
  [660, 679, "KS"],
  [680, 693, "NE"],
  [700, 714, "LA"],
  [716, 729, "AR"],
  [730, 731, "OK"], [734, 741, "OK"], [743, 749, "OK"],
  [750, 799, "TX"], [885, 885, "TX"],
  [800, 816, "CO"],
  [820, 831, "WY"],
  [832, 838, "ID"],
  [840, 847, "UT"],
  [850, 865, "AZ"],
  [870, 884, "NM"],
  [889, 898, "NV"],
  [900, 961, "CA"],
  [967, 968, "HI"],
  [970, 979, "OR"],
  [980, 994, "WA"],
  [995, 999, "AK"],
];

export function zipToState(zip: string | null | undefined): string | null {
  const digits = (zip || "").replace(/\D/g, "");
  if (digits.length < 3) return null;
  const prefix = parseInt(digits.slice(0, 3), 10);
  for (const [min, max, state] of ZIP3_RANGES) {
    if (prefix >= min && prefix <= max) return state;
  }
  return null;
}

export const US_STATES = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
  ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
  ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

/* Outside-the-US locations. Posts store these in `country` (ISO 3166 alpha-2)
   with `state` left null; US posts keep country "US" plus a state code.
   "ZZ" is the ISO user-assigned code, used for "Other country". */
export const COUNTRIES = [
  ["AU", "Australia"], ["CA", "Canada"], ["GB", "United Kingdom"], ["IE", "Ireland"], ["NZ", "New Zealand"],
  ["KR", "South Korea"], ["JP", "Japan"], ["CN", "China"], ["HK", "Hong Kong"], ["TW", "Taiwan"],
  ["SG", "Singapore"], ["IN", "India"], ["PH", "Philippines"], ["VN", "Vietnam"], ["TH", "Thailand"],
  ["MY", "Malaysia"], ["ID", "Indonesia"], ["MX", "Mexico"], ["BR", "Brazil"], ["AR", "Argentina"],
  ["CL", "Chile"], ["CO", "Colombia"], ["DE", "Germany"], ["FR", "France"], ["ES", "Spain"],
  ["IT", "Italy"], ["NL", "Netherlands"], ["CH", "Switzerland"], ["SE", "Sweden"], ["NO", "Norway"],
  ["DK", "Denmark"], ["IL", "Israel"], ["AE", "United Arab Emirates"], ["SA", "Saudi Arabia"], ["ZA", "South Africa"],
  ["ZZ", "Other country"],
].map(([code, name]) => ({ code, name }));

export interface Place {
  state: string | null;
  country: string;
}

/* One <select> value encodes either a US state ("NY") or a country ("c:AU"). */
export const encodePlace = (p: Place | null): string =>
  !p ? "" : p.country === "US" ? p.state ?? "" : `c:${p.country}`;

export function decodePlace(value: string): Place | null {
  if (!value) return null;
  if (value.startsWith("c:")) {
    const code = value.slice(2);
    return COUNTRIES.some((c) => c.code === code) ? { state: null, country: code } : null;
  }
  return US_STATES.some((s) => s.code === value) ? { state: value, country: "US" } : null;
}

/** Full name for an encoded place value, for filter chips ("New York", "Australia"). */
export function placeName(value: string | null): string | null {
  const p = value ? decodePlace(value) : null;
  if (!p) return null;
  return p.country === "US" ? US_STATES.find((s) => s.code === p.state)?.name ?? null : COUNTRIES.find((c) => c.code === p.country)?.name ?? null;
}

/** Short label for a post or circle location: "NY" for US states, the country
 *  name elsewhere. null when there's nothing to show. */
export function placeLabel(state: string | null | undefined, country: string | null | undefined): string | null {
  if (country && country !== "US") return COUNTRIES.find((c) => c.code === country)?.name ?? country;
  return state || null;
}

export const isValidCountry = (code: string) => code === "US" || COUNTRIES.some((c) => c.code === code);
export const isValidState = (code: string) => US_STATES.some((s) => s.code === code);
