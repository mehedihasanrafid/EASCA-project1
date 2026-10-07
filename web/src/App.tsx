import React from 'react';
import { AuthProvider } from './features/auth/AuthContext';
import { AppRouter } from './routes/AppRouter';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

export default App;
