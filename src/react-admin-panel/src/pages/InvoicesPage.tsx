import {
  Badge, Column,
  Icon,
  IntegrationsThemeType, Pagination, SearchableColumn, SearchableTable, Spinner,
  Tooltip,
} from "@stelsolutions/stelorder-catalog";
import { useTheme, styled } from "styled-components";
import {useContext, useEffect, useId, useRef, useState} from "react";
import { SelectOption } from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";
import { InvoiceData, PaginatedInvoicesResult, useFetchInvoices } from "../hooks/useFetchInvoices";
import { parseDocumentDate } from "./utils/page-utils";
import { useWpApiSettings } from "../hooks/useWpApiSettings";
import { usePaginationModel } from "../hooks/usePaginationModel";
import { RootContext } from "../context/RootContext/RootContext.context";
import { verifactuConfig } from "../utils/types";
import { useTranslation } from "react-i18next";
import {useTranslateDocumentState} from "../hooks/useTranslateDocumentState.ts";
import {templateHelper} from "../utils/templateHelper.ts";

const defaultOptions = [
  { label: "5", value: "5" },
  { label: "10", value: "10" },
  { label: "20", value: "20" },
] as SelectOption[];

const TdPedido = styled.td`
  && {
    color: ${({ theme }) =>
      (theme as IntegrationsThemeType).colors.orderSecondary.orderSecondary70};
    cursor: pointer;
    font-weight: 400;
    text-align: left;
  }
  &&:hover {
    color: ${({ theme }) =>
      (theme as IntegrationsThemeType).colors.orderSecondary.orderSecondary90};
    font-weight: 500;
  }
`;



type SortDirection = 'asc' | 'desc';
type SortField = "reference" | "creation-date" | "document-state-id";

export default function InvoicesPage() {
  const [sortDirection, setSortDirection] = useState<SortDirection|undefined>();
  const [sortColumn, setSortColumn] = useState<SortField|undefined>();
  const [debounceSearchReference, setDebounceSearchReference] = useState<string|undefined>();
  const [searchReference, setSearchReference] = useState<string|undefined>();
  const { wpAdminUrl, stelServiceUrl, stelUrl } = useWpApiSettings();
  const { root } = useContext(RootContext) || { root: document.body };
  const theme = useTheme() as IntegrationsThemeType;

  const { t: invoicesTranslation } = useTranslation("invoice");
  
  const {
    isLoading,
    data,
    paginationInfo,
    paginationConfig,
    fetchAsyncData,
  } = usePaginationModel<PaginatedInvoicesResult, ReturnType<typeof useFetchInvoices>>({
    useFetchElement: useFetchInvoices,
    defaultOptions,
    getFetchPaginatedData: (fetchResources) => fetchResources.fetchPaginatedInvoicesData,
    sortColumn: sortColumn,
    sortDirection: sortDirection,
    searchReference,
  });

  const moveToRef = useRef<((page: number) => void) | null>(null);

  useEffect(() => {
    const debounce = setTimeout(() => {
      setSearchReference(debounceSearchReference);
    }, 1500)

    return () => clearTimeout(debounce);
  }, [debounceSearchReference]);

  useEffect(() => {

    if (!sortDirection && !sortColumn && !searchReference) return;
    if (moveToRef.current) {
      moveToRef.current(1);
    }
  }, [sortColumn, sortDirection, searchReference]);

  const toggleSort = (field: SortField) => {
    if (sortColumn !== field) {
      setSortColumn(field);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortColumn(undefined);
      setSortDirection(undefined);
    }
  }

  const { textStatus } = useTranslateDocumentState();

  const id = useId();

  return (
    <>
      {isLoading && (
        <section style={{ height: "100vh", textAlign: "center", alignContent: "center"}}>
            <Spinner size={40} />
        </section>
      )}
      {!isLoading && paginationConfig && (
        <section
          style={{
            paddingTop: "12px",
            paddingLeft: "20px",
            paddingRight: "20px",
            paddingBottom: "20px",
          }}
        >
          <SearchableTable>
            <thead>
              <tr>
                <SearchableColumn
                    sortable
                    sortDirection={sortColumn === "reference" ? sortDirection : null}
                    onSort={() => toggleSort("reference")}
                    onChange={setDebounceSearchReference}
                    value={debounceSearchReference}
                    htmlProps={{ style: { width: "calc(100% / 8)" }}}>
                  {invoicesTranslation("columns.invoice_STEL")}
                </SearchableColumn>
                <Column
                    htmlProps={{ style: { width: "calc(100% / 8)" }}}>
                  {invoicesTranslation("columns.invoice_woocommerce")}
                </Column>
                <Column
                    htmlProps={{ style: { width: "calc(100% / 8)" }}}>
                  {invoicesTranslation("columns.customer")}
                </Column>
                <Column
                    sortable
                    onSort={() => toggleSort("document-state-id")}
                    sortDirection={sortColumn === "document-state-id" ? sortDirection : null}
                    htmlProps={{ style: { width: "calc(100% / 8)" }}}>
                  {invoicesTranslation("columns.status")}
                </Column>
                <Column
                    sortable
                    onSort={() => toggleSort("creation-date")}
                    sortDirection={sortColumn === "creation-date" ? sortDirection : null}
                    htmlProps={{ style: { width: "calc(100% / 8)" }}}>
                  {invoicesTranslation("columns.date")}
                </Column>
                <Column
                    htmlProps={{ style: { width: "calc(100% / 8)" }}}>
                  {invoicesTranslation("columns.amount")}
                </Column>
                <Column
                    htmlProps={{ style: { width: "calc(100% / 8)" }}}>
                  {invoicesTranslation("columns.state_verifactu")}
                </Column>
                <Column
                    htmlProps={{ style: { width: "calc(100% / 8)" }}}>
                  {invoicesTranslation("columns.view_details")}
                </Column>
              </tr>
            </thead>
            <tbody>
                {!(data?.paginatedResult?.totalResults) && (
                    <tr>
                        <td colSpan={8} style={{ textAlign: "start", padding: "16px" }}>
                            {invoicesTranslation("empty_table")}
                        </td>
                    </tr>
                )}
              {data?.paginatedResult?.results?.map((r: InvoiceData, i: number) => (
                <tr key={`${id}-row-${i}`}>
                  <td
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      overflow: "visible",
                    }}
                  >
                    <a
                      href={`${stelUrl}/#deepLink=document?id=${r.id}`}
                      target="_blank"
                      style={{ textDecoration: "none", color: theme.colors.orderSecondary.orderSecondary100 }}
                    >
                      {r.fullReference ?? "-"}
                    </a>
                    {r.verifactuResults && (
                      <Tooltip
                        alignMessage="right"
                        message={<div>{r.verifactuResults.replace(/&#/g, "-")}</div>}
                        showIn={root as HTMLDivElement}
                      >
                        <Icon
                          variant="alert"
                          height="14px"
                          width="14px"
                          color="inherit"
                        />
                      </Tooltip>
                    )}
                  </td>
                  <TdPedido>
                    <a
                      href={`${wpAdminUrl}post.php?post=${r.externalId}&action=edit`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        textDecoration: "none",
                        color: theme.colors.orderSecondary.orderSecondary70,
                      }}
                    >
                      #{r.externalId}
                    </a>
                  </TdPedido>
                  <td style={{ textAlign: "left", fontWeight: "bold", maxWidth: 0}}>
                    {r.customer}
                  </td>
                  <td>
                    {(() => {
                      const state = data.documentStates.find(
                        (ds) => `${ds.id}` === r.documentStateId
                      );
                      if (!state) return null;
                      return (
                        <Badge
                          htmlProps={{
                            style: {
                              backgroundColor: state.color,
                            },
                          }}
                        >
                          {
                            textStatus(state.type ?? '', state.order, state.name)
                          }
                        </Badge>
                      );
                    })()}
                  </td>
                  <td>{parseDocumentDate(r.date).date}</td>
                  <td
                    style={{
                      textAlign: "right",
                    }}
                  >
                    {r.totalAmount} €
                  </td>
                  <td
                    style={{
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "120px",
                    }}
                  >
                    {(() => {
                      const status = r.verifactuState ?? "DEFAULT";

                      const { variant, label } =
                        verifactuConfig[status as keyof typeof verifactuConfig];

                      return (
                        <div
                          style={{
                            alignItems: "flex-start",
                            gap: 8,
                            alignSelf: "stretch",
                            display: "flex",
                            width: "inherit",
                          }}
                        >
                          <Icon
                            variant={variant}
                            height="17.832px"
                            width="18.699px"
                            color="inherit"
                            htmlProps={{
                              style: {
                                minWidth: "18.699px",
                              },
                            }}
                          />
                          <span
                            style={{
                              color: theme.colors.bn.bn100,

                              ...theme.fonts.h1500,
                            }}
                          >
                            {label(invoicesTranslation)}
                          </span>
                        </div>
                      );
                    })()}
                  </td>
                  <td>
                    {r.resourceId && (
                      <a
                        href={`${stelServiceUrl}resources/${r.resourceId}`}
                        target="_blank"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          textDecoration: "none",
                          color: theme.colors.orderSecondary.orderSecondary70,
                          gap: 8,
                        }}
                      >
                        <Icon
                          variant="file"
                          height="18px"
                          width="18px"
                          color="inherit"
                        />
                        <span>{invoicesTranslation("view")}</span>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </SearchableTable>
          <Pagination fetchData={fetchAsyncData}
                      movedToRef={moveToRef}
                      elementsPerPage={defaultOptions}
                      paginationConfig={paginationConfig}
                      totalPages={paginationInfo?.totalPages || 1}
                      paginationText={{
                        paginationConfigText: {
                          listingTextTemplate: (firstElementPageNumber: number, lastElementPageNumber: number, lastElementNumber: number) => {
                            const params = { from: firstElementPageNumber, to: lastElementPageNumber, count: lastElementNumber };
                            const template = invoicesTranslation("pagination.elements_template")
                            return templateHelper(template, params);
                          },
                          perPageText: invoicesTranslation("pagination.perPage"),
                        },
                        paginationControlText: {
                          firstPage: invoicesTranslation("pagination.first"),
                          lastPage: invoicesTranslation("pagination.last"),
                        }
                      }}
          />
        </section>
      )}
    </>
  );
}
