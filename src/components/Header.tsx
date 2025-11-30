import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 transition-opacity hover:opacity-80">
            <Image 
              src="/favicon.svg" 
              alt="博客 Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
            />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              我的博客
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href="/" 
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              首页
            </Link>
            <Link 
              href="/gallery" 
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              相册
            </Link>
            <Link 
              href="/about" 
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              关于
            </Link>
            <Link 
              href="/admin" 
              className="text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              管理
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
