import {
	flexRender,
	getCoreRowModel,
	getPaginationRowModel,
	useReactTable,
	type Column,
	type ColumnDef,
} from "@tanstack/react-table";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import { useState } from "react";

interface TableProps<T> {
	data: Array<T>;
	columns: Array<ColumnDef<T, any>>;
	pageSize?: number;
}

// Button columns: the "actions"/"quickActions" ids, or no header at all
const isActionColumn = <T,>(column: Column<T, unknown>) =>
	column.id === "actions" ||
	column.id === "quickActions" ||
	!column.columnDef.header;

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

	// Header of each column, used as the field label on the phone cards
	const headersById = new Map(
		table.getFlatHeaders().map((header) => [header.column.id, header])
	);

	return (
		<>
			<div className="w-full min-w-0 max-w-full py-4">
				{/* Phones: one card per row instead of a table with sideways
				    scroll. First column = card title, columns with a header =
				    label/value fields, action columns = card footer */}
				<ul className="flex flex-col gap-3 md:hidden">
					{table.getRowModel().rows.map((row) => {
						const [titleCell, ...otherCells] = row.getVisibleCells();
						const fieldCells = otherCells.filter(
							(cell) => !isActionColumn(cell.column)
						);
						const actionCells = otherCells.filter((cell) =>
							isActionColumn(cell.column)
						);

						return (
							<li
								key={row.id}
								className="flex flex-col gap-3 rounded-lg border-2 border-gray-100 bg-white p-4 shadow-sm"
							>
								{titleCell && (
									<div className="min-w-0 text-sm text-black">
										{flexRender(
											titleCell.column.columnDef.cell,
											titleCell.getContext()
										)}
									</div>
								)}

								{fieldCells.length > 0 && (
									<dl className="flex flex-col gap-2 text-sm">
										{fieldCells.map((cell) => {
											const header = headersById.get(cell.column.id);

											return (
												<div
													key={cell.id}
													className="flex items-center justify-between gap-3"
												>
													<dt className="shrink-0 text-gray-500">
														{header &&
															flexRender(
																cell.column.columnDef.header,
																header.getContext()
															)}
													</dt>
													<dd className="min-w-0 text-right text-black">
														{flexRender(
															cell.column.columnDef.cell,
															cell.getContext()
														)}
													</dd>
												</div>
											);
										})}
									</dl>
								)}

								{actionCells.length > 0 && (
									<div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3">
										{actionCells.map((cell) => (
											<div key={cell.id}>
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext()
												)}
											</div>
										))}
									</div>
								)}
							</li>
						);
					})}
				</ul>

				<div className="overflow-hidden rounded-lg shadow ring-1 ring-black ring-opacity-5 border-2 border-gray-100 max-md:rounded-none max-md:shadow-none max-md:ring-0 max-md:border-0">
					<div className="overflow-x-auto max-md:hidden">
						<table className="w-full min-w-[800px] table-auto divide-y divide-gray-300">
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
