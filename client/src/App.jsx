import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Category from './pages/Category.jsx';
import ArticleDetail from './pages/ArticleDetail.jsx';
import Interviews from './pages/Interviews.jsx';
import Search from './pages/Search.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:catId" element={<Category />} />
          <Route path="/article/*" element={<ArticleDetail />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/search" element={<Search />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
