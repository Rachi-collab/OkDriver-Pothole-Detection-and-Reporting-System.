import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import ReportPage from './pages/ReportPage'
import PotholeDetail from './pages/PotholeDetail'

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"              element={<Dashboard />} />
          <Route path="/map"           element={<MapView />} />
          <Route path="/report"        element={<ReportPage />} />
          <Route path="/pothole/:id"   element={<PotholeDetail />} />
        </Routes>
      </main>
    </div>
  )
}
