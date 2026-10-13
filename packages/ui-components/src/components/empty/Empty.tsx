import clsx from "clsx";
import { Heading } from "react-aria-components";
import { EmptyProps } from "./types";

export const Empty = ({
  title,
  headingLevel = 3,
  description,
  media,
  actions,
  className,
  ...props
}: EmptyProps) => {
  // A group only when named: an unnamed group is noise for screen readers.
  const named = props["aria-label"] != null || props["aria-labelledby"] != null;
  return (
    <div
      role={named ? "group" : undefined}
      {...props}
      className={clsx("c__empty", className)}
    >
      {media != null && <div className="c__empty__media">{media}</div>}
      <Heading level={headingLevel} className="c__empty__title">
        {title}
      </Heading>
      {description != null && (
        <div className="c__empty__description">{description}</div>
      )}
      {actions != null && <div className="c__empty__actions">{actions}</div>}
    </div>
  );
};
