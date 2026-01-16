import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ServiceProvider } from './context/ServiceContext';
import { MemberProvider } from './context/MemberContext';
import { SocketProvider } from './context/SocketContext';
import { ActivityProvider } from './context/ActivityContext';
import GlobalSocketListener from './components/GlobalSocketListener';
import Home from './pages/Home';
import Builder from './pages/Builder';
import LiveMode from './pages/LiveMode';
import Stats from './pages/Stats';
import Projection from './pages/Projection';
import Members from './pages/Members';
import Templates from './pages/Templates';
import Activities from './pages/Activities';

function App() {
  return (
    <ServiceProvider>
      <SocketProvider>
        <MemberProvider>
          <ActivityProvider>
            <GlobalSocketListener />
            <BrowserRouter>
              <LayoutAndRoutes />
            </BrowserRouter>
          </ActivityProvider>
        </MemberProvider>
      </SocketProvider>
    </ServiceProvider>
  );
}

// Separate component to use hooks like useLocation
import { useLocation } from 'react-router-dom';
import Header from './components/Header';

function LayoutAndRoutes() {
  const location = useLocation();
  // Don't show header on projection page
  const showHeader = !location.pathname.startsWith('/projection');

  return (
    <>
      {showHeader && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/builder/:id" element={<Builder />} />
        <Route path="/live/:id" element={<LiveMode />} />
        <Route path="/stats/:id" element={<Stats />} />
        <Route path="/projection/:id" element={<Projection />} />
        <Route path="/members" element={<Members />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/builder/template/:templateId" element={<Builder />} />

        {/* Catch all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
