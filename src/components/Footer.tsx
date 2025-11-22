export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © {new Date().getFullYear()} 我的博客. 保留所有权利.
          </p>
        </div>
      </div>
    </footer>
  );
}
