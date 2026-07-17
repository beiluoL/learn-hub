import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import BackToTop from './components/BackToTop.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { PageSkeleton } from './components/Skeleton.jsx';

// 路由级代码分割：首屏只加载 Home，其余页面按需加载
const Home = lazy(() => import('./pages/Home.jsx'));
const Category = lazy(() => import('./pages/Category.jsx'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail.jsx'));
const Interviews = lazy(() => import('./pages/Interviews.jsx'));
const InterviewDetail = lazy(() => import('./pages/InterviewDetail.jsx'));
const Search = lazy(() => import('./pages/Search.jsx'));
const KnowledgeMap = lazy(() => import('./pages/KnowledgeMap.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

export default function App() {
  const location = useLocation();
  return (
    <div className="flex flex-col min-h-full">
      {/* 键盘用户：Tab 首聚焦时显现，跳过顶部导航直达主内容 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:z-[100] focus:top-3 focus:left-3 focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand-300"
      >
        跳到主要内容
      </a>
      <Header />
      <main id="main-content" className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <div key={location.pathname} className="animate-page-in">
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/category/:catId" element={<Category />} />
                <Route path="/article/*" element={<ArticleDetail />} />
                <Route path="/interviews" element={<Interviews />} />
                <Route path="/interview/*" element={<InterviewDetail />} />
                <Route path="/map" element={<KnowledgeMap />} />
                <Route path="/search" element={<Search />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Suspense>
        </ErrorBoundary>
      </main>
      <Footer />
      <BackToTop />
    </div>
  );
}
