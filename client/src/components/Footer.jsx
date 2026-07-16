import LINKS, { WECHAT, SocialLinkList } from './AuthorSocial.jsx';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10">
        {/* 社交链接 */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            关注我
          </h4>
          <SocialLinkList compact />
        </div>

        {/* 公众号与版权 */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-6 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-green-100 text-green-700 text-lg font-bold">
              拾
            </span>
            <div>
              <div className="font-semibold text-gray-700 text-sm">
                {WECHAT.name}
              </div>
              <div className="text-xs text-gray-400">{WECHAT.desc}</div>
            </div>
          </div>

          <div className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} LearnHub &middot; 全栈学习网站 &middot; Java &middot; Python &middot; 前端 &middot; AI 应用开发 &middot; 面试题
          </div>
        </div>
      </div>
    </footer>
  );
}
