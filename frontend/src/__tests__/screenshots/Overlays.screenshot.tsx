import { test, expect } from "@playwright/experimental-ct-react";
import { TimeUpOverlay } from "@/components/presentation/TimeUpOverlay";
import { ResumePrompt } from "@/components/presentation/ResumePrompt";
import { TotalScore } from "@/components/presentation/TotalScore";
import { RoundStats } from "@/components/presentation/RoundStats";
import { RoundHeader } from "@/components/presentation/RoundHeader";
import type { RoundMetrics } from "@/hooks/useRoundMetrics";
import type { PersistedGameSession } from "@/lib/sessionPersistence";

const mockMetrics: RoundMetrics = {
  questionsAnswered: 10,
  bankedThisRound: 3000,
  highestChainPosition: 7,
  highestChainValue: 4500,
  longestStreak: 4,
  strongestLinks: ["Alice", "Bob"],
};

test("TimeUpOverlay visible with metrics", async ({ mount }) => {
  const component = await mount(
    <TimeUpOverlay visible={true} metrics={mockMetrics} />
  );
  await expect(component).toHaveScreenshot("timeup-with-metrics.png", {
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
});

test("TimeUpOverlay visible without metrics", async ({ mount }) => {
  const component = await mount(<TimeUpOverlay visible={true} />);
  // Framer Motion animations cause minor pixel instability
  await expect(component).toHaveScreenshot("timeup-no-metrics.png", {
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
});

const mockSession: PersistedGameSession = {
  version: 1,
  currentRound: 3,
  chainPosition: 5,
  bankedThisRound: 1500,
  totalBanked: 4500,
  currentPlayerIndex: 2,
  timeUp: false,
  questionsAsked: 8,
  currentQuestionId: "q1",
  usedQuestionIds: [],
  timeRemaining: 80,
  isMuted: false,
  questionsAnswered: 8,
  highestChainPosition: 6,
  longestStreak: 3,
  currentStreak: 1,
  playerCorrectCounts: {},
  playerBankedCounts: {},
};

test("ResumePrompt with session data", async ({ mount }) => {
  const component = await mount(
    <ResumePrompt
      session={mockSession}
      onResume={() => {}}
      onNewGame={() => {}}
    />
  );
  await expect(component).toHaveScreenshot("resume-prompt.png");
});

test("TotalScore initial (0/0)", async ({ mount }) => {
  const component = await mount(
    <TotalScore totalBanked={0} bankedThisRound={0} />
  );
  await expect(component).toHaveScreenshot("totalscore-zero.png");
});

test("TotalScore with values", async ({ mount }) => {
  const component = await mount(
    <TotalScore totalBanked={15000} bankedThisRound={6500} />
  );
  await expect(component).toHaveScreenshot("totalscore-values.png");
});

test("RoundStats full metrics", async ({ mount }) => {
  const component = await mount(<RoundStats metrics={mockMetrics} />);
  await expect(component).toHaveScreenshot("roundstats-full.png", {
    maxDiffPixelRatio: 0.05,
    animations: "disabled",
  });
});

test("RoundHeader", async ({ mount }) => {
  const component = await mount(
    <RoundHeader roundNumber={1} playerName="Player 3" />
  );
  await expect(component).toHaveScreenshot("roundheader.png");
});
