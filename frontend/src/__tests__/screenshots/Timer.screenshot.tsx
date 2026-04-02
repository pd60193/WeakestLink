import { test, expect } from "@playwright/experimental-ct-react";
import { Timer } from "@/components/presentation/Timer";

test("Timer running at 2:30 (green)", async ({ mount }) => {
  const component = await mount(
    <Timer timeRemaining={150} totalTime={180} isRunning={true} isPaused={false} />
  );
  await expect(component).toHaveScreenshot("timer-running-green.png");
});

test("Timer running at 1:15 (yellow zone)", async ({ mount }) => {
  const component = await mount(
    <Timer timeRemaining={75} totalTime={180} isRunning={true} isPaused={false} />
  );
  await expect(component).toHaveScreenshot("timer-running-yellow.png");
});

test("Timer running at 0:08 (coral/red zone)", async ({ mount }) => {
  const component = await mount(
    <Timer timeRemaining={8} totalTime={180} isRunning={true} isPaused={false} />
  );
  // Pulse animation causes minor pixel instability
  await expect(component).toHaveScreenshot("timer-running-coral.png", {
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
});

test("Timer paused", async ({ mount }) => {
  const component = await mount(
    <Timer timeRemaining={120} totalTime={180} isRunning={true} isPaused={true} />
  );
  await expect(component).toHaveScreenshot("timer-paused.png");
});

test("Timer idle (not started)", async ({ mount }) => {
  const component = await mount(
    <Timer timeRemaining={180} totalTime={180} isRunning={false} isPaused={false} />
  );
  await expect(component).toHaveScreenshot("timer-idle.png");
});

test("Timer at 0:00", async ({ mount }) => {
  const component = await mount(
    <Timer timeRemaining={0} totalTime={180} isRunning={false} isPaused={false} />
  );
  await expect(component).toHaveScreenshot("timer-zero.png");
});
