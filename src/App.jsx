import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { PrintProvider } from './context/PrintContext.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';
import AppLayout from './components/layout/AppLayout.jsx';
import PrintRoot from './components/print/PrintRoot.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Patients from './pages/Patients.jsx';
import PatientFormPage from './pages/PatientFormPage.jsx';
import PatientProfile from './pages/PatientProfile.jsx';
import ConsultationFormPage from './pages/ConsultationFormPage.jsx';
import ConsultationView from './pages/ConsultationView.jsx';
import Consultations from './pages/Consultations.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PrintProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />

                <Route path="/patients" element={<Patients />} />
                <Route path="/patients/new" element={<PatientFormPage />} />
                <Route path="/patients/:id" element={<PatientProfile />} />
                <Route path="/patients/:id/edit" element={<PatientFormPage />} />
                <Route path="/patients/:patientId/consultations/new" element={<ConsultationFormPage />} />

                <Route path="/consultations" element={<Consultations />} />
                <Route path="/consultations/:id" element={<ConsultationView />} />
                <Route path="/consultations/:id/edit" element={<ConsultationFormPage />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>

          <PrintRoot />
          <Toaster
            position="top-right"
            containerClassName="print:hidden"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#121212',
                color: '#fff',
                fontFamily: 'var(--font-sans)',
                fontSize: '15px',
                borderRadius: '10px',
              },
              success: { iconTheme: { primary: '#d49011', secondary: '#121212' } },
            }}
          />
        </PrintProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
