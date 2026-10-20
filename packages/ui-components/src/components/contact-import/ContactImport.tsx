import clsx from "clsx";
import { useMemo, useRef, useState } from "react";
import { Button } from ":/components/button";
import { Column, DataGrid } from ":/components/data-grid";
import { FileUploader, UploadFile } from ":/components/form/file-uploader";
import { XMark } from ":/components/icon/icons/XMark";
import { useCunningham } from ":/components/provider";
import {
  ContactRow,
  EditableContact,
  parseContacts,
  validateContacts,
  ValidatedContact,
} from "./utils";

export type { ContactRow } from "./utils";

export type ContactImportProps = {
  /** Called with the valid contacts only, when the import is confirmed. */
  onImport: (contacts: ContactRow[]) => void;
  /** Most contacts a file may hold. Default 500. */
  maxRows?: number;
  className?: string;
};

const ACCEPT = [".csv", ".xlsx"];

/**
 * Contact import: choose a CSV or XLSX file, review its contacts in a table,
 * fix or remove the rows with an invalid or duplicate e-mail address, then
 * import the valid ones. The file is read in the browser; nothing is sent.
 */
export const ContactImport = ({
  onImport,
  maxRows = 500,
  className,
}: ContactImportProps) => {
  const { t } = useCunningham();
  const [file, setFile] = useState<UploadFile>();
  const [error, setError] = useState<string>();
  const [contacts, setContacts] = useState<EditableContact[]>([]);
  const requestId = useRef(0);

  const validated = useMemo(
    () =>
      validateContacts(contacts).map((c, index) => ({
        ...c,
        position: index + 1,
      })),
    [contacts],
  );
  const valid = validated.filter((c) => c.status === "valid");
  const toFix = validated.length - valid.length;

  const reset = () => {
    requestId.current++;
    setFile(undefined);
    setError(undefined);
    setContacts([]);
  };

  const load = async (selected?: UploadFile) => {
    reset();
    if (!selected) {
      return;
    }
    const id = requestId.current;
    setFile(selected);
    const { name } = selected.originalFile;
    if (!ACCEPT.some((extension) => name.toLowerCase().endsWith(extension))) {
      setError(t("components.contactImport.error_type"));
      return;
    }
    const result = await parseContacts(selected.originalFile);
    if (id !== requestId.current) {
      return;
    }
    if (result.error) {
      setError(t(`components.contactImport.error_${result.error}`));
    } else if (result.rows.length > maxRows) {
      setError(t("components.contactImport.error_too_many", { max: maxRows }));
    } else {
      setContacts(
        result.rows.map((row, index) => ({ ...row, id: `contact-${index}` })),
      );
    }
  };

  // Stable columns: a new array would remount the cells, and the input being
  // typed in would lose focus at each key.
  const columns = useMemo<Column<ValidatedContact>[]>(
    () => [
      {
        id: "email",
        headerName: t("components.contactImport.column_email"),
        enableSorting: false,
        renderCell: ({ row }) => (
          <input
            type="text"
            className="c__contact-import__input"
            aria-label={t("components.contactImport.email_aria", {
              row: row.position ?? 0,
            })}
            aria-invalid={row.status !== "valid"}
            value={row.email}
            onChange={(event) =>
              setContacts((all) =>
                all.map((c) =>
                  c.id === row.id ? { ...c, email: event.target.value } : c,
                ),
              )
            }
          />
        ),
      },
      {
        id: "name",
        headerName: t("components.contactImport.column_name"),
        enableSorting: false,
        renderCell: ({ row }) => row.name,
      },
      {
        id: "status",
        headerName: t("components.contactImport.column_status"),
        enableSorting: false,
        renderCell: ({ row }) => (
          <span
            className={clsx(
              "c__contact-import__status",
              `c__contact-import__status--${row.status}`,
            )}
          >
            {t(`components.contactImport.status_${row.status}`)}
          </span>
        ),
      },
      {
        id: "actions",
        headerName: t("components.contactImport.column_actions"),
        enableSorting: false,
        renderCell: ({ row }) => (
          <Button
            type="button"
            variant="tertiary"
            color="neutral"
            size="small"
            aria-label={t("components.contactImport.remove_aria", {
              email: row.email,
            })}
            icon={<XMark size={16} aria-hidden="true" />}
            onClick={() =>
              setContacts((all) => all.filter((c) => c.id !== row.id))
            }
          />
        ),
      },
    ],
    [t],
  );

  const uploaderFiles: UploadFile[] = file
    ? [{ ...file, status: error ? "error" : "done", error }]
    : [];

  return (
    <div className={clsx("c__contact-import", className)}>
      <FileUploader
        accept={ACCEPT.join(",")}
        files={uploaderFiles}
        onAddFiles={(files) => load(files[0])}
        onRemoveFile={reset}
        onCancelFile={reset}
      />
      {validated.length > 0 && (
        <>
          <DataGrid<ValidatedContact>
            aria-label={t("components.contactImport.table_label")}
            columns={columns}
            rows={validated}
            enableSorting={false}
          />
          <div role="status" className="c__contact-import__summary">
            {t("components.contactImport.summary", {
              valid: valid.length,
              fix: toFix,
            })}
          </div>
        </>
      )}
      <Button
        disabled={valid.length === 0}
        onClick={() =>
          onImport(
            valid.map(({ email, name }) => ({ email: email.trim(), name })),
          )
        }
      >
        {valid.length === 0
          ? t("components.contactImport.import_none")
          : t(
              valid.length === 1
                ? "components.contactImport.import_one"
                : "components.contactImport.import_many",
              { count: valid.length },
            )}
      </Button>
    </div>
  );
};
