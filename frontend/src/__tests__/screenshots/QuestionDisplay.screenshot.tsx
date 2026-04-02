import { test, expect } from "@playwright/experimental-ct-react";
import { QuestionDisplay } from "@/components/presentation/QuestionDisplay";

const sampleQuestion = {
  id: "q1",
  text: "What is the capital of France?",
  answer: "Paris",
  difficulty: "Easy" as const,
  round: 1,
};

const imageQuestion = {
  ...sampleQuestion,
  id: "q2",
  text: "Name this landmark",
  imageUrl: "https://placehold.co/400x300/FFD3E0/4A4A4A?text=Landmark",
};

test("QuestionDisplay hidden (Press Space)", async ({ mount }) => {
  const component = await mount(
    <QuestionDisplay question={sampleQuestion} revealed={false} questionNumber={1} />
  );
  await expect(component).toHaveScreenshot("question-hidden.png");
});

test("QuestionDisplay revealed text only", async ({ mount }) => {
  const component = await mount(
    <QuestionDisplay question={sampleQuestion} revealed={true} questionNumber={1} />
  );
  // Wait for typewriter to complete
  await component.page().waitForTimeout(2000);
  await expect(component).toHaveScreenshot("question-revealed.png");
});

test("QuestionDisplay revealed with image", async ({ mount }) => {
  const component = await mount(
    <QuestionDisplay question={imageQuestion} revealed={true} questionNumber={1} />
  );
  await component.page().waitForTimeout(2000);
  await expect(component).toHaveScreenshot("question-with-image.png");
});
