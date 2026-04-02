import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import React from "react";

afterEach(() => {
  cleanup();
});

// Mock framer-motion to render plain DOM elements in unit tests
vi.mock("framer-motion", () => {
  // Create a proxy that returns a forwardRef component for any element name
  const motionProxy = new Proxy(
    {},
    {
      get(_target, prop: string) {
        return React.forwardRef(function MotionMock(props: Record<string, unknown>, ref: React.Ref<unknown>) {
          // Strip framer-motion-specific props, pass the rest
          const {
            initial,
            animate,
            exit,
            transition,
            variants,
            whileHover,
            whileTap,
            whileFocus,
            whileInView,
            layoutId,
            layout,
            ...domProps
          } = props;
          return React.createElement(prop, { ...domProps, ref });
        });
      },
    }
  );

  return {
    motion: motionProxy,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({
      start: vi.fn(),
      stop: vi.fn(),
      set: vi.fn(),
    }),
  };
});
