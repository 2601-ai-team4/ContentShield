// ==================== src/components/Admin/LogViewer.jsx ====================
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminService } from '../../services/adminService'
import { FileText, Download, Filter } from 'lucide-react'

export default function LogViewer() {
  const [logType, setLogType] = useState('admin')

  // ✅ React Query v5 문법
  const { data: adminLogs } = useQuery({
    queryKey: ['adminLogs', logType],
    queryFn: () => adminService.getAdminLogs(),
    enabled: logType === 'admin'
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">📜 System Logs</h1>
        <div className="flex space-x-2">
          <select
            value={logType}
            onChange={(e) => setLogType(e.target.value)}
            className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="admin">Admin Logs</option>
            <option value="user">User Activity</option>
            <option value="system">System Logs</option>
          </select>
          <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 flex items-center text-slate-200 transition-colors">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-lg shadow-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Admin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                  Timestamp
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {adminLogs?.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-800 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 text-xs rounded bg-blue-900/30 text-blue-400 border border-blue-900/50">
                      {log.actionType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-200">
                    Admin #{log.adminId}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {log.targetType} #{log.targetId}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-200">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}