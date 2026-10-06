import {
  Badge,
  Column,
  Icon,
  IntegrationsThemeType,
  Pagination,
  SearchableColumn,
  SearchableTable,
  Spinner,
} from "@stelsolutions/stelorder-catalog";
import { SelectOption } from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";
import { styled, useTheme } from "styled-components";
import {useEffect, useRef, useState} from "react";
import { usePaginationModel } from "../hooks/usePaginationModel";
import { PaginatedOrdersResult, useFetchOrders } from "../hooks/useFetchOrders";
import { parseDocumentDate } from "./utils/page-utils";
import { useWpApiSettings } from "../hooks/useWpApiSettings";
import { useTranslation } from "react-i18next";
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

export function OrdersPage() {
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | undefined>();
  const [sortColumn, setSortColumn] = useState<"reference" | "creation-date" | "document-state-id" | undefined>();
  const [debounceSearchReference, setDebounceSearchReference] = useState<string|undefined>();
  const [searchReference, setSearchReference] = useState<string|undefined>();
  const { wpAdminUrl, stelServiceUrl, stelUrl } = useWpApiSettings();
  const theme = useTheme() as IntegrationsThemeType;
  const { t: ordersTranslation } = useTranslation("order");

  const moveToRef = useRef<((page: number) => void) | null>(null);
  const { isLoading, data, paginationInfo, paginationConfig, fetchAsyncData } =
    usePaginationModel<
      PaginatedOrdersResult,
      ReturnType<typeof useFetchOrders>
    >({
      useFetchElement: useFetchOrders,
      defaultOptions,
      getFetchPaginatedData: (fetchResources) =>
        fetchResources.fetchPaginatedOrdersData,
      sortColumn,
      sortDirection,
      searchReference,
    });

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

  const toggleSort = (field: "reference" | "creation-date" | "document-state-id") => {
    if (sortColumn !== field) {
      setSortColumn(field);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortColumn(undefined);
      setSortDirection(undefined);
    }
  };

  return (
    <>
      {isLoading && (
        <section
          style={{
            height: "100vh",
            textAlign: "center",
            alignContent: "center",
          }}
        >
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
                  htmlProps={{ style: { width: "calc(100% / 7)" } }}
                >
                  {ordersTranslation("columns.order_STEL")}
                </SearchableColumn>
                <Column htmlProps={{ style: { width: "calc(100% / 7)" } }}>
                  {ordersTranslation("columns.order_woocommerce")}
                </Column>
                <Column htmlProps={{ style: { width: "calc(100% / 7)" } }}>
                  {ordersTranslation("columns.customer")}
                </Column>
                <Column
                  sortable
                  onSort={() => toggleSort("document-state-id")}
                  sortDirection={sortColumn === "document-state-id" ? sortDirection : null}
                  htmlProps={{ style: { width: "calc(100% / 7)" } }}
                >
                  {ordersTranslation("columns.status")}
                </Column>
                <Column
                  sortable
                  onSort={() => toggleSort("creation-date")}
                  sortDirection={sortColumn === "creation-date" ? sortDirection : null}
                  htmlProps={{ style: { width: "calc(100% / 7)" } }}
                >
                  {ordersTranslation("columns.date")}
                </Column>
                <Column htmlProps={{ style: { width: "calc(100% / 7)" } }}>
                  {ordersTranslation("columns.amount")}
                </Column>
                <Column htmlProps={{ style: { width: "calc(100% / 7)" } }}>
                  {ordersTranslation("columns.view_details")}
                </Column>
              </tr>
            </thead>
            <tbody>
              {!(data?.paginatedResult?.totalResults) && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "start", padding: "16px" }}>
                    {ordersTranslation("empty_table")}
                  </td>
                </tr>
              )}
              {data?.paginatedResult?.results.map((r, i) => (
                <tr key={r.externalId ?? i}>
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
                      style={{
                        textDecoration: "none",
                        color: theme.colors.orderSecondary.orderSecondary100,
                      }}
                      target="_blank"
                    >
                      {r.fullReference ?? "-"}
                    </a>
                  </td>
                  <TdPedido>
                    <a
                      href={`${wpAdminUrl}post.php?post=${r.externalId}&action=edit`}
                      target="_blank"
                      style={{ textDecoration: "none", color: theme.colors.orderSecondary.orderSecondary70 }}
                    >
                      #{r.externalId}
                    </a>
                  </TdPedido>
                  <td style={{ textAlign: "left", fontWeight: "bold", maxWidth: 0 }}>{r.customer}</td>
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
                          {state.name === "Unpaid" ? "Pendiente" : state.name}
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
                  <td style={{ textAlign: "center" }}>
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
                        <span>{ordersTranslation("view")}</span>
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </SearchableTable>
          <Pagination
            movedToRef={moveToRef}
            fetchData={fetchAsyncData}
            elementsPerPage={defaultOptions}
            paginationConfig={paginationConfig}
            totalPages={paginationInfo?.totalPages || 1}
            paginationText={{
              paginationConfigText: {
                listingTextTemplate: (
                  firstElementPageNumber: number,
                  lastElementPageNumber: number,
                  lastElementNumber: number
                ) => {
                  const params = {
                    from: firstElementPageNumber,
                    to: lastElementPageNumber,
                    count: lastElementNumber,
                  };
                  const template = ordersTranslation("pagination.elements_template");
                  return templateHelper(template, params);
                },
                perPageText: ordersTranslation("pagination.perPage"),
              },
              paginationControlText: {
                firstPage: ordersTranslation("pagination.first"),
                lastPage: ordersTranslation("pagination.last"),
              },
            }}
          />
        </section>
      )}
    </>
  );
}
