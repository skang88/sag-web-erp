import { flexRender } from '@tanstack/react-table';

const DataTable = ({ table }) => {
  return (
    <table style={{ width: '80%', margin: '20px auto', borderCollapse: 'collapse' }}>
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                style={{
                  textAlign: 'center',
                  cursor: header.column.getCanSort() ? 'pointer' : 'default',
                  padding: '10px',
                  borderBottom: '1px solid #ddd',
                  backgroundColor: '#f4f4f4',
                  userSelect: 'none',
                }}
              >
                {flexRender(header.column.columnDef.header, header.getContext())}
                {{
                  asc: ' 🔼',
                  desc: ' 🔽',
                }[header.column.getIsSorted()] ?? null}
                <div>
                  {header.column.getCanFilter() ? flexRender(header.column.columnDef.columnFilterValue, header.getContext()) : null}
                </div>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.map(row => (
          <tr key={row.id}>
            {row.getVisibleCells().map(cell => (
              <td
                key={cell.id}
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #ddd',
                }}
              >
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default DataTable;
