import type { Metadata } from "next";
import { prisma } from "@/lib/db";

interface Props {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://inkforge.press";

  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: { author: true },
    });

    if (!post || post.status !== "PUBLISHED") {
      return {
        title: "Monograph — Inkforge",
        description: "An inscribed literary work in the Inkforge digital press.",
        robots: { index: false, follow: false },
      };
    }

    const title = `${post.title} — Inkforge`;
    const description =
      post.excerpt ||
      post.subtitle ||
      `A published monograph by ${post.author.displayName || post.author.username} on Inkforge.`;

    return {
      title,
      description,
      alternates: {
        canonical: `${baseUrl}/read/${post.slug}`,
      },
      openGraph: {
        title,
        description,
        type: "article",
        url: `${baseUrl}/read/${post.slug}`,
        publishedTime: post.publishedAt?.toISOString(),
        authors: [post.author.displayName || post.author.username],
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Monograph — Inkforge",
    };
  }
}

export default function ReaderSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
