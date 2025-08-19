import { useState, useCallback } from 'react'
import { Download, Plus, Trash2, Edit3, Save, X } from 'lucide-react'

export default function App() {
  const [headers, setHeaders] = useState(['Name', 'Email', 'Phone'])
  const [data, setData] = useState([
    ['John Doe', 'john@example.com', '123-456-7890'],
    ['Jane Smith', 'jane@example.com', '098-765-4321']
  ])
  const [editingHeader, setEditingHeader] = useState(null)
  const [newHeaderName, setNewHeaderName] = useState('')

  const addColumn = () => {
    const newHeader = `Column ${headers.length + 1}`
    setHeaders([...headers, newHeader])
    setData(data.map(row => [...row, '']))
  }

  const addRow = () => {
    setData([...data, new Array(headers.length).fill('')])
  }

  const deleteRow = (index) => {
    setData(data.filter((_, i) => i !== index))
  }

  const deleteColumn = (index) => {
    setHeaders(headers.filter((_, i) => i !== index))
    setData(data.map(row => row.filter((_, i) => i !== index)))
  }

  const updateCell = (rowIndex, colIndex, value) => {
    const newData = [...data]
    newData[rowIndex][colIndex] = value
    setData(newData)
  }

  const startEditingHeader = (index) => {
    setEditingHeader(index)
    setNewHeaderName(headers[index])
  }

  const saveHeader = () => {
    const newHeaders = [...headers]
    newHeaders[editingHeader] = newHeaderName
    setHeaders(newHeaders)
    setEditingHeader(null)
    setNewHeaderName('')
  }

  const cancelEditingHeader = () => {
    setEditingHeader(null)
    setNewHeaderName('')
  }

  const exportToExcel = useCallback(() => {
    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'exported_data.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [headers, data])

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      setHeaders(['Column 1'])
      setData([['']])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Excel Creator</h1>
              <p className="text-gray-600">Create custom spreadsheets and export to Excel</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={clearAllData}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Clear All
              </button>
              <button
                onClick={exportToExcel}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download size={16} />
                Export to Excel
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={addColumn}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Column
            </button>
            <button
              onClick={addRow}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Row
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                  {headers.map((header, index) => (
                    <th key={index} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-48">
                      <div className="flex items-center justify-between group">
                        {editingHeader === index ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={newHeaderName}
                              onChange={(e) => setNewHeaderName(e.target.value)}
                              className="flex-1 px-2 py-1 text-sm border rounded"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveHeader()
                                if (e.key === 'Escape') cancelEditingHeader()
                              }}
                              autoFocus
                            />
                            <button
                              onClick={saveHeader}
                              className="p-1 text-green-600 hover:text-green-800"
                            >
                              <Save size={14} />
                            </button>
                            <button
                              onClick={cancelEditingHeader}
                              className="p-1 text-gray-600 hover:text-gray-800"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex-1">{header}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                              <button
                                onClick={() => startEditingHeader(index)}
                                className="p-1 text-blue-600 hover:text-blue-800"
                                title="Edit header"
                              >
                                <Edit3 size={14} />
                              </button>
                              {headers.length > 1 && (
                                <button
                                  onClick={() => deleteColumn(index)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete column"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 group">
                    <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                      {rowIndex + 1}
                    </td>
                    {row.map((cell, colIndex) => (
                      <td key={colIndex} className="px-4 py-3">
                        <input
                          type="text"
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          placeholder="Enter data..."
                        />
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      {data.length > 1 && (
                        <button
                          onClick={() => deleteRow(rowIndex)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-all"
                          title="Delete row"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No data yet. Add your first row!</p>
              <button
                onClick={addRow}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 mx-auto"
              >
                <Plus size={16} />
                Add First Row
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {headers.length} column{headers.length !== 1 ? 's' : ''}, {data.length} row{data.length !== 1 ? 's' : ''}
            </span>
            <span>
              Total cells: {headers.length * data.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}