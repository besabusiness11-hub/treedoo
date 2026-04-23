import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { DataProvider } from './lib/DataContext.tsx';
import { LanguageProvider } from './lib/LanguageContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </DataProvider>
  </StrictMode>,
);
