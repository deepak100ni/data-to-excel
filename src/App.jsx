import React, { useState, useRef } from 'react';
import { Plus, Download, Trash2, Sparkles, Wand2, FileSpreadsheet, Brain, Upload, Zap, Settings, Key, X, Menu } from 'lucide-react';
import * as XLSX from 'xlsx';

const App = () => {
  const [data, setData] = useState([
    { id: 1, Name: '', EMAIL: '', PHONE: '', 'COLUMN 4': '' }
  ]);
  const [columns, setColumns] = useState(['Name', 'EMAIL', 'PHONE', 'COLUMN 4']);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({ show: false, message: '', type: 'success' });
  const [apiKey, setApiKey] = useState('');
  const [showApiModal, setShowApiModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const fileInputRef = useRef(null);

  // Show snackbar notification
  const showSnackbar = (message, type = 'success') => {
    setSnackbar({ show: true, message, type });
    setTimeout(() => {
      setSnackbar({ show: false, message: '', type: 'success' });
    }, 4000);
  };

  // Gemini API integration
  const callGeminiAPI = async (prompt) => {
    if (!apiKey) {
      showSnackbar('Please add your Gemini API key first', 'error');
      setShowApiModal(true);
      return null;
    }
    

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return result.candidates[0]?.content?.parts[0]?.text || 'No response generated';
    } catch (error) {
      console.error('Gemini API Error:', error);
      showSnackbar(`Gemini API Error: ${error.message}`, 'error');
      return null;
    }
  };

  console.log('aiResponse >',aiResponse);
  // AI-powered data generation using Gemini
  const generateDataWithAI = async (type, customPrompt = '') => {
    setIsGenerating(true);
    setAiResponse('');

    let prompt = customPrompt;
    if (!customPrompt) {
      const prompts = {
        'customer_list': 'Generate 5 realistic customer records with Name, Email, Phone, and Status (Premium/Standard/Basic). Format as JSON array with these exact keys.',
        'employee_roster': 'Generate 4 realistic employee records with Name, Email, Phone, and Position (Manager/Developer/Designer/Analyst). Format as JSON array with these exact keys.',
        'inventory_list': 'Generate 3 realistic inventory items with Name (product name), Email (supplier email), Phone (supplier phone), and Quantity. Format as JSON array with these exact keys.',
        'sales_data': 'Generate 5 sales records with Name (product), Email (customer email), Phone (customer phone), and Revenue. Format as JSON array with these exact keys.'
      };
      prompt = prompts[type] || prompts['customer_list'];
    }

    const aiResult = await callGeminiAPI(prompt);
    
    if (aiResult) {
      try {
        // Extract JSON from AI response
        const jsonMatch = aiResult.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const generatedData = JSON.parse(jsonMatch[0]);
          const newData = generatedData.map((item, index) => ({ 
            id: index + 1, 
            ...item 
          }));
          
          // Update columns based on generated data
          if (generatedData.length > 0) {
            const newColumns = Object.keys(generatedData[0]);
            setColumns(newColumns);
          }
          
          setData(newData);
          showSnackbar(`Successfully generated ${generatedData.length} records using AI!`, 'success');
        } else {
          showSnackbar('AI generated text but no structured data found. Try a different prompt.', 'warning');
        }
      } catch (error) {
        console.error('Error parsing AI response:', error);
        showSnackbar('Error parsing AI response. The AI might have returned unstructured data.', 'error');
      }
    }
    
    setIsGenerating(false);
  };

  // AI-powered custom data generation
  const generateCustomData = async () => {
    if (!aiPrompt.trim()) {
      showSnackbar('Please enter a prompt for data generation', 'warning');
      return;
    }
    
    const enhancedPrompt = `${aiPrompt}. Format the response as a JSON array of objects. Each object should have consistent keys that can be used as column headers.`;
    await generateDataWithAI('custom', enhancedPrompt);
    setAiPrompt('');
  };

  // AI-powered auto-fill
  const autoFillWithAI = async (columnName) => {
    setIsGenerating(true);
    
    const existingData = data.map(row => {
      const { id, ...rest } = row;
      return rest;
    }).filter(row => Object.values(row).some(val => val !== ''));

    const prompt = `Based on this existing data: ${JSON.stringify(existingData)}, generate appropriate values for the "${columnName}" column. Return only a JSON array of values in the same order as the data provided.`;
    
    const aiResult = await callGeminiAPI(prompt);
    
    if (aiResult) {
      try {
        const jsonMatch = aiResult.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const values = JSON.parse(jsonMatch[0]);
          const newData = [...data];
          values.forEach((value, index) => {
            if (newData[index]) {
              newData[index][columnName] = value;
            }
          });
          setData(newData);
          showSnackbar(`Successfully auto-filled ${columnName} column`, 'success');
        }
      } catch (error) {
        console.error('Error parsing AI auto-fill response:', error);
        showSnackbar('Error parsing AI auto-fill response', 'error');
      }
    }
    
    setIsGenerating(false);
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

  const deleteRow = (rowId) => {
    setData(data.filter(row => row.id !== rowId));
  };

  const deleteColumn = (columnName) => {
    setColumns(columns.filter(col => col !== columnName));
    setData(data.map(row => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    }));
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
    XLSX.writeFile(wb, 'ai-generated-spreadsheet.xlsx');
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Excel Creator</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Powered by Gemini AI</p>
              </div>
            </div>
            
            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => setShowApiModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Key className="w-4 h-4" />
                API Key
              </button>
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
                Import
              </button>
              <button
                onClick={clearAll}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(true)}
              className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}></div>
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Menu</h3>
                <button onClick={() => setShowMobileMenu(false)} className="p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-3">
              <button
                onClick={() => {setShowApiModal(true); setShowMobileMenu(false);}}
                className="w-full flex items-center gap-2 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Key className="w-4 h-4" />
                API Key Setup
              </button>
              <button
                onClick={() => {fileInputRef.current?.click(); setShowMobileMenu(false);}}
                className="w-full flex items-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import File
              </button>
              <button
                onClick={() => {clearAll(); setShowMobileMenu(false);}}
                className="w-full flex items-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
              <button
                onClick={() => {exportToExcel(); setShowMobileMenu(false);}}
                className="w-full flex items-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Export to Excel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* AI Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">AI Assistant</h3>
              {!apiKey && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  API Key Required
                </span>
              )}
            </div>
            
            {/* Custom Prompt */}
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the data you want to generate (e.g., 'Create 10 product records with name, price, and category')"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  onKeyPress={(e) => e.key === 'Enter' && generateCustomData()}
                />
                <button
                  onClick={generateCustomData}
                  disabled={isGenerating || !apiKey}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  Generate with AI
                </button>
              </div>
            </div>

            {/* Quick Generate Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <button
                onClick={() => generateDataWithAI('customer_list')}
                disabled={isGenerating || !apiKey}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-black"
              >
                <Sparkles className="w-4 h-4 text-yellow-600" />
                <span className="text-sm">Customer List</span>
              </button>
              <button
                onClick={() => generateDataWithAI('employee_roster')}
                disabled={isGenerating || !apiKey}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-black"
              >
                <Wand2 className="w-4 h-4 text-green-600" />
                <span className="text-sm">Employee Roster</span>
              </button>
              <button
                onClick={() => generateDataWithAI('inventory_list')}
                disabled={isGenerating || !apiKey}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-black"
              >
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm">Inventory List</span>
              </button>
              <button
                onClick={() => generateDataWithAI('sales_data')}
                disabled={isGenerating || !apiKey}
                className="flex items-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-black"
              >
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span className="text-sm">Sales Data</span>
              </button>
            </div>

            {/* AI Status */}
            {isGenerating && (
              <div className="flex items-center gap-2 text-blue-600 mb-4">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">AI is generating data...</span>
              </div>
            )}
          </div>
        </div>

        {/* Spreadsheet Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={addColumn}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Column
              </button>
              <button
                onClick={addRow}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Row
              </button>
            </div>
          </div>

          {/* Spreadsheet Table */}
          <div className="p-4 sm:p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 min-w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 sm:p-3 text-left font-medium text-gray-700 w-12 min-w-12">#</th>
                    {columns.map((column, index) => (
                      <th key={index} className="border border-gray-300 p-2 sm:p-3 text-left relative group min-w-32">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={column}
                            onChange={(e) => updateColumnName(column, e.target.value)}
                            className="font-medium text-gray-700 bg-transparent border-none outline-none focus:bg-white focus:border focus:border-blue-500 rounded px-1 w-full min-w-0"
                            onBlur={(e) => updateColumnName(column, e.target.value)}
                          />
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => autoFillWithAI(column)}
                              disabled={!apiKey}
                              className="p-1 hover:bg-blue-100 rounded disabled:opacity-50"
                              title={`AI Auto-fill ${column}`}
                            >
                              <Sparkles className="w-3 h-3 text-blue-600" />
                            </button>
                            <button
                              onClick={() => deleteColumn(column)}
                              className="p-1 hover:bg-red-100 rounded"
                              title={`Delete ${column}`}
                            >
                              <X className="w-3 h-3 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 group">
                      <td className="border border-gray-300 p-2 sm:p-3 text-center text-gray-500 bg-gray-50 relative">
                        <div className="flex items-center justify-center">
                          <span>{row.id}</span>
                          <button
                            onClick={() => deleteRow(row.id)}
                            className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
                            title="Delete row"
                          >
                            <X className="w-3 h-3 text-red-600" />
                          </button>
                        </div>
                      </td>
                      {columns.map((column) => (
                        <td key={column} className="border border-gray-300 p-0">
                          <input
                            type="text"
                            value={row[column] || ''}
                            onChange={(e) => updateCell(row.id, column, e.target.value)}
                            className="w-full p-2 sm:p-3 border-none outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-500 min-w-0 text-gray-900"
                            placeholder="Enter data..."
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm text-gray-600 gap-2">
              <span>{columns.length} columns, {data.length} rows</span>
              <span>Total cells: {columns.length * data.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Modal */}
      {showApiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowApiModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Gemini API Key</h3>
                <button onClick={() => setShowApiModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enter your Google Gemini API key to enable AI features. Get your key from Google AI Studio.
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 text-black"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowApiModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowApiModal(false)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classy Snackbar */}
      {snackbar.show && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
          <div className={`
            px-6 py-4 rounded-lg shadow-lg border backdrop-blur-sm max-w-md
            ${snackbar.type === 'success' ? 'bg-green-50/90 border-green-200 text-green-800' : ''}
            ${snackbar.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' : ''}
            ${snackbar.type === 'warning' ? 'bg-yellow-50/90 border-yellow-200 text-yellow-800' : ''}
            ${snackbar.type === 'info' ? 'bg-blue-50/90 border-blue-200 text-blue-800' : ''}
          `}>
            <div className="flex items-center gap-3">
              <div className={`
                w-2 h-2 rounded-full
                ${snackbar.type === 'success' ? 'bg-green-500' : ''}
                ${snackbar.type === 'error' ? 'bg-red-500' : ''}
                ${snackbar.type === 'warning' ? 'bg-yellow-500' : ''}
                ${snackbar.type === 'info' ? 'bg-blue-500' : ''}
              `}></div>
              <span className="text-sm font-medium">{snackbar.message}</span>
              <button 
                onClick={() => setSnackbar({ show: false, message: '', type: 'success' })}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;