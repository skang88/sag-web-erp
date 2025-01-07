import React from 'react';

const DefaultColumnFilter = ({ column: { filterValue, preFilteredRows, setFilter } }) => {
    const count = preFilteredRows.length;

    return (
        <input
            value={filterValue || ''}
            onChange={e => setFilter(e.target.value || undefined)}
            placeholder={`Search ${count} records...`}
            style={{ width: '100%' }}
        />
    );
};

export default DefaultColumnFilter;
