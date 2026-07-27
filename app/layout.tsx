import type { Metadata } from "next";
import "./globals.css";

const title = "MNEMOSYNE-17 / 第十七份证词";
const description = "临海认知续存研究所 B2 事故封存资料数字化入口。馆藏编号 M17-0417，访问与修改操作将写入当前人员索引。";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mnemosyne-17-echo.hongshaoapple.chatgpt.site";
const siteOrigin = new URL(siteUrl).origin;
const socialImage = `${siteOrigin}${basePath}/og-v2.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: socialImage, width: 1200, height: 628, alt: "MNEMOSYNE-17 — 第十七份证词" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
