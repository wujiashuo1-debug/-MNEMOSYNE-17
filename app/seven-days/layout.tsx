import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "B2 七日回程 / MNEMOSYNE-17",
  description: "沿同一条地下二层路线走过七日。每天都会有一部分日常被共同证词替换。",
};

export default function SevenDaysLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
