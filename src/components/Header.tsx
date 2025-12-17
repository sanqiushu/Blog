"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/gallery", label: "相册" },
  { href: "/about", label: "关于" },
  { href: "/admin", label: "管理" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center gap-3 transition-opacity hover:opacity-80"
            prefetch={true}
          >
            <Image 
              src="/favicon.svg" 
              alt="博客 Logo" 
              width={32} 
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">
              我的博客
            </span>
          </Link>
          
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className={`transition-colors ${
                    isActive
                      ? "text-gray-900 font-medium dark:text-white"
                      : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
