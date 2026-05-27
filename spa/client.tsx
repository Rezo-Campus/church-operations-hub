import '../src/styles.css'
import { RouterProvider } from '@tanstack/react-router'
import { createRoot } from 'react-dom/client'
import { getRouter } from '../src/router'

const router = getRouter()

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
