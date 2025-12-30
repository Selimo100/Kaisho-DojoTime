import { Routes, Route } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import HomePage from './pages/HomePage';
import ClubPage from './pages/ClubPage';
import NotFoundPage from './pages/NotFoundPage';
import DeveloperPanel from './components/DeveloperPanel';

function App() {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-kaisho-whiteSoft">
        <DeveloperPanel />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/club/:slug" element={<ClubPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </AdminProvider>
  );
}

export default App;
