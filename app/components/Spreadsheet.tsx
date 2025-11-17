'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface CellData {
  [key: string]: string;
}

interface Sheet {
  id: string;
  name: string;
  data: CellData;
  columnWidths?: { [key: string]: number };
  rowHeights?: { [key: number]: number };
}

const COLUMNS = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));
const ROWS = 50;
const DEFAULT_COLUMN_WIDTH = 96; // w-24 = 96px
const DEFAULT_ROW_HEIGHT = 24; // h-6 = 24px
const MIN_COLUMN_WIDTH = 20;
const MIN_ROW_HEIGHT = 15;

interface SpreadsheetProps {
  onLogout?: () => void;
  userEmail?: string;
  onNavigateToAdmin?: () => void;
}

export default function Spreadsheet({ onLogout, userEmail, onNavigateToAdmin }: SpreadsheetProps) {
  const [sheets, setSheets] = useState<Sheet[]>([
    { id: '1', name: 'Sheet1', data: {} }
  ]);
  const [activeSheetId, setActiveSheetId] = useState('1');
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [resizingType, setResizingType] = useState<'column' | 'row' | null>(null);
  const [resizingIndex, setResizingIndex] = useState<number | string | null>(null);
  const [resizeStartPos, setResizeStartPos] = useState(0);
  const [resizeStartSize, setResizeStartSize] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSheet = sheets.find(s => s.id === activeSheetId) || sheets[0];

  // Clear selection when switching sheets
  useEffect(() => {
    setSelectedCell(null);
    setEditingCell(null);
    setCellValue('');
  }, [activeSheetId]);

  // Get column width with default (per sheet)
  const getColumnWidth = (col: string) => {
    return activeSheet.columnWidths?.[col] || DEFAULT_COLUMN_WIDTH;
  };

  // Get row height with default (per sheet)
  const getRowHeight = (row: number) => {
    return activeSheet.rowHeights?.[row] || DEFAULT_ROW_HEIGHT;
  };

  // Handle resize start
  const handleResizeStart = (type: 'column' | 'row', index: number | string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizingType(type);
    setResizingIndex(index);
    setResizeStartPos(type === 'column' ? e.clientX : e.clientY);
    setResizeStartSize(type === 'column' ? getColumnWidth(index as string) : getRowHeight(index as number));
  };

  // Update sheet column widths or row heights
  const updateSheetDimensions = useCallback((columnWidths?: { [key: string]: number }, rowHeights?: { [key: number]: number }) => {
    setSheets(prevSheets =>
      prevSheets.map(sheet =>
        sheet.id === activeSheetId
          ? {
              ...sheet,
              columnWidths: columnWidths !== undefined ? { ...sheet.columnWidths, ...columnWidths } : sheet.columnWidths,
              rowHeights: rowHeights !== undefined ? { ...sheet.rowHeights, ...rowHeights } : sheet.rowHeights,
            }
          : sheet
      )
    );
  }, [activeSheetId]);

  // Handle resize move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing || !resizingType || resizingIndex === null) return;

      const currentPos = resizingType === 'column' ? e.clientX : e.clientY;
      const diff = currentPos - resizeStartPos;
      const newSize = Math.max(
        resizingType === 'column' ? MIN_COLUMN_WIDTH : MIN_ROW_HEIGHT,
        resizeStartSize + diff
      );

      if (resizingType === 'column') {
        updateSheetDimensions({ [resizingIndex as string]: newSize }, undefined);
      } else {
        updateSheetDimensions(undefined, { [resizingIndex as number]: newSize });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizingType(null);
      setResizingIndex(null);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = resizingType === 'column' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, resizingType, resizingIndex, resizeStartPos, resizeStartSize, updateSheetDimensions]);

  const getCellId = (row: number, col: number) => `${COLUMNS[col]}${row + 1}`;

  const getCellValue = (row: number, col: number) => {
    const cellId = getCellId(row, col);
    return activeSheet.data[cellId] || '';
  };

  const handleCellClick = (row: number, col: number) => {
    const cellId = getCellId(row, col);
    setSelectedCell(cellId);
    setEditingCell(cellId);
    setCellValue(getCellValue(row, col));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCellChange = (value: string) => {
    setCellValue(value);
  };

  const handleCellBlur = () => {
    if (selectedCell && editingCell === selectedCell) {
      setSheets(prevSheets =>
        prevSheets.map(sheet =>
          sheet.id === activeSheetId
            ? { ...sheet, data: { ...sheet.data, [selectedCell]: cellValue } }
            : sheet
        )
      );
    }
    setEditingCell(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCellBlur();
      if (row < ROWS - 1) {
        handleCellClick(row + 1, col);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleCellBlur();
      if (col < COLUMNS.length - 1) {
        handleCellClick(row, col + 1);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleCellBlur();
      if (row < ROWS - 1) {
        handleCellClick(row + 1, col);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleCellBlur();
      if (row > 0) {
        handleCellClick(row - 1, col);
      }
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      handleCellBlur();
      if (col < COLUMNS.length - 1) {
        handleCellClick(row, col + 1);
      }
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      handleCellBlur();
      if (col > 0) {
        handleCellClick(row, col - 1);
      }
    }
  };

  const addNewSheet = () => {
    const newSheetNumber = sheets.length + 1;
    const newSheet: Sheet = {
      id: Date.now().toString(),
      name: `Sheet${newSheetNumber}`,
      data: {},
      columnWidths: {},
      rowHeights: {}
    };
    setSheets([...sheets, newSheet]);
    setActiveSheetId(newSheet.id);
  };

  const deleteSheet = (sheetId: string) => {
    if (sheets.length === 1) return; // Don't delete the last sheet
    const newSheets = sheets.filter(s => s.id !== sheetId);
    setSheets(newSheets);
    if (activeSheetId === sheetId) {
      setActiveSheetId(newSheets[0].id);
    }
  };

  const renameSheet = (sheetId: string, newName: string) => {
    setSheets(prevSheets =>
      prevSheets.map(sheet =>
        sheet.id === sheetId ? { ...sheet, name: newName } : sheet
      )
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-lg font-semibold text-gray-800">Excel Pro</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              File
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">
              Home
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">
              Upload
            </button>
            <button className="px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 text-sm">
              Download
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {onNavigateToAdmin && (
            <button
              onClick={onNavigateToAdmin}
              className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              Admin Panel
            </button>
          )}
          {userEmail && (
            <span className="text-sm text-gray-600 hidden sm:inline">
              {userEmail}
            </span>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Formula Bar */}
      <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center gap-2">
        <div className="text-sm font-semibold text-gray-600 w-16">
          {selectedCell || 'A1'}
        </div>
        <div className="flex-1 border border-gray-400 rounded px-2 py-1 bg-white">
          <input
            type="text"
            value={editingCell === selectedCell ? cellValue : (selectedCell ? getCellValue(parseInt(selectedCell.slice(1)) - 1, COLUMNS.indexOf(selectedCell[0])) : '')}
            onChange={(e) => {
              setCellValue(e.target.value);
              if (selectedCell) {
                setSheets(prevSheets =>
                  prevSheets.map(sheet =>
                    sheet.id === activeSheetId
                      ? { ...sheet, data: { ...sheet.data, [selectedCell]: e.target.value } }
                      : sheet
                  )
                );
              }
            }}
            className="w-full outline-none text-sm"
            placeholder="Enter formula or value"
          />
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="flex-1 overflow-auto bg-white">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="w-12 h-6 bg-gray-200 border border-gray-300 text-xs font-semibold text-gray-600 sticky top-0 left-0 z-20"></th>
                {COLUMNS.map((col, idx) => (
                  <th
                    key={col}
                    style={{ width: `${getColumnWidth(col)}px`, minWidth: `${getColumnWidth(col)}px` }}
                    className="h-6 bg-gray-200 border border-gray-300 text-xs font-semibold text-gray-600 text-center sticky top-0 z-10 relative"
                  >
                    {col}
                    <div
                      className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500 z-20 transition-colors"
                      style={{ right: '-2px' }}
                      onMouseDown={(e) => handleResizeStart('column', col, e)}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: ROWS }).map((_, rowIdx) => (
                <tr key={rowIdx} style={{ height: `${getRowHeight(rowIdx)}px` }}>
                  <td 
                    className="w-12 bg-gray-200 border border-gray-300 text-xs font-semibold text-gray-600 text-center sticky left-0 z-10 relative"
                    style={{ height: `${getRowHeight(rowIdx)}px` }}
                  >
                    {rowIdx + 1}
                    <div
                      className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize hover:bg-blue-500 z-20 transition-colors"
                      style={{ bottom: '-2px' }}
                      onMouseDown={(e) => handleResizeStart('row', rowIdx, e)}
                    />
                  </td>
                  {COLUMNS.map((col, colIdx) => {
                    const cellId = getCellId(rowIdx, colIdx);
                    const isSelected = selectedCell === cellId;
                    const isEditing = editingCell === cellId;
                    const value = getCellValue(rowIdx, colIdx);

                    return (
                      <td
                        key={cellId}
                        style={{ 
                          width: `${getColumnWidth(col)}px`, 
                          minWidth: `${getColumnWidth(col)}px`,
                          height: `${getRowHeight(rowIdx)}px`
                        }}
                        className={`border border-gray-300 text-xs relative ${
                          isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white hover:bg-gray-50'
                        }`}
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={cellValue}
                            onChange={(e) => handleCellChange(e.target.value)}
                            onBlur={handleCellBlur}
                            onKeyDown={(e) => handleKeyDown(e, rowIdx, colIdx)}
                            className="w-full h-full px-1 outline-none bg-transparent"
                            autoFocus
                          />
                        ) : (
                          <div className="px-1 py-0.5 truncate">{value}</div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="bg-gray-200 border-t border-gray-300 px-2 py-1 flex items-center gap-1 overflow-x-auto">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={`flex items-center gap-1 px-3 py-1 rounded-t cursor-pointer min-w-[100px] ${
              activeSheetId === sheet.id
                ? 'bg-white border-t border-l border-r border-gray-300'
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => {
              // Save any pending edits before switching
              if (selectedCell && editingCell === selectedCell && cellValue !== undefined) {
                setSheets(prevSheets =>
                  prevSheets.map(s =>
                    s.id === activeSheetId
                      ? { ...s, data: { ...s.data, [selectedCell]: cellValue } }
                      : s
                  )
                );
              }
              setActiveSheetId(sheet.id);
            }}
          >
            <input
              type="text"
              value={sheet.name}
              onChange={(e) => renameSheet(sheet.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className={`flex-1 outline-none text-xs bg-transparent ${
                activeSheetId === sheet.id ? 'text-gray-800' : 'text-gray-600'
              }`}
            />
            {sheets.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSheet(sheet.id);
                }}
                className="text-gray-500 hover:text-red-600 text-xs ml-1"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          onClick={addNewSheet}
          className="px-2 py-1 text-gray-600 hover:bg-gray-400 rounded text-lg font-light"
          title="Add new sheet"
        >
          +
        </button>
      </div>
    </div>
  );
}

