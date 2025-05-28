import React, { useState, useEffect, useMemo } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getFilteredRowModel,
} from '@tanstack/react-table';
import DataTable from './DataTable';

const FilterInput = ({ filterValue, onFilterChange, id, style }) => {
    return (
        <input
            id={id}
            value={filterValue || ''}
            onChange={e => onFilterChange(e.target.value)}
            placeholder="Search..."
            style={style}
        />
    );
};


const LastLoginFetcher = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [sorting, setSorting] = useState([]);
    const [columnFilters, setColumnFilters] = useState([]);

    const columns = useMemo(
        () => [
            {
                accessorKey: 'L_ID',
                header: 'ID',
                cell: info => info.getValue(),
                // filterFn: 'includesString',  // 기본 필터로도 충분하면 주석처리 가능
                enableColumnFilter: true,
            },
            {
                accessorKey: 'C_Unique',
                header: 'Employee ID',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
            {
                accessorKey: 'C_Name',
                header: 'Name',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
            {
                accessorKey: 'LastLoginDateTime',
                header: 'Last Login',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
            {
                accessorKey: 'DaysSinceLastLogin',
                header: 'Days Since Login',
                cell: info => info.getValue(),
                enableColumnFilter: true,
            },
        ],
        []
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`${process.env.REACT_APP_API_URL}/accs/lastlogin`);
                if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

                const contentType = response.headers.get('Content-Type');
                if (!contentType || !contentType.includes('application/json')) {
                    const text = await response.text();
                    throw new Error(`Expected JSON, got: ${text}`);
                }

                const result = await response.json();
                setData(result);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div>
            <h2>Most recent fingerprint access log</h2>
            <p>Latest login activity (previous day)</p>
            <p>Total number of registered individuals: {data.length}</p>

            {/* Filter UI */}
            {table.getHeaderGroups().map(headerGroup => (
                <div
                    key={headerGroup.id}
                    style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}
                >
                    {headerGroup.headers.map(header => (
                        <div
                            key={header.id}
                            style={{ flex: 1, minWidth: '100px', display: 'flex', flexDirection: 'column' }}
                        >
                            <label
                                htmlFor={`filter-${header.id}`}
                                style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.2rem' }}
                            >
                                {header.column.columnDef.header}
                            </label>
                            {header.column.getCanFilter() ? (
                                <FilterInput
                                    filterValue={
                                        columnFilters.find(f => f.id === header.column.id)?.value || ''
                                    }
                                    onFilterChange={value => {
                                        setColumnFilters(old => {
                                            const others = old.filter(f => f.id !== header.column.id);
                                            return value ? [...others, { id: header.column.id, value }] : others;
                                        });
                                    }}
                                    id={`filter-${header.id}`}
                                    style={{
                                        height: '28px',
                                        fontSize: '0.9rem',
                                        padding: '0 8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ccc',
                                        boxSizing: 'border-box',
                                        width: '100%',
                                    }}
                                />
                            ) : null}
                        </div>
                    ))}
                </div>
            ))}


            <DataTable table={table} />
        </div>
    );
};

export default LastLoginFetcher;
