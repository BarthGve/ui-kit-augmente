import React, { ReactNode, useState } from "react";
import type { Meta } from "@storybook/react";
import { DndContext, useDraggable } from "@dnd-kit/core";
import databaseCars from "./resources/databaseCars.json";

import { Button, DataGrid, SimpleDataGrid } from ":/cunningham";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta = {
  title: "Components/DataGrid/UI Kit extensions",
  component: DataGrid,
  tags: ["autodocs"],

  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
} satisfies Meta<typeof DataGrid>;

export default meta;

export const Empty = () => {
  return (
    <DataGrid
      columns={[
        {
          field: "firstName",
          headerName: "First name",
          highlight: true,
        },
      ]}
      rows={[]}
    />
  );
};

export const EmptyCustomWithButton = () => {
  return (
    <DataGrid
      columns={[
        {
          field: "firstName",
          headerName: "First name",
          highlight: true,
        },
      ]}
      rows={[]}
      emptyPlaceholderLabel="This table is empty, create the first object"
      emptyCta={
        <Button icon={<span className="material-icons">add</span>}>
          Create object
        </Button>
      }
    />
  );
};

export const ClientSideWithPagination = () => {
  return (
    <>
      <SimpleDataGrid
        columns={[
          {
            field: "carName",
            headerName: "Nom",
            enableSorting: false,
          },
          {
            field: "year",
            headerName: "Année",
          },
          {
            field: "price",
            headerName: "Prix",
            highlight: true,
          },
        ]}
        rows={databaseCars}
        defaultPaginationParams={{
          pageSize: 5,
        }}
        defaultSortModel={[
          {
            field: "price",
            sort: "desc",
          },
        ]}
      />
    </>
  );
};

const people = [
  { id: "1", name: "Alice", role: "Admin" },
  { id: "2", name: "Bob", role: "Editor" },
  { id: "3", name: "Chloé", role: "Viewer" },
];
const personColumns = [
  { field: "name", headerName: "Name", highlight: true },
  { field: "role", headerName: "Role" },
];

/** Click, Enter or Space on a row; open one with a detail row (`colSpan`). */
export const ActivableRowsWithDetail = () => {
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <DataGrid
      columns={personColumns}
      rows={people}
      onRowActivate={(row) => setOpenId(openId === row.id ? null : row.id)}
      getRowClassName={(row) => (row.id === openId ? "is-open" : undefined)}
      renderRowDetail={(row) =>
        row.id === openId ? <p>More about {row.name}…</p> : null
      }
    />
  );
};

const DraggableRow = ({
  id,
  rowProps,
  children,
}: {
  id: string;
  rowProps: React.HTMLAttributes<HTMLTableRowElement>;
  children: ReactNode;
}) => {
  const { setNodeRef, listeners, attributes, transform } = useDraggable({ id });
  return (
    <tr
      {...rowProps}
      {...attributes}
      {...listeners}
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
    >
      {children}
    </tr>
  );
};

/** `renderRow` lets the consumer own the `<tr>` (here a dnd-kit draggable). */
export const DraggableRows = () => (
  <DndContext>
    <DataGrid
      columns={personColumns}
      rows={people}
      renderRow={({ row, rowProps, children }) => (
        <DraggableRow id={row.id} rowProps={rowProps}>
          {children}
        </DraggableRow>
      )}
    />
  </DndContext>
);
