import { notFound } from "next/navigation";
import Link from "next/link";
import { readPosts } from "@/lib/storage";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BlogPostPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const posts = await readPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const posts = await readPosts();
  const post = posts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black">
      <Header />
      
      <main className="flex-1">
        <article className="mx-auto max-w-4xl px-4 py-12">
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            ← 返回首页
          </Link>
          
          <header className="mb-8">
            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              {post.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <time>{post.date}</time>
              {post.readTime && <span>• {post.readTime}</span>}
              <span>• {post.author}</span>
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>
          
          <div className="prose prose-gray max-w-none dark:prose-invert prose-headings:font-bold prose-a:text-blue-600 dark:prose-a:text-blue-400">
            <div className="whitespace-pre-wrap rounded-lg bg-white p-8 dark:bg-gray-900">
              {post.content}
            </div>
          </div>
        </article>
      </main>
      
      <Footer />
    </div>
  );
}
