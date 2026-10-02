import { vi } from 'vitest';

vi.mock('framer-motion', async () => {
  const React = await import('react');

  const motion = new Proxy(
    {} as Record<string, React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLElement>>>,
    {
      get(_, tag: string) {
        const Component = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
          ({ children, ...props }, ref) => React.createElement(tag, { ...props, ref }, children)
        );
        Component.displayName = `motion.${tag}`;
        return Component;
      },
    }
  );

  function AnimatePresence({ children }: { children?: React.ReactNode }) {
    return React.createElement(React.Fragment, null, children);
  }

  return { motion, AnimatePresence, useReducedMotion: () => false };
});
