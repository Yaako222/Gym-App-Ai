import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { ProProvider } from './contexts/ProContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LanguageProvider>
      <ProProvider>
        <App />
      </ProProvider>
    </LanguageProvider>
  </StrictMode>,
);
