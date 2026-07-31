import type { Metadata } from "next";
import "./globals.css";
import "./editorial.css";
import "./home.css";
import { AppFrame } from "@/src/components/AppFrame";
import { AppProvider } from "@/src/context/AppProvider";

export const metadata: Metadata = {
  title: {
    default: "再等等 · 给购买决定一点时间",
    template: "%s · 再等等",
  },
  description:
    "一个本地优先的购物冷静器：记下想买的东西，等一等，再用真实感受做决定。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  applicationName: "再等等",
  keywords: ["购物冷静器", "购买决策", "消费记录", "本地优先"],
  openGraph: {
    title: "再等等 · 给购买决定一点时间",
    description:
      "记下想买的东西，等一等，再用真实感受做决定。数据默认只保存在你的浏览器。",
    type: "website",
    locale: "zh_CN",
    images: [
      {
        url: "/og-paper-pause.png",
        width: 1730,
        height: 909,
        alt: "再等等：给购买决定一点时间",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "再等等 · 给购买决定一点时间",
    description:
      "记下想买的东西，等一等，再用真实感受做决定。数据默认只保存在你的浏览器。",
    images: ["/og-paper-pause.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>
        <AppProvider>
          <AppFrame>{children}</AppFrame>
        </AppProvider>
      </body>
    </html>
  );
}
