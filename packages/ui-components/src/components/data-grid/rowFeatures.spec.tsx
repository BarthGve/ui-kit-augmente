import React, { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataGrid, Row, SortModel } from ":/components/data-grid/index";
import { SimpleDataGrid } from ":/components/data-grid/SimpleDataGrid";
import { CunninghamProvider } from ":/components/provider";

const rows = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];
const columns = [{ field: "name", headerName: "Name" }];

describe("<DataGrid/> row features", () => {
  describe("without the new props", () => {
    it("renders plain rows", () => {
      render(
        <CunninghamProvider>
          <DataGrid columns={columns} rows={rows} />
        </CunninghamProvider>,
      );
      const tr = screen.getByTestId("a");
      expect(tr.tagName).toBe("TR");
      expect(tr.getAttribute("tabindex")).toBeNull();
      expect(tr.getAttribute("class")).toBeNull();
      expect(screen.getAllByRole("row").length).toBe(3);
    });
  });

  describe("onRowActivate", () => {
    const setup = () => {
      const onRowActivate = vi.fn();
      render(
        <CunninghamProvider>
          <DataGrid
            columns={[
              ...columns,
              {
                id: "act",
                renderCell: () => <button type="button">Inner</button>,
              },
            ]}
            rows={rows}
            onRowActivate={onRowActivate}
          />
        </CunninghamProvider>,
      );
      return onRowActivate;
    };

    it("makes rows focusable and marks them activable", () => {
      setup();
      const tr = screen.getByTestId("a");
      expect(tr.getAttribute("tabindex")).toBe("0");
      expect(tr.classList.contains("c__datagrid__row--activable")).toBe(true);
    });

    it("activates on click", async () => {
      const onRowActivate = setup();
      await userEvent.click(screen.getByText("Bob"));
      expect(onRowActivate).toHaveBeenCalledTimes(1);
      expect(onRowActivate).toHaveBeenCalledWith(rows[1]);
    });

    it("activates on Enter and Space when the row is focused", async () => {
      const onRowActivate = setup();
      screen.getByTestId("a").focus();
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard(" ");
      expect(onRowActivate).toHaveBeenCalledTimes(2);
      expect(onRowActivate).toHaveBeenCalledWith(rows[0]);
    });

    it("ignores keys coming from an inner control", async () => {
      const onRowActivate = setup();
      const [button] = screen.getAllByRole("button", { name: "Inner" });
      button.focus();
      await userEvent.keyboard("{Enter}");
      await userEvent.keyboard(" ");
      expect(onRowActivate).not.toHaveBeenCalled();
    });

    it("ignores clicks on an inner control", async () => {
      const onRowActivate = setup();
      await userEvent.click(
        screen.getAllByRole("button", { name: "Inner" })[0],
      );
      expect(onRowActivate).not.toHaveBeenCalled();
    });

    it("works through SimpleDataGrid", async () => {
      const onRowActivate = vi.fn();
      render(
        <CunninghamProvider>
          <SimpleDataGrid
            columns={columns}
            rows={rows}
            onRowActivate={onRowActivate}
          />
        </CunninghamProvider>,
      );
      await userEvent.click(screen.getByText("Alice"));
      expect(onRowActivate).toHaveBeenCalledWith(rows[0]);
    });
  });

  describe("renderRowDetail", () => {
    it("adds a colSpan detail row only where a node is returned", () => {
      render(
        <CunninghamProvider>
          <DataGrid
            columns={[...columns, { field: "id", headerName: "Id" }]}
            rows={rows}
            renderRowDetail={(row) =>
              row.id === "a" ? <span>Detail of {row.name}</span> : null
            }
          />
        </CunninghamProvider>,
      );
      const detail = screen.getByText("Detail of Alice").closest("td")!;
      expect(detail.getAttribute("colspan")).toBe("2");
      const detailRow = detail.closest("tr")!;
      expect(detailRow.classList.contains("c__datagrid__row--detail")).toBe(
        true,
      );
      expect(detailRow.previousElementSibling).toBe(screen.getByTestId("a"));
      expect(screen.queryByText("Detail of Bob")).toBeNull();
      expect(
        document.querySelectorAll(".c__datagrid__row--detail").length,
      ).toBe(1);
    });

    it("counts the selection column in colSpan", () => {
      render(
        <CunninghamProvider>
          <DataGrid
            columns={columns}
            rows={rows}
            enableRowSelection
            rowSelection={{}}
            onRowSelectionChange={() => {}}
            renderRowDetail={() => <span>Detail</span>}
          />
        </CunninghamProvider>,
      );
      expect(
        screen.getAllByText("Detail")[0].closest("td")!.getAttribute("colspan"),
      ).toBe("2");
    });
  });

  describe("getRowClassName", () => {
    it("adds the class to the row", () => {
      render(
        <CunninghamProvider>
          <DataGrid
            columns={columns}
            rows={rows}
            getRowClassName={(row) => (row.id === "b" ? "my-row" : undefined)}
          />
        </CunninghamProvider>,
      );
      expect(screen.getByTestId("b").classList.contains("my-row")).toBe(true);
      expect(screen.getByTestId("a").classList.contains("my-row")).toBe(false);
    });
  });

  describe("renderRow", () => {
    it("lets the consumer own the <tr> and receives the grid's row props", async () => {
      const onRowActivate = vi.fn();
      const seen: string[] = [];
      render(
        <CunninghamProvider>
          <DataGrid
            columns={columns}
            rows={rows}
            onRowActivate={onRowActivate}
            renderRow={({ row, rowProps, children }) => {
              seen.push(row.id);
              return (
                <tr {...rowProps} data-drag={row.id}>
                  {children}
                </tr>
              );
            }}
          />
        </CunninghamProvider>,
      );
      expect(seen).toEqual(expect.arrayContaining(["a", "b"]));
      const tr = screen.getByTestId("a");
      expect(tr.getAttribute("data-drag")).toBe("a");
      expect(tr.getAttribute("tabindex")).toBe("0");
      expect(screen.getByText("Alice").tagName).toBe("TD");
      await userEvent.click(screen.getByText("Alice"));
      expect(onRowActivate).toHaveBeenCalledWith(rows[0]);
    });

    it("keeps the detail row after the consumer's row", () => {
      render(
        <CunninghamProvider>
          <DataGrid
            columns={columns}
            rows={[rows[0]]}
            renderRowDetail={() => <span>Detail</span>}
            renderRow={({ rowProps, children }) => (
              <tr {...rowProps} data-custom>
                {children}
              </tr>
            )}
          />
        </CunninghamProvider>,
      );
      const detailRow = screen.getByText("Detail").closest("tr")!;
      expect(
        detailRow.previousElementSibling!.hasAttribute("data-custom"),
      ).toBe(true);
    });
  });

  describe("sortable header keyboard", () => {
    const Sortable = () => {
      const [sortModel, setSortModel] = useState<SortModel>([]);
      return (
        <CunninghamProvider>
          <DataGrid
            columns={[
              { field: "name", headerName: "Name", enableSorting: true },
            ]}
            rows={rows as Row[]}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
          />
          <output data-testid="sort">{JSON.stringify(sortModel)}</output>
        </CunninghamProvider>
      );
    };

    it.each([["{Enter}"], [" "]])("sorts on %s", async (key) => {
      render(<Sortable />);
      screen.getByRole("button", { name: /Name/ }).focus();
      await userEvent.keyboard(key);
      expect(screen.getByTestId("sort").textContent).toContain('"sort"');
      expect(screen.getByTestId("sort").textContent).toContain("name");
    });
  });
});
