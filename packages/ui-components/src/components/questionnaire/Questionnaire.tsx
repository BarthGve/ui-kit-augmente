import clsx from "clsx";
import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { Button } from ":/components/button";
import { Checkbox } from ":/components/forms/checkbox";
import { Radio } from ":/components/forms/radio";
import { useCunningham } from ":/components/provider";

export type QuestionnaireOption = { value: string; label: string };

export type QuestionnaireItem = {
  id: string;
  label: string;
  /** `single`: one choice, `multiple`: several, `text`: free text. */
  type: "single" | "multiple" | "text";
  options?: QuestionnaireOption[];
  required?: boolean;
};

export type QuestionnaireAnswers = Record<string, string | string[]>;

export type QuestionnaireProps = {
  /** Names the form. */
  "aria-label": string;
  items: QuestionnaireItem[];
  /** Called with the answers (read from the form) when the last question is submitted. */
  onSubmit: (answers: QuestionnaireAnswers) => void;
  /** Index of the current question, when controlled. */
  step?: number;
  onStepChange?: (step: number) => void;
  className?: string;
};

const isAnswered = (form: HTMLFormElement, item: QuestionnaireItem) =>
  new FormData(form)
    .getAll(item.id)
    .some((value) => typeof value === "string" && value.trim() !== "");

/**
 * A step-by-step questionnaire: one question at a time, with Previous, Next,
 * Skip (optional questions) and Submit. Each question is a `fieldset` with a
 * `legend`; the others stay in the page but inert, so their answers are read
 * from the form on submit. A required question blocks Next until answered and
 * puts the focus back on its first control.
 */
export const Questionnaire = ({
  items,
  onSubmit,
  step,
  onStepChange,
  className,
  ...props
}: QuestionnaireProps) => {
  const { t } = useCunningham();
  const baseId = useId();
  const [inner, setInner] = useState(0);
  const [invalid, setInvalid] = useState<string>();
  const form = useRef<HTMLFormElement>(null);
  const legends = useRef<(HTMLLegendElement | null)[]>([]);
  const moved = useRef(false);
  const index = Math.min(step ?? inner, Math.max(items.length - 1, 0));
  const last = index === items.length - 1;
  const current = items[index];

  const goTo = (target: number) => {
    moved.current = true;
    setInvalid(undefined);
    if (step === undefined) setInner(target);
    onStepChange?.(target);
  };

  // The new question takes the focus (not on the first render).
  useEffect(() => {
    if (moved.current) legends.current[index]?.focus();
  }, [index]);

  const check = () => {
    if (!current || !form.current) return true;
    if (current.required && !isAnswered(form.current, current)) {
      setInvalid(current.id);
      // The controls are already in the page: focus the first one.
      form.current
        .querySelector<HTMLElement>(
          `fieldset[data-item="${current.id}"] input, fieldset[data-item="${current.id}"] textarea`,
        )
        ?.focus();
      return false;
    }
    setInvalid(undefined);
    return true;
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!last || !check() || !form.current) return;
    const data = new FormData(form.current);
    onSubmit(
      Object.fromEntries(
        items.map((item) => [
          item.id,
          item.type === "multiple"
            ? (data.getAll(item.id) as string[])
            : ((data.get(item.id) as string | null) ?? ""),
        ]),
      ),
    );
  };

  return (
    <form
      {...props}
      ref={form}
      noValidate
      className={clsx("c__questionnaire", className)}
      onSubmit={submit}
    >
      <div
        role="progressbar"
        aria-label={t("components.questionnaire.progress")}
        aria-valuemin={0}
        aria-valuemax={items.length}
        aria-valuenow={items.length ? index + 1 : 0}
        aria-valuetext={t("components.questionnaire.progress_text", {
          current: index + 1,
          total: items.length,
        })}
        className="c__questionnaire__progress"
      >
        <div
          className="c__questionnaire__progress-fill"
          style={{
            width: `${items.length ? ((index + 1) / items.length) * 100 : 0}%`,
          }}
        />
      </div>

      {items.map((item, i) => {
        const errorId = `${baseId}-${item.id}-error`;
        const hasError = invalid === item.id;
        const controlProps = {
          name: item.id,
          "aria-invalid": hasError ? true : undefined,
          "aria-describedby": hasError ? errorId : undefined,
        } as const;
        const active = i === index;
        return (
          <fieldset
            key={item.id}
            data-item={item.id}
            className="c__questionnaire__item"
            hidden={!active}
            inert={!active}
          >
            <legend
              ref={(el) => {
                legends.current[i] = el;
              }}
              id={`${baseId}-${item.id}-legend`}
              tabIndex={-1}
              className="c__questionnaire__legend"
            >
              {item.label}
            </legend>
            {item.type === "single" &&
              item.options?.map((option) => (
                <Radio
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  {...controlProps}
                />
              ))}
            {item.type === "multiple" &&
              item.options?.map((option) => (
                <Checkbox
                  key={option.value}
                  label={option.label}
                  value={option.value}
                  {...controlProps}
                />
              ))}
            {item.type === "text" && (
              <textarea
                {...controlProps}
                className="c__questionnaire__text"
                aria-labelledby={`${baseId}-${item.id}-legend`}
                rows={4}
              />
            )}
            {hasError && (
              <p id={errorId} role="alert" className="c__questionnaire__error">
                {t("components.questionnaire.required")}
              </p>
            )}
          </fieldset>
        );
      })}

      <div className="c__questionnaire__actions">
        {index > 0 && (
          <Button
            type="button"
            color="neutral"
            variant="secondary"
            onClick={() => goTo(index - 1)}
          >
            {t("components.questionnaire.previous")}
          </Button>
        )}
        {!last && current && !current.required && (
          <Button
            type="button"
            color="neutral"
            variant="tertiary"
            onClick={() => goTo(index + 1)}
          >
            {t("components.questionnaire.skip")}
          </Button>
        )}
        {last ? (
          <Button type="submit">{t("components.questionnaire.submit")}</Button>
        ) : (
          <Button type="button" onClick={() => check() && goTo(index + 1)}>
            {t("components.questionnaire.next")}
          </Button>
        )}
      </div>
    </form>
  );
};
