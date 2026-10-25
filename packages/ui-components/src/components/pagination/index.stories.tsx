import { Meta } from "@storybook/react";
import React, { useEffect, useMemo, useState } from "react";
import { Pagination, usePagination } from ":/components/pagination/index";

export default {
  title: "Components/Pagination",
  component: Pagination,
} as Meta<typeof Pagination>;

export const Basic = () => {
  const pagination = usePagination({
    defaultPagesCount: 100,
    defaultPage: 50,
  });
  return <Pagination {...pagination} />;
};

export const List = () => {
  // Numbers from 0 to 99.
  const database = useMemo(() => Array.from(Array(100).keys()), []);
  // Items to display on the current page.
  const [items, setItems] = useState<number[]>([]);
  const pagination = usePagination({ pageSize: 10 });
  // The pagination object is recreated on each render: depend on its stable fields.
  const { page, pageSize, setPagesCount } = pagination;

  // On page change.
  useEffect(() => {
    // Simulate a HTTP request delay.
    const timeout = setTimeout(() => {
      // Sets the number of pages based on the number of items in the database.
      setPagesCount(Math.ceil(database.length / pageSize));
      // Sets the items to display on the current page.
      setItems(database.slice((page - 1) * pageSize, page * pageSize));
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [database, page, pageSize, setPagesCount]);

  return (
    <div>
      <div>
        {items.map((item) => (
          <div className="p-t bg-semantic-neutral-tertiary mb-t" key={item}>
            {item}
          </div>
        ))}
      </div>
      <Pagination {...pagination} />
    </div>
  );
};

export const ForcePage = () => {
  const pagination = usePagination({
    defaultPagesCount: 10,
  });
  const { setPage } = pagination;
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(5);
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [setPage]);
  return <Pagination {...pagination} />;
};

export const WithoutGoto = () => {
  const pagination = usePagination({
    defaultPagesCount: 100,
    defaultPage: 50,
  });
  return <Pagination {...pagination} displayGoto={false} />;
};
