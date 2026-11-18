import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ui/ToastProvider'
import { BudgetProvider } from './store/BudgetProvider'
import { MonthProvider } from './store/MonthProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BudgetProvider>
      <MonthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </MonthProvider>
    </BudgetProvider>
  </StrictMode>,
)
