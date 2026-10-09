import { useEffect, useState } from 'react';

/**
 * Trailing-edge debounce for a rapidly changing value — typically search text
 * on its way into a query key, so typing "cardiology" costs one request rather
 * than ten.
 *
 * Returns the previous value until `value` has been still for `delayMs`.
 */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return settled;
}
