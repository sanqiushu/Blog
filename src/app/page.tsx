import BlogCard from "@/components/BlogCard";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import { readPosts } from "@/lib/storage";

// 使用 ISR，每60秒重新验证
export const revalidate = 60;

export default async function Home() {
  const allPosts = await readPosts();
  // 只显示已发布的文章，不显示草稿
  const blogPosts = allPosts.filter(post => !post.isDraft);
  
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-12 text-center">
            <div className="mb-6 flex justify-center">
              <Image 
                src="/favicon.svg" 
                alt="博客 Logo" 
                width={80} 
                height={80}
                className="h-20 w-20"
              />
            </div>
            <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">
              欢迎来到我的博客
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              分享技术见解、学习笔记和生活感悟
            </p>
          </div>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
            {blogPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
