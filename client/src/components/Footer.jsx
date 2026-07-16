export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between gap-2">
        <span>
          © {new Date().getFullYear()} LearnHub · 全栈学习网站
        </span>
        <span>Java · Python · 前端 · AI 应用开发 · 面试题</span>
      </div>
    </footer>
  );
}
