import { flexRender } from '@tanstack/react-table';

const DataTable = ({ table }) => {
  return (
    <div className="shadow-lg rounded-lg overflow-auto">
        <table className="w-full border-collapse bg-white">
          <thead className="bg-gray-200 sticky top-0">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className={`text-center p-3 border-b-2 border-gray-300 bg-gray-100 select-none ${
                      header.column.getCanSort() ? 'cursor-pointer' : 'cursor-default'
                    }`}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted()] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, index) => (
              <tr key={row.id} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100`}>
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className="p-3 border-b border-gray-200 text-center"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
};

export default DataTable;