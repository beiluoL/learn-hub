// 作者社交链接 — 供 Home "关注我" 区块和 Footer 复用
const LINKS = [
  {
    label: 'GitHub 主页',
    url: 'https://github.com/beiluoL',
    ico: 'git',
    desc: '开源项目与代码仓库',
  },
  {
    label: 'GitHub Pages',
    url: 'https://beiluol.github.io/beiluoL/',
    ico: 'web',
    desc: '个人技术主页',
  },
  {
    label: '博客园',
    url: 'https://www.cnblogs.com/beiluoL',
    ico: 'blog',
    desc: '技术文章积累',
  },
  {
    label: 'CSDN',
    url: 'https://blog.csdn.net/beiluoL',
    ico: 'csdn',
    desc: '原创技术博客',
  },
  {
    label: 'Gitee',
    url: 'https://gitee.com/beiluol',
    ico: 'gitee',
    desc: '国内代码托管',
  },
];

export const WECHAT = {
  name: '北落拾光',
  desc: '分享全栈开发与 AI 实战',
};

export default LINKS;

/* ---------------------------------- 图标 ---------------------------------- */
function Icon({ ico }) {
  switch (ico) {
    case 'git':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0Z" />
        </svg>
      );
    case 'web':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
        </svg>
      );
    case 'blog':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case 'csdn':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <text x="0" y="18" fontSize="18" fontWeight="bold" fill="currentColor">C</text>
        </svg>
      );
    case 'gitee':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.984 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0011.984 0zm6.09 5.333c.328 0 .596.27.596.602v1.083a.6.6 0 01-.596.602H9.143l1.604 3.128h6.922c.328 0 .596.27.596.602v1.083a.6.6 0 01-.596.602H9.995l2.652 5.176a.602.602 0 01-.098.737.595.595 0 01-.85-.049L5.593 9.036a.6.6 0 01.03-.822l5.855-5.235a.595.595 0 01.85.048c.167.193.143.478-.05.642l-3.182 2.523h8.978v-.86z" />
        </svg>
      );
    default:
      return null;
  }
}

/* ---------------------------------- 内联社交链接列表 ---------------------------------- */
export function SocialLinkList({ compact = false }) {
  return (
    <div className={compact ? 'flex flex-wrap gap-3' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}>
      {LINKS.map((l) => (
        <a
          key={l.url}
          href={l.url}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-brand-300 hover:text-brand-600 hover:shadow-sm ${
            compact ? 'flex-1 min-w-[140px] justify-center' : ''
          }`}
        >
          <span className="text-brand-600">
            <Icon ico={l.ico} />
          </span>
          <span>{l.label}</span>
        </a>
      ))}
    </div>
  );
}
