import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import AboutEditButton from "@/components/AboutEditButton";
import { readAboutContent } from "@/lib/storage";

// 使用 ISR，每120秒重新验证
export const revalidate = 120;

export const metadata = {
  title: "关于 - 我的博客",
  description: "了解更多关于我和这个博客的信息",
};

export default async function AboutPage() {
  const aboutContent = await readAboutContent();

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="flex items-start justify-between gap-4 mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              关于我
            </h1>
            <AboutEditButton />
          </div>
          
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <div className="rounded-lg bg-white p-8 dark:bg-gray-900">
              <MarkdownRenderer content={aboutContent.content} />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
