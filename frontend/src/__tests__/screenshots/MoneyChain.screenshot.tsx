import { test, expect } from "@playwright/experimental-ct-react";
import { MoneyChain } from "@/components/presentation/MoneyChain";

test("MoneyChain position 1 (bottom active)", async ({ mount }) => {
  const component = await mount(<MoneyChain chainPosition={1} />);
  await expect(component).toHaveScreenshot("moneychain-pos1.png");
});

test("MoneyChain position 5 (mid-chain)", async ({ mount }) => {
  const component = await mount(<MoneyChain chainPosition={5} />);
  await expect(component).toHaveScreenshot("moneychain-pos5.png");
});

test("MoneyChain position 9 (top, chili)", async ({ mount }) => {
  const component = await mount(<MoneyChain chainPosition={9} />);
  await expect(component).toHaveScreenshot("moneychain-pos9.png");
});
