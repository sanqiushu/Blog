import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata = {
  title: "关于 - 我的博客",
  description: "了解更多关于我和这个博客的信息",
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-black">
      <Header />
      
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <h1 className="mb-8 text-4xl font-bold text-gray-900 dark:text-white">
            关于我
          </h1>
          
          <div className="prose prose-gray max-w-none dark:prose-invert">
            <div className="space-y-6 rounded-lg bg-white p-8 dark:bg-gray-900">
              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  欢迎来到我的博客
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  这是一个分享技术见解、学习笔记和生活感悟的地方。我热衷于探索新技术，
                  并通过写作的方式记录和分享我的学习历程。
                </p>
              </section>
              
              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  关注领域
                </h2>
                <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
                  <li>前端开发（React、Next.js、TypeScript）</li>
                  <li>Web 性能优化</li>
                  <li>用户体验设计</li>
                  <li>开源项目</li>
                </ul>
              </section>
              
              <section>
                <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
                  联系方式
                </h2>
                <p className="text-gray-700 dark:text-gray-300">
                  如果你想与我交流或合作，欢迎通过以下方式联系我：
                </p>
                <ul className="list-disc space-y-2 pl-6 text-gray-700 dark:text-gray-300">
                  <li>GitHub: github.com/your-username</li>
                  <li>Email: your.email@example.com</li>
                  <li>Twitter: @your-handle</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
