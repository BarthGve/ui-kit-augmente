import { act, render, screen } from "@testing-library/react";
import React from "react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { Input } from ":/components/forms/input/index";
import { TextArea } from ":/components/forms/text-area/index";

type Values = { f: string };

// Same cases for both components: they share the controlled/uncontrolled logic.
const cases = [
  ["Input", Input, "textbox"],
  ["TextArea", TextArea, "textbox"],
] as const;

describe.each(cases)("<%s/> with react-hook-form register()", (_n, Comp) => {
  let api: ReturnType<typeof useForm<Values>>;
  const Form = ({ defaultValues }: { defaultValues?: Values }) => {
    api = useForm<Values>({ defaultValues });
    return <Comp label="F" {...api.register("f")} />;
  };
  const field = () => screen.getByRole("textbox", { name: "F" }) as HTMLInputElement;

  it("shows defaultValues", () => {
    render(<Form defaultValues={{ f: "Défaut" }} />);
    expect(field().value).toBe("Défaut");
  });

  it("shows reset() values", async () => {
    render(<Form defaultValues={{ f: "a" }} />);
    await act(async () => api.reset({ f: "Reset" }));
    expect(field().value).toBe("Reset");
  });

  it("shows setValue() values", async () => {
    render(<Form />);
    await act(async () => api.setValue("f", "Set"));
    expect(field().value).toBe("Set");
  });

  it("registers typing", async () => {
    render(<Form />);
    await userEvent.setup().type(field(), "abc");
    expect(api.getValues("f")).toBe("abc");
  });
});

describe.each(cases)("<%s/> value handling", (_n, Comp) => {
  const field = () => screen.getByRole("textbox") as HTMLInputElement;

  it("keeps uncontrolled when value is undefined", () => {
    render(<Comp label="F" defaultValue="x" />);
    const el = field();
    el.value = "programmatic";
    expect(el.value).toBe("programmatic");
  });

  it("displays value={0} for a numeric value", () => {
    render(<Comp label="F" value={0 as unknown as string} onChange={() => {}} />);
    expect(field().value).toBe("0");
  });

  it("displays defaultValue={0}", () => {
    render(<Comp label="F" defaultValue={0 as unknown as string} />);
    expect(field().value).toBe("0");
  });

  it("controlled: follows props and respects empty string", async () => {
    const { rerender } = render(<Comp label="F" value="a" onChange={() => {}} />);
    expect(field().value).toBe("a");
    rerender(<Comp label="F" value="" onChange={() => {}} />);
    expect(field().value).toBe("");
  });

  it("forwards ref and onChange", async () => {
    const ref = React.createRef<HTMLInputElement>();
    const onChange = vi.fn();
    render(<Comp label="F" ref={ref as never} onChange={onChange} />);
    expect(ref.current).toBe(field());
    await userEvent.setup().type(field(), "ab");
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it("char counter follows uncontrolled typing and defaultValue", async () => {
    render(<Comp label="F" defaultValue="ab" charCounter charCounterMax={10} />);
    expect(screen.getByText("2/10")).toBeInTheDocument();
    await userEvent.setup().type(field(), "c");
    expect(screen.getByText("3/10")).toBeInTheDocument();
  });
});
