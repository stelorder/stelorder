import {
  Badge,
  Icon,
  IntegrationsThemeType,
  PaginatedTable, Spinner,
} from "@stelsolutions/stelorder-catalog";
import { SelectOption } from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";
import { styled, useTheme } from "styled-components";
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
  const { wpAdminUrl, stelServiceUrl, stelUrl } = useWpApiSettings();
  const theme = useTheme() as IntegrationsThemeType;
  const { t: ordersTranslation } = useTranslation("order");

  const { isLoading, data, paginationInfo, paginationConfig, fetchAsyncData } =
    usePaginationModel<
      PaginatedOrdersResult,
      ReturnType<typeof useFetchOrders>
    >({
      useFetchElement: useFetchOrders,
      defaultOptions,
      getFetchPaginatedData: (fetchResources) =>
        fetchResources.fetchPaginatedOrdersData,
    });

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
          <PaginatedTable
            fetchData={fetchAsyncData}
            elementsPerPage={defaultOptions}
            paginationConfig={paginationConfig}
            totalPages={paginationInfo?.totalPages || 1}
            paginationText={{
              paginationConfigText: {
                listingTextTemplate: (firstElementPageNumber: number, lastElementPageNumber: number, lastElementNumber: number) => {
                  const params = { from: firstElementPageNumber, to: lastElementPageNumber, count: lastElementNumber };
                  const template = ordersTranslation("pagination.elements_template")
                  return templateHelper(template, params);
                },
                perPageText: ordersTranslation("pagination.perPage"),
              },
              paginationControlText: {
                firstPage: ordersTranslation("pagination.first"),
                lastPage: ordersTranslation("pagination.last"),
              }
            }}
          >
            <thead>
              <tr>
                <th>{ordersTranslation("columns.order_STEL")}</th>
                <th>{ordersTranslation("columns.order_woocommerce")}</th>
                <th>{ordersTranslation("columns.customer")}</th>
                <th>{ordersTranslation("columns.status")}</th>
                <th>{ordersTranslation("columns.date")}</th>
                <th>{ordersTranslation("columns.amount")}</th>
                <th>{ordersTranslation("columns.view_details")}</th>
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
          </PaginatedTable>
        </section>
      )}
    </>
  );
}
