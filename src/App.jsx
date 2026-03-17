import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Matches } from './pages/Matches'
import { Referrals } from './pages/Referrals'
import { Transactions } from './pages/Transactions'
import { Users } from './pages/Users'
import { UserDetails } from './pages/UserDetails'
import { Account } from './pages/Account'
import './styles/Dashboard.css'

function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <Outlet />
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserDetails />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/revenue" element={<Dashboard />} />
          <Route path="/account" element={<Account />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}


/*
echo "# make-wish-website" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/nestsoft-dev/make-wish-website.git
git push -u origin main
*/
export default App
