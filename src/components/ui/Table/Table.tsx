import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
	type ColumnDef,
} from "@tanstack/react-table";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";

interface TableProps<T> {
	data: Array<T>;
	columns: Array<ColumnDef<T, any>>;
	pageSize?: number;
}

export const GenericTable = <T,>({
	data,
	columns,
	pageSize = 10,
}: TableProps<T>) => {
	const [pagination, setPagination] = useState({
		pageIndex: 0,
		pageSize,
	});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		state: {
			pagination,
		},
		onPaginationChange: setPagination,
	});

	return (
		<div className="py-4">
			<div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
				<table className="min-w-full divide-y divide-gray-300">
					<thead className="bg-gray-50">
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th
										key={header.id}
										className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
										scope="col"
									>
										{flexRender(
											header.column.columnDef.header,
											header.getContext()
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody className="divide-y divide-gray-200 bg-white">
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id}>
								{row.getVisibleCells().map((cell) => (
									<td
										key={cell.id}
										className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
				{/* Pagination */}
				<div className="flex px-4 flex-col w-full">
					<hr className="w-full" />
					<div className="w-full flex justify-between items-center py-4">
						<button
							className="bg-white px-3 py-2 border border-gray-300 text-gray-700 rounded-lg"
							disabled={!table.getCanPreviousPage()}
							onClick={() => {
								table.previousPage();
							}}
						>
							<ArrowLeftIcon size={20} />
						</button>
						<span className="text-sm text-gray-600">
							Página {pagination.pageIndex + 1} de {table.getPageCount()}
						</span>

						<button
							className="bg-white px-3 py-2 border border-gray-300 text-gray-700 rounded-lg"
							disabled={!table.getCanNextPage()}
							onClick={() => {
								table.nextPage();
							}}
						>
							<ArrowRightIcon size={20} />
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
