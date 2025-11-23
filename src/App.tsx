import { Routes, Route } from 'react-router-dom';
import { AdminProvider } from './context/AdminContext';
import HomePage from './pages/HomePage';
import ClubPage from './pages/ClubPage';

function App() {
  return (
    <AdminProvider>
      <div className="min-h-screen bg-gradient-to-br from-kaisho-dark to-kaisho-secondary">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/club/:slug" element={<ClubPage />} />
        </Routes>
      </div>
    </AdminProvider>
  );
}

export default App;
