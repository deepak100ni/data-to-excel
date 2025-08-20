import React, { useState, useRef } from 'react';
import { Plus, Download, Trash2, Sparkles, Wand2, FileSpreadsheet, Brain, Upload, Zap } from 'lucide-react';
import * as XLSX from 'xlsx';

const APP = () => {
  const [data, setData] = useState([
    { id: 1, Name: '', EMAIL: '', PHONE: '', 'COLUMN 4': '' }
  ]);
  const [columns, setColumns] = useState(['Name', 'EMAIL', 'PHONE', 'COLUMN 4']);
  // const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  // const [aiSuggestions, setAiSuggestions] = useState([]);
  const [selectedCell, setSelectedCell] = useState(null);
  const fileInputRef = useRef(null);

  // Sample AI suggestions based on context
  const getAISuggestions = (columnName, rowData) => {
    const suggestions = {
      'Name': ['Generate random names', 'Create professional names', 'Generate names by country'],
      'EMAIL': ['Generate emails from names', 'Create company emails', 'Generate unique emails'],
      'PHONE': ['Generate phone numbers', 'Format existing phones', 'Generate by region'],
      'default': ['Fill with sample data', 'Generate sequential data', 'Create random data']
    };
    return suggestions[columnName] || suggestions['default'];
  };

  const addColumn = () => {
    const newColumnName = `COLUMN ${columns.length + 1}`;
    setColumns([...columns, newColumnName]);
    setData(data.map(row => ({ ...row, [newColumnName]: '' })));
  };

  const addRow = () => {
    const newRow = { id: data.length + 1 };
    columns.forEach(col => newRow[col] = '');
    setData([...data, newRow]);
  };

  const updateCell = (rowId, column, value) => {
    setData(data.map(row => 
      row.id === rowId ? { ...row, [column]: value } : row
    ));
  };

  const updateColumnName = (oldName, newName) => {
    if (newName && newName !== oldName) {
      setColumns(columns.map(col => col === oldName ? newName : col));
      setData(data.map(row => {
        const newRow = { ...row };
        newRow[newName] = newRow[oldName];
        delete newRow[oldName];
        return newRow;
      }));
    }
  };

  // AI-powered data generation
  const generateSampleData = async (type) => {
    setIsGenerating(true);
    
    // Simulate AI generation with realistic sample data
    const sampleDataSets = {
      'customer_list': [
        { Name: 'John Smith', EMAIL: 'john.smith@email.com', PHONE: '+1-555-0123', 'COLUMN 4': 'Premium' },
        { Name: 'Sarah Johnson', EMAIL: 'sarah.j@company.com', PHONE: '+1-555-0124', 'COLUMN 4': 'Standard' },
        { Name: 'Michael Brown', EMAIL: 'mbrown@business.net', PHONE: '+1-555-0125', 'COLUMN 4': 'Premium' },
        { Name: 'Emily Davis', EMAIL: 'emily.davis@corp.com', PHONE: '+1-555-0126', 'COLUMN 4': 'Basic' },
        { Name: 'Robert Wilson', EMAIL: 'rwilson@enterprise.org', PHONE: '+1-555-0127', 'COLUMN 4': 'Premium' }
      ],
      'employee_roster': [
        { Name: 'Alice Cooper', EMAIL: 'alice@company.com', PHONE: '+1-555-1001', 'COLUMN 4': 'Manager' },
        { Name: 'Bob Miller', EMAIL: 'bob@company.com', PHONE: '+1-555-1002', 'COLUMN 4': 'Developer' },
        { Name: 'Carol White', EMAIL: 'carol@company.com', PHONE: '+1-555-1003', 'COLUMN 4': 'Designer' },
        { Name: 'David Lee', EMAIL: 'david@company.com', PHONE: '+1-555-1004', 'COLUMN 4': 'Analyst' }
      ],
      'inventory_list': [
        { Name: 'Widget A', EMAIL: 'supplier1@vendor.com', PHONE: '+1-555-2001', 'COLUMN 4': '150' },
        { Name: 'Component B', EMAIL: 'supplier2@vendor.com', PHONE: '+1-555-2002', 'COLUMN 4': '75' },
        { Name: 'Part C', EMAIL: 'supplier3@vendor.com', PHONE: '+1-555-2003', 'COLUMN 4': '200' }
      ]
    };

    setTimeout(() => {
      const sampleSet = sampleDataSets[type] || sampleDataSets['customer_list'];
      const newData = sampleSet.map((item, index) => ({ id: index + 1, ...item }));
      setData(newData);
      setIsGenerating(false);
    }, 1500);
  };

  // Smart column suggestions
  const getColumnSuggestions = () => {
    const commonColumns = [
      'First Name', 'Last Name', 'Company', 'Job Title', 'Address', 'City', 'State', 
      'ZIP Code', 'Country', 'Website', 'Birthday', 'Notes', 'Status', 'Category'
    ];
    return commonColumns.filter(col => !columns.includes(col));
  };

  // AI-powered auto-fill
  const autoFillColumn = (columnName) => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const newData = [...data];
      
      if (columnName === 'EMAIL' && columns.includes('Name')) {
        newData.forEach(row => {
          if (row.Name && !row.EMAIL) {
            const name = row.Name.toLowerCase().replace(' ', '.');
            row.EMAIL = `${name}@email.com`;
          }
        });
      } else if (columnName === 'PHONE') {
        newData.forEach((row, index) => {
          if (!row.PHONE) {
            row.PHONE = `+1-555-${String(1000 + index).padStart(4, '0')}`;
          }
        });
      }
      
      setData(newData);
      setIsGenerating(false);
    }, 1000);
  };

  const clearAll = () => {
    setData([{ id: 1, Name: '', EMAIL: '', PHONE: '', 'COLUMN 4': '' }]);
    setColumns(['Name', 'EMAIL', 'PHONE', 'COLUMN 4']);
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(data.map(row => {
      const { id, ...rest } = row;
      return rest;
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'spreadsheet.xlsx');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const workbook = XLSX.read(e.target.result, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length > 0) {
          const newColumns = Object.keys(jsonData[0]);
          const newData = jsonData.map((row, index) => ({ id: index + 1, ...row }));
          setColumns(newColumns);
          setData(newData);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Excel Creator</h1>
                <p className="text-gray-600">Create custom spreadsheets with AI assistance</p>
              </div>
            </div>
            <div className="flex gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import File
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            </div>
          </div>

          {/* AI Controls */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center gap-3 mb-3">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={() => generateSampleData('customer_list')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-black"
              >
                <Sparkles className="w-4 h-4 text-yellow-600" />
                Generate Customer List
              </button>
              <button
                onClick={() => generateSampleData('employee_roster')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-black"
              >
                <Wand2 className="w-4 h-4 text-green-600" />
                Generate Employee Roster
              </button>
              <button
                onClick={() => generateSampleData('inventory_list')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-black"
              >
                <Zap className="w-4 h-4 text-purple-600" />
                Generate Inventory List
              </button>
            </div>

            {isGenerating && (
              <div className="mt-3 flex items-center gap-2 text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">AI is generating data...</span>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={addColumn}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Column
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Row
            </button>
          </div>
        </div>

        {/* Spreadsheet */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left font-medium text-gray-700 w-12">#</th>
                  {columns.map((column, index) => (
                    <th key={index} className="border border-gray-300 p-3 text-left relative group">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={column}
                          onChange={(e) => updateColumnName(column, e.target.value)}
                          className="font-medium text-gray-700 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-500 rounded px-1"
                          onBlur={(e) => updateColumnName(column, e.target.value)}
                        />
                        <button
                          onClick={() => autoFillColumn(column)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-blue-100 rounded"
                          title={`Auto-fill ${column}`}
                        >
                          <Sparkles className="w-3 h-3 text-blue-600" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 text-center text-gray-500 bg-gray-50">
                      {row.id}
                    </td>
                    {columns.map((column) => (
                      <td key={column} className="border border-gray-300 p-0">
                        <input
                          type="text"
                          value={row[column] || ''}
                          onChange={(e) => updateCell(row.id, column, e.target.value)}
                          onFocus={() => setSelectedCell({ row: row.id, column })}
                          className="w-full p-3 border-none outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 text-black"
                          placeholder="Enter data..."
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-between items-center text-sm text-gray-600">
            <span>{columns.length} columns, {data.length} rows</span>
            <span>Total cells: {columns.length * data.length}</span>
          </div>
        </div>

        {/* AI Suggestions Panel */}
        {selectedCell && (
          <div className="border-t border-gray-200 p-4 bg-gray-50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                AI Suggestions for {selectedCell.column}
              </span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {getAISuggestions(selectedCell.column).map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => autoFillColumn(selectedCell.column)}
                  className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default APP;