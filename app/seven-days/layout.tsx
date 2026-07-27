import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "B2 七夜回程 / MNEMOSYNE-17",
  description: "沿同一条地下二层路线走过七夜。每一夜，日常都会被第十七号证词替换一部分。",
};

export default function SevenDaysLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
