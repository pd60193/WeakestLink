import { vi } from "vitest";

export interface MockAudioElement {
  preload: string;
  src: string;
  currentTime: number;
  muted: boolean;
  paused: boolean;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
}

export function createMockAudio(): MockAudioElement {
  const listeners: Record<string, Function[]> = {};

  const mock: MockAudioElement = {
    preload: "",
    src: "",
    currentTime: 0,
    muted: false,
    paused: true,
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(() => {
      mock.paused = true;
    }),
    addEventListener: vi.fn((event: string, cb: Function) => {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(cb);
    }),
    removeEventListener: vi.fn((event: string, cb: Function) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter((l) => l !== cb);
      }
    }),
  };

  // Fire canplaythrough async so isLoaded becomes true
  setTimeout(() => {
    listeners["canplaythrough"]?.forEach((cb) => cb());
  }, 0);

  return mock;
}

/** Set up global Audio constructor mock. Returns the last created mock instance. */
export function installAudioMock() {
  let lastMock: MockAudioElement | null = null;

  // Must be a class (not arrow fn) so `new Audio(...)` works
  const AudioConstructor = vi.fn(function (this: MockAudioElement, src?: string) {
    const mock = createMockAudio();
    if (src) mock.src = src;
    lastMock = mock;
    return mock;
  });

  vi.stubGlobal("Audio", AudioConstructor);

  return {
    getLastMock: () => lastMock,
    AudioConstructor,
  };
}
