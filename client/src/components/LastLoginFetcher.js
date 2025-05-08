import React, { useState, useEffect, useMemo } from 'react';
import { useTable, useFilters, useSortBy } from 'react-table';
import DefaultColumnFilter from './DefaultColumnFilter';
import DataTable from './DataTable';
import DownloadButton from './DownloadButton';

const LastLoginFetcher = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const columns = useMemo(
        () => [
            { Header: 'ID', accessor: 'L_ID', Filter: DefaultColumnFilter },
            { Header: 'Employee ID', accessor: 'C_Unique', Filter: DefaultColumnFilter },
            { Header: 'Name', accessor: 'C_Name', Filter: DefaultColumnFilter },
            { Header: 'Last Login', accessor: 'LastLoginDateTime', Filter: DefaultColumnFilter },
            { Header: 'Days Since Login', accessor: 'DaysSinceLastLogin', Filter: DefaultColumnFilter }
        ],
        []
    );

    const tableInstance = useTable(
        { columns, data },
        useFilters,
        useSortBy
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

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error.message}</p>;

    return (
        <div>
            <h2> Most recent fingerprint access log </h2>
            <p> Latest login activity (previous day) </p>
            <p> Total number of registered individuals: {data.length} </p>
            <DownloadButton instance={tableInstance} />
            <DataTable instance={tableInstance} />
        </div>
    );
};

export default LastLoginFetcher;
