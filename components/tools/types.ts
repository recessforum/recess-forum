import type { ReactNode } from "react";

/** One tool: its starting data, a default document title, the form, and the printable document. */
export interface ToolDef<T> {
  initial: () => T;
  titleOf: (data: T) => string;
  Editor: (props: { data: T; set: (data: T) => void }) => ReactNode;
  Doc: (props: { data: T }) => ReactNode;
}
