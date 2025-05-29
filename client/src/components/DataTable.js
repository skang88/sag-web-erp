import { flexRender } from '@tanstack/react-table';

const DataTable = ({ table }) => {
  return (
    // 기존 style={{ width: '80%', margin: '20px auto', borderCollapse: 'collapse' }}
    <table className="w-4/5 mx-auto mt-5 mb-5 border-collapse"> {/* w-4/5: width 80%, mx-auto: margin auto, mt-5 mb-5: margin top/bottom 20px */}
      <thead>
        {table.getHeaderGroups().map(headerGroup => (
          <tr key={headerGroup.id}>
            {headerGroup.headers.map(header => (
              <th
                key={header.id}
                onClick={header.column.getToggleSortingHandler()}
                // 기존 style={{ textAlign: 'center', cursor: ..., padding: '10px', borderBottom: '1px solid #ddd', backgroundColor: '#f4f4f4', userSelect: 'none' }}
                className={`text-center p-2.5 border-b border-gray-300 bg-gray-100 select-none ${
                  header.column.getCanSort() ? 'cursor-pointer' : 'cursor-default'
                }`}
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
                // 기존 style={{ padding: '10px', borderBottom: '1px solid #ddd' }}
                className="p-2.5 border-b border-gray-300"
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