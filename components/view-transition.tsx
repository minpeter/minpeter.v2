import type { FC, ReactNode } from "react";

export interface ViewTransitionProps {
  children?: ReactNode;
  name?: string;
}

/**
 * Keeps named-transition call sites stable while the native API is disabled
 * because it throws `InvalidStateError` during initial-page audits.
 */
export const ViewTransition: FC<ViewTransitionProps> = ({ children }) => (
  <>{children}</>
);
