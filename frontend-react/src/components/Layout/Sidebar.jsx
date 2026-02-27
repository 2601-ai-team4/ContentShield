import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FileSearch,
  BarChart3,
  UserX,
  Settings,
  Wand2,
  Users,
  Bell,
  FileText,
  MessageSquare,
  User,
  Lightbulb

} from 'lucide-react'
import { useAuthStore } from '../../stores/authStore'

export default function Sidebar() {
  const location = useLocation()
  const { user } = useAuthStore()

  const isAdminMode = location.pathname.startsWith('/admin')
  const isAdmin = user?.role === 'ADMIN'

  const isActive = (path) => location.pathname === path

  const linkClass = (path) => {
    const base = 'flex items-center px-4 py-3 text-sm font-medium transition-all rounded-lg'
    return isActive(path)
      ? `${base} bg-primary-600/20 text-primary-400`
      : `${base} text-slate-400 hover:bg-white/5 hover:text-slate-200`
  }

  const userLinks = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/analysis', icon: FileSearch, label: 'AI Analysis' },
    { path: '/comments', icon: MessageSquare, label: 'Comments' },
    { path: '/blacklist', icon: UserX, label: 'Blacklist' },
    { path: '/aiassistant', icon: Wand2, label: 'AI Assistant' },
    { path: '/writing', icon: Wand2, label: 'AI Writing Assistant' },
    { path: '/suggestions', icon: Lightbulb, label: 'Suggestions' },
    { path: '/statistics', icon: BarChart3, label: 'Statistics' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/notices', icon: Bell, label: 'Notices' },
  ]

  const adminLinks = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Admin Dashboard' },
    { path: '/admin/users', icon: Users, label: 'User Management' },
    { path: '/admin/notices', icon: Bell, label: 'Notices' },
    { path: '/admin/logs', icon: FileText, label: 'System Logs' },
    { path: '/admin/suggestions', icon: MessageSquare, label: 'Suggestions' },
  ]

  const showUserMenu = !isAdmin || !isAdminMode
  const showAdminMenu = isAdmin && isAdminMode

  return (
    <div className="w-64 bg-slate-950 h-screen border-r border-white/10">
      <div className="py-6 px-3">
        {showAdminMenu && (
          <>
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admin Menu
              </h3>
            </div>
            <nav className="space-y-1">
              {adminLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={linkClass(link.path)}
                >
                  <link.icon className="h-5 w-5 mr-3" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </>
        )}

        {showUserMenu && (
          <>
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                User Menu
              </h3>
            </div>
            <nav className="space-y-1">
              {userLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={linkClass(link.path)}
                >
                  <link.icon className="h-5 w-5 mr-3" />
                  {link.label}
                </Link>
              ))}
            </nav>
          </>
        )}
      </div>
    </div>
  )
}