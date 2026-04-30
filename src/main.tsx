import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './lib/AuthContext.tsx';
import { DataProvider } from './lib/DataContext.tsx';
import { LanguageProvider } from './lib/LanguageContext.tsx';
import { ResidenceProvider } from './lib/ResidenceContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <DataProvider>
        <LanguageProvider>
          <ResidenceProvider>
            <App />
          </ResidenceProvider>
        </LanguageProvider>
      </DataProvider>
    </AuthProvider>
  </StrictMode>,
);
