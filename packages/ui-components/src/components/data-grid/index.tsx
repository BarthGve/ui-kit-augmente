import React, {
  CSSProperties,
  Fragment,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  useMemo,
} from "react";
import classNames from "classnames";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  RowSelectionState,
  TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import { Pagination, PaginationProps } from ":/components/pagination";
import { useCunningham } from ":/components/provider";
import { Loader } from ":/components/loader";
import {
  HEADER_ID_SELECT,
  paginationToPaginationState,
  sortingStateToSortModel,
  sortModelToSortingState,
  useHeadlessColumns,
} from ":/components/data-grid/utils";
import emptyImageUrl from ":/components/data-grid/empty.svg";
import { Checkbox } from ":/components/forms/checkbox";

export interface Row extends Record<string, unknown> {
  id: string;
}

export interface ColumnField {
  id?: string;
  field: string;
  renderCell?: never;
}

export interface ColumnCustomCell<T extends Row = Row> {
  id?: string;
  field: string;
  renderCell: (params: { row: T }) => React.ReactNode;
}
export interface ColumnDisplayCell<T extends Row = Row> {
  id: string;
  field?: never;
  renderCell: (params: { row: T }) => React.ReactNode;
}

export type Column<T extends Row = Row> = (
  | ColumnCustomCell<T>
  | ColumnDisplayCell<T>
  | ColumnField
) & {
  headerName?: string;
  highlight?: boolean;
  enableSorting?: boolean;
  size?: number;
};

/** Props the grid puts on a `<tr>`, handed to `renderRow` so it can be spread. */
export type RowProps = HTMLAttributes<HTMLTableRowElement> & {
  "data-testid": string;
};

const INTERACTIVE_SELECTOR =
  'a,button,input,select,textarea,label,[role="button"],[role="checkbox"]';

export type SortModel = { field: string; sort: "asc" | "desc" | null }[];

export interface BaseProps<T extends Row = Row> {
  columns: Column<T>[];
  rows: T[];
  isLoading?: boolean;
  enableRowSelection?: TableOptions<T>["enableRowSelection"];
  onRowSelectionChange?: (newSelection: RowSelectionState) => void;
  rowSelection?: RowSelectionState;
  emptyPlaceholderLabel?: string;
  emptyCta?: ReactNode;
  hideEmptyPlaceholderImage?: boolean;
  enableSorting?: boolean;
  className?: string;
  /**
   * Makes rows activable: click, Enter or Space on the row itself (not on a
   * control inside it). Rows get `tabIndex=0` and `c__datagrid__row--activable`.
   */
  onRowActivate?: (row: T) => void;
  /** Extra full-width row (`colSpan`) rendered after a row; nothing if falsy. */
  renderRowDetail?: (row: T) => ReactNode;
  /** Class name added on the row `<tr>`. */
  getRowClassName?: (row: T) => string | undefined;
  /**
   * Replaces the row `<tr>`, e.g. to make it draggable. Spread `rowProps` on
   * the `<tr>` you render and render `children` inside it.
   */
  renderRow?: (params: {
    row: T;
    rowProps: RowProps;
    children: ReactNode;
  }) => ReactNode;
}

export interface DataGridProps<T extends Row = Row> extends BaseProps<T> {
  pagination?: PaginationProps;
  sortModel?: SortModel;
  onSortModelChange?: (newSortModel: SortModel) => void;
  /** Options for the underlying tanstack table. */
  tableOptions?: TableOptions<T>;
  displayHeader?: boolean;
}

export const DataGrid = <T extends Row>({
  columns,
  rows,
  pagination,
  sortModel,
  onSortModelChange,
  isLoading,
  enableRowSelection,
  onRowSelectionChange,
  rowSelection,
  tableOptions,
  className,
  emptyPlaceholderLabel,
  emptyCta,
  hideEmptyPlaceholderImage,
  displayHeader = true,
  enableSorting = true,
  onRowActivate,
  renderRowDetail,
  getRowClassName,
  renderRow,
}: DataGridProps<T>) => {
  const { t } = useCunningham();
  const headlessColumns = useHeadlessColumns({ columns, enableRowSelection });

  headlessColumns.forEach((column) => {
    if (column.enableSorting && !onSortModelChange) {
      console.warn(
        "You are using a column with sorting enabled, but you are not providing an `onSortModelChange` handler. The sorting will not work as expected.",
      );
    }
  });

  /**
   * Features.
   */
  const paginationState = useMemo(
    () => paginationToPaginationState(pagination),
    [pagination],
  );
  const headlessSorting = useMemo(
    () => sortModelToSortingState(sortModel),
    [sortModel],
  );

  /**
   * Table.
   */
  const table = useReactTable({
    data: rows,
    columns: headlessColumns,
    state: {
      sorting: headlessSorting,
      rowSelection,
      pagination: paginationState,
    },
    // Sorting
    enableSorting,
    getSortedRowModel: getSortedRowModel(),
    manualSorting: true,
    onSortingChange: (newHeadlessSorting) => {
      // Should always be a function, but we must do this verification to avoid
      // a TS error.
      if (typeof newHeadlessSorting === "function") {
        onSortModelChange?.(
          sortingStateToSortModel(newHeadlessSorting(headlessSorting)),
        );
      }
    },
    // Pagination
    manualPagination: true,
    pageCount: pagination?.pagesCount ?? 0,
    onPaginationChange: (newPagination) => {
      if (paginationState && typeof newPagination === "function") {
        pagination?.onPageChange?.(newPagination(paginationState).pageIndex);
      }
    },
    // Row selection
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection,
    onRowSelectionChange: (newRowSelection) => {
      if (newRowSelection && typeof newRowSelection === "function") {
        onRowSelectionChange?.(newRowSelection(rowSelection!));
      }
    },
    // Related to https://github.com/TanStack/table/issues/4555.
    getRowId: (row) => {
      return row.id;
    },
    ...tableOptions,
  });
  const isEmpty = rows.length === 0;
  const showEmptyPlaceholder = !isLoading && isEmpty;

  const getContent = () => {
    if (showEmptyPlaceholder) {
      return (
        <div className="c__datagrid__empty-placeholder fs-h3 fw-bold">
          {!hideEmptyPlaceholderImage && (
            <img src={emptyImageUrl} alt={t("components.datagrid.empty_alt")} />
          )}

          {emptyPlaceholderLabel ?? t("components.datagrid.empty")}
          {emptyCta}
        </div>
      );
    }
    return (
      <>
        {isLoading && (
          <div className="c__datagrid__loader">
            <div className="c__datagrid__loader__background" />
            <Loader aria-label={t("components.datagrid.loader_aria")} />
          </div>
        )}
        {!isEmpty && (
          <>
            <div className="c__datagrid__table__container">
              <table>
                <thead>
                  {displayHeader &&
                    table.getHeaderGroups().map((headerGroup) => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map((header, i) => {
                          const style: CSSProperties = {};
                          const column = headlessColumns[i];
                          if (column && typeof column.size !== "undefined") {
                            style.width = `${column.size}px`;
                          }

                          return (
                            <th
                              key={header.id}
                              colSpan={header.colSpan}
                              className={classNames({
                                "c__datagrid__header--select":
                                  header.id === HEADER_ID_SELECT,
                              })}
                              style={style}
                            >
                              {header.isPlaceholder ? null : (
                                <div
                                  className={classNames(
                                    "c__datagrid__header fs-h5",
                                    {
                                      "c__datagrid__header--sortable":
                                        header.column.getCanSort(),
                                    },
                                  )}
                                  {...(header.column.getCanSort()
                                    ? {
                                        role: "button",
                                        tabIndex: 0,
                                        onClick:
                                          header.column.getToggleSortingHandler(),
                                        onKeyDown: (
                                          e: KeyboardEvent<HTMLDivElement>,
                                        ) => {
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
                                            e.preventDefault();
                                            header.column.getToggleSortingHandler()?.(
                                              e,
                                            );
                                          }
                                        },
                                      }
                                    : {})}
                                >
                                  {/* We cant use flexRender for select header because it triggers a re-render each time */}
                                  {/* a row is selected or unselected, re-triggering the animation each time, which looks buggy. */}
                                  {header.id === HEADER_ID_SELECT ? (
                                    <Checkbox
                                      checked={table.getIsAllRowsSelected()}
                                      indeterminate={table.getIsSomeRowsSelected()}
                                      onChange={table.getToggleAllRowsSelectedHandler()}
                                      aria-label={t(
                                        "components.datagrid.rows_selection_aria",
                                      )}
                                    />
                                  ) : (
                                    flexRender(
                                      header.column.columnDef.header,
                                      header.getContext(),
                                    )
                                  )}
                                  {header.column.getIsSorted() === "asc" && (
                                    <span className="material-icons">
                                      arrow_drop_up
                                    </span>
                                  )}
                                  {header.column.getIsSorted() === "desc" && (
                                    <span className="material-icons">
                                      arrow_drop_down
                                    </span>
                                  )}
                                  {header.id !== "select" &&
                                    !header.column.getIsSorted() && (
                                      <span className="c__datagrid__header__icon-placeholder" />
                                    )}
                                </div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map((tableRow) => {
                    const row = tableRow.original;
                    const rowProps: RowProps = {
                      "data-testid": tableRow.id,
                      className:
                        classNames(getRowClassName?.(row), {
                          "c__datagrid__row--activable": !!onRowActivate,
                        }) || undefined,
                      ...(onRowActivate
                        ? {
                            tabIndex: 0,
                            onClick: (e: MouseEvent<HTMLTableRowElement>) => {
                              if (
                                !(e.target as HTMLElement).closest(
                                  INTERACTIVE_SELECTOR,
                                )
                              ) {
                                onRowActivate(row);
                              }
                            },
                            onKeyDown: (
                              e: KeyboardEvent<HTMLTableRowElement>,
                            ) => {
                              if (
                                e.target === e.currentTarget &&
                                (e.key === "Enter" || e.key === " ")
                              ) {
                                e.preventDefault();
                                onRowActivate(row);
                              }
                            },
                          }
                        : {}),
                    };
                    const cells = tableRow.getVisibleCells().map((cell, i) => {
                      let highlight = false;
                      if (enableRowSelection && i > 0) {
                        // Enabling selection adds a column at the beginning of the table.
                        highlight = !!columns[i - 1].highlight;
                      } else {
                        highlight = !!columns[i].highlight;
                      }
                      const style: CSSProperties = {};
                      if (displayHeader === false) {
                        const column = columns[i];
                        if (column && typeof column.size === "number") {
                          style.width = `${column.size}px`;
                        }
                      }
                      return (
                        <td
                          key={cell.id}
                          className={classNames({
                            "c__datagrid__row__cell--highlight": highlight,
                            "c__datagrid__row__cell--actions":
                              cell.column.id === "actions",
                            "c__datagrid__row__cell--select":
                              cell.column.id === "select",
                          })}
                          style={style}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      );
                    });
                    const detail = renderRowDetail?.(row);
                    return (
                      <Fragment key={tableRow.id}>
                        {renderRow ? (
                          renderRow({ row, rowProps, children: cells })
                        ) : (
                          <tr {...rowProps}>{cells}</tr>
                        )}
                        {detail && (
                          <tr className="c__datagrid__row--detail">
                            <td colSpan={cells.length}>{detail}</td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {!!pagination && <Pagination {...pagination} />}
          </>
        )}
      </>
    );
  };

  return (
    <div
      className={classNames("c__datagrid", className, {
        "c__datagrid--empty": isEmpty,
        "c__datagrid--loading": isLoading,
      })}
    >
      {getContent()}
    </div>
  );
};
