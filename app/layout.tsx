import type { Metadata } from "next";
import "./globals.css";

const title = "MNEMOSYNE-17 / 没有第二天";
const description = "一款非线性网页心理恐怖调查游戏。任选角色与取证顺序，穿过七段彼此侵蚀的日常录像，并证明自己看到的旧档案是否在点击之前存在。";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mnemosyne-17-echo.hongshaoapple.chatgpt.site";
const siteOrigin = new URL(siteUrl).origin;
const socialImage = `${siteOrigin}${basePath}/og.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin),
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: socialImage, width: 1200, height: 628, alt: "MNEMOSYNE-17 — 没有第二天" }],
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
