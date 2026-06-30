import { useContext } from 'react';
import type { Context } from 'react';

export function useRequiredContext<T>(context: Context<T | undefined>, errorMessage: string) {
  const value = useContext(context);

  if (!value) {
    throw new Error(errorMessage);
  }

  return value;
}
