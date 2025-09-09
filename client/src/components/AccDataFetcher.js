import { useState, useEffect, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
} from '@tanstack/react-table';
import DataTable from './DataTable';
import DetailLogModal from './DetailLogModal';

const AccDataFetcher = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 20,
  });

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailLogs, setDetailLogs] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    return `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr || timeStr.length !== 6) return timeStr;
    return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}:${timeStr.substring(4, 6)}`;
  };

  const calculateDiffInMinutes = (startTime, endTime) => {
    if (!startTime || !endTime || startTime.length !== 6 || endTime.length !== 6) return 0;
    const start = new Date(`1970-01-01T${formatTime(startTime)}Z`);
    const end = new Date(`1970-01-01T${formatTime(endTime)}Z`);
    const diff = (end.getTime() - start.getTime()) / 1000 / 60;
    return Math.round(diff);
  };

  const columns = useMemo(
    () => [
      { accessorKey: 'C_Unique', header: 'ID', enableColumnFilter: true, filterFn: 'includesString' },
      { accessorKey: 'C_Name', header: 'Name', enableColumnFilter: true, filterFn: 'includesString' },
      {
        accessorKey: 'C_Date',
        header: 'Date',
        cell: info => formatDate(info.getValue()),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'EntryTime',
        header: 'In',
        cell: info => formatTime(info.getValue()),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'ExitTime',
        header: 'Out',
        cell: info => formatTime(info.getValue()),
        enableColumnFilter: true,
        filterFn: 'includesString',
      },
      {
        accessorKey: 'DTIME',
        header: 'Diff (Min)',
      },
      { accessorKey: 'RecognitionCount', header: 'Count', enableColumnFilter: true, filterFn: 'includesString' },
    ],
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
            from: fromDate.replace(/-/g, ''),
            to: toDate.replace(/-/g, ''),
        });
        const response = await fetch(`${process.env.REACT_APP_API_URL}/accs?${params}`);
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const contentType = response.headers.get('Content-Type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          throw new Error(`Expected JSON, got: ${text}`);
        }

        const result = await response.json();
        const processedData = result.map(item => ({
            ...item,
            DTIME: calculateDiffInMinutes(item.EntryTime, item.ExitTime)
        }));
        setData(processedData);

      } catch (error) {
        setError(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fromDate, toDate]);

  useEffect(() => {
    if (selectedUser) {
      const fetchDetailLogs = async () => {
        setDetailLoading(true);
        try {
          const params = new URLSearchParams({
            date: selectedUser.C_Date,
            l_id: selectedUser.L_UID,
          });
          const response = await fetch(`${process.env.REACT_APP_API_URL}/accs/logs?${params}`);
          if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
          const logs = await response.json();
          setDetailLogs(logs);
        } catch (error) {
          console.error("Failed to fetch detail logs", error);
          setDetailLogs([]);
        } finally {
          setDetailLoading(false);
        }
      };
      fetchDetailLogs();
    }
  }, [selectedUser]);

  const handleRowClick = (user) => {
    setSelectedUser(user);
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setDetailLogs([]);
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const pageIndex = pagination.pageIndex;
  const pageSize = pagination.pageSize;

  if (loading) return <p className="text-center text-lg mt-8">Loading...</p>;
  if (error) return <p className="text-center text-red-600 text-lg mt-8">Error: {error.message}</p>;

  return (
    <div className="p-6 pb-12 max-h-screen overflow-y-auto mb-4"> 
      <h2 className="text-2xl font-bold mb-4">Staffing Check In and Out</h2>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-4">
            <div>
              <label htmlFor="fromDate" className="block text-sm font-medium text-gray-700">From</label>
              <input type="date" id="fromDate" value={fromDate} onChange={e => setFromDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
            <div>
              <label htmlFor="toDate" className="block text-sm font-medium text-gray-700">To</label>
              <input type="date" id="toDate" value={toDate} onChange={e => setToDate(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
            </div>
        </div>
      </div>

      {/* Filter UI */}
      <div className="flex gap-2 mb-1.5">
          {table.getHeaderGroups().map(headerGroup => (
              headerGroup.headers.map(header => (
                <div key={header.id} className="flex-1 flex flex-col items-center justify-start px-1 min-w-0">
                  <label htmlFor={`filter-${header.id}`} className="font-semibold text-xs text-gray-700 select-none mb-0.5 whitespace-nowrap">
                    {header.column.columnDef.header}
                  </label>
                  {header.column.getCanFilter() ? (
                    <input
                      id={`filter-${header.id}`}
                      value={columnFilters.find(f => f.id === header.column.id)?.value || ''}
                      onChange={e => {
                        const value = e.target.value;
                        setColumnFilters(old => {
                          const others = old.filter(f => f.id !== header.column.id);
                          return value ? [...others, { id: header.column.id, value }] : others;
                        });
                      }}
                      placeholder={`Search`}
                      className="w-full max-w-[120px] px-2 py-1 text-sm rounded border border-gray-300 box-border transition-colors duration-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  ) : (
                    <div className="h-[26px]" />
                  )}
                </div>
              ))
          ))}
      </div>

      <DataTable table={table} onRowClick={handleRowClick} />

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center gap-2 mb-10">
        <button onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
          {'<<'}
        </button>
        <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
          {'<'}
        </button>
        <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
          {'>'}
        </button>
        <button onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()} className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100">
          {'>>'}
        </button>
        <span className="ml-2">
          Page{' '}
          <strong className="font-bold">
            {pageIndex + 1} of {table.getPageCount() || 1}
          </strong>
        </span>
        <span className="ml-2">
          | Go to page:{' '}
          <input
            type="number"
            min={1}
            max={table.getPageCount()}
            value={pageIndex + 1}
            onChange={e => {
              let page = e.target.value ? Number(e.target.value) - 1 : 0;
              if (page < 0) page = 0;
              else if (page >= table.getPageCount()) page = table.getPageCount() - 1;
              table.setPageIndex(page);
            }}
            className="w-12 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </span>
        <select value={pageSize} onChange={e => { table.setPageSize(Number(e.target.value)); }} className="ml-4 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500">
          {[10, 20, 30, 40, 50].map(size => (
            <option key={size} value={size}>Show {size}</option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <DetailLogModal 
          user={selectedUser} 
          logs={detailLogs} 
          loading={detailLoading} 
          onClose={handleCloseModal} 
        />
      )}
    </div>
  );
};

export default AccDataFetcher;