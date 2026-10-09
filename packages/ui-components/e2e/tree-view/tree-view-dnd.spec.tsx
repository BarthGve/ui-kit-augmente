import { test, expect } from "@playwright/experimental-ct-react";
import type { Page } from "@playwright/test";
import { TestTreeView } from "../helpers/mount-tree-view";

// Real pointer drags through react-arborist's HTML5 backend, which jsdom
// cannot run (TreeView.spec.tsx covers the logic). A row is 34px high: its
// middle band (y in 8.5..25.5) drops "into" a node with children, its top
// quarter drops "before" it.

const row = (page: Page, id: string) =>
  page.getByRole("treeitem").filter({ has: page.getByTestId(`node-${id}`) });

const drag = (page: Page, source: string, target: string, y = 17) =>
  page
    .getByTestId(`node-${source}`)
    .dragTo(row(page, target), { targetPosition: { x: 50, y } });

// The visible tree, top to bottom, as "<aria-level>:<id>".
const shape = (page: Page) =>
  page.getByRole("treeitem").evaluateAll((rows) =>
    rows.map((r) => {
      const id = r.querySelector("[data-testid]")?.getAttribute("data-testid");
      return `${r.getAttribute("aria-level")}:${id?.replace("node-", "")}`;
    }),
  );

const moves = (page: Page) => page.evaluate(() => window.__treeMoves);
const canDropAsked = (page: Page) =>
  page.evaluate(() => window.__canDropAsked);

const nodes = [{ id: "a" }, { id: "b", children: [{ id: "b1" }] }, { id: "c" }];

test.describe("TreeView - drag and drop with a real pointer", () => {
  test("A: moves a root node into a parent and reports the new parent", async ({
    mount,
    page,
  }) => {
    await mount(<TestTreeView nodes={nodes} open={["b"]} />);
    await expect.poll(() => shape(page)).toEqual(["1:a", "1:b", "2:b1", "1:c"]);

    await drag(page, "a", "b");

    await expect
      .poll(() => moves(page))
      .toEqual([
        expect.objectContaining({
          sourceId: "a",
          newParentId: "b",
          mode: "first-child",
          index: 0,
        }),
      ]);
    await expect.poll(() => shape(page)).toEqual(["1:b", "2:a", "2:b1", "1:c"]);
  });

  test("A: drops a node before the first root node at index 0", async ({
    mount,
    page,
  }) => {
    await mount(<TestTreeView nodes={nodes} open={["b"]} />);

    await drag(page, "c", "a", 3);

    await expect
      .poll(() => moves(page))
      .toEqual([
        expect.objectContaining({
          sourceId: "c",
          newParentId: null,
          mode: "first-child",
          index: 0,
        }),
      ]);
    await expect.poll(() => shape(page)).toEqual(["1:c", "1:a", "1:b", "2:b1"]);
  });

  test("B: leaves the tree unchanged when canDrop refuses the parent", async ({
    mount,
    page,
  }) => {
    await mount(<TestTreeView nodes={nodes} open={["b"]} refuseParent="b" />);

    await drag(page, "a", "b");

    // The drag reached b and was refused there.
    await expect.poll(() => canDropAsked(page)).toContain("b");
    expect(await moves(page)).toEqual([]);
    expect(await shape(page)).toEqual(["1:a", "1:b", "2:b1", "1:c"]);
  });

  test("C: moves a node into a parent whose children were loaded lazily", async ({
    mount,
    page,
  }) => {
    await mount(
      <TestTreeView
        nodes={[{ id: "a" }, { id: "l", lazy: ["l1"] }]}
        open={["l"]}
      />,
    );
    await expect(page.getByTestId("node-l1")).toBeVisible();

    await drag(page, "a", "l");

    await expect
      .poll(() => moves(page))
      .toEqual([expect.objectContaining({ sourceId: "a", newParentId: "l" })]);
    await expect.poll(() => shape(page)).toEqual(["1:l", "2:a", "2:l1"]);
  });

  for (const modal of ["with-root", "without-root"] as const) {
    test(`D: moves a node in a tree inside a Modal (dndRootElement ${modal})`, async ({
      mount,
      page,
    }) => {
      await mount(<TestTreeView nodes={nodes} open={["b"]} modal={modal} />);
      await expect(page.getByRole("dialog")).toBeVisible();
      await expect.poll(() => shape(page)).toEqual(["1:a", "1:b", "2:b1", "1:c"]);

      await drag(page, "a", "b");

      await expect
        .poll(() => moves(page))
        .toEqual([
          expect.objectContaining({ sourceId: "a", newParentId: "b" }),
        ]);
      await expect
        .poll(() => shape(page))
        .toEqual(["1:b", "2:a", "2:b1", "1:c"]);
    });
  }
});
