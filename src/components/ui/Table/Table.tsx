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
		<>
			<div className="w-full min-w-0 max-w-full py-4">
				<div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[800px] table-fixed divide-y divide-gray-300">
							<thead className="bg-gray-50">
								{table.getHeaderGroups().map((headerGroup) => (
									<tr key={headerGroup.id}>
										{headerGroup.headers.map((header) => (
											<th
												key={header.id}
												className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
												scope="col"
												style={{
													width:
														header.column.columnDef.size !== undefined
															? header.getSize()
															: undefined,
												}}
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
									<tr
										key={row.id}
										className="hover:bg-gray-50 transition-colors"
									>
										{row.getVisibleCells().map((cell) => (
											<td
												key={cell.id}
												className="whitespace-nowrap px-3 py-4 text-sm text-black"
											>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>

					<div className="flex w-full flex-col px-4">
						<hr className="w-full" />
						<div className="flex w-full items-center justify-between py-4">
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
		</>
	);
};
