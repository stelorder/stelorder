import {SelectOption} from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";
import {useContext, useId, useState} from "react";
import {
  Button,
  Icon,
  IntegrationsThemeType,
  Modal,
  PaginatedTable,
  SimpleGrid,
  Spinner,
  Status,
} from "@stelsolutions/stelorder-catalog";
import {useTheme} from "styled-components";
import {usePaginationModel} from "../hooks/usePaginationModel";
import {HistoryResult, useFetchHistory} from "../hooks/useFetchHistory";
import {RootContext} from "../context/RootContext/RootContext.context";
import {
  EventActionTranslates,
  EventDirection, EventDirectionTranslates,
  EventStatus,
  EventStatusTranslates,
  EventTypeTranslates,
  SubjobTypeTranslates,
} from "../utils/eventEnums";
import {useTranslation} from "react-i18next";
import {templateHelper} from "../utils/templateHelper.ts";

const estadoVariant = {
  COMPLETED: {
    variant: "success",
    label: EventStatusTranslates[EventStatus.COMPLETED],
  },
  INFO: {
    variant: "info",
    label: EventStatusTranslates[EventStatus.INFO],
  },
  UNCOMMITED: {
    variant: "warning",
    label: EventStatusTranslates[EventStatus.UNCOMMITED],
  },
  FAILED: { variant: "danger", label: EventStatusTranslates[EventStatus.FAILED] },
} as const;

const defaultOptions = [
  { label: "5", value: "5" },
  { label: "10", value: "10" },
  { label: "20", value: "20" },
] as SelectOption[];

export function HistoryPage() {
  const theme = useTheme() as IntegrationsThemeType;
  const { root } = useContext(RootContext) || { root: document.body };
  const [openTextErrorModal, setOpenTextErrorModal] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { t: jobsTranslation } = useTranslation("jobs"); 


  const { isLoading, data, paginationInfo, paginationConfig, fetchAsyncData } =
    usePaginationModel<HistoryResult, ReturnType<typeof useFetchHistory>>({
      useFetchElement: useFetchHistory,
      defaultOptions,
      getFetchPaginatedData: (fetchResources) =>
        fetchResources.fetchPaginatedHistoryData,
    });

  const id = useId();

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
                  const template = jobsTranslation("pagination.elements_template")
                  return templateHelper(template, params);
                },
                perPageText: jobsTranslation("pagination.perPage"),
              },
              paginationControlText: {
               firstPage: jobsTranslation("pagination.first"),
               lastPage: jobsTranslation("pagination.last"),
              }
            }}
          >
            <thead>
              <tr>
                <th>{jobsTranslation("columns.type")}</th>
                <th>{jobsTranslation("columns.action")}</th>
                <th>{jobsTranslation("columns.direction")}</th>
                <th>{jobsTranslation("columns.date")}</th>
                <th>{jobsTranslation("columns.status")}</th>
                <th>{jobsTranslation("columns.subjobs")}</th>
              </tr>
            </thead>
            <tbody>
              {
                !(data?.paginatedResult?.totalResults) && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "left" }}>
                        {jobsTranslation("empty_table")}
                    </td>
                  </tr>
                )
              }
              {data?.paginatedResult?.results.map((r, i) => (
                <tr key={`${id}-row-${i}`}>
                  <td
                    style={{
                      textAlign: "left",
                    }}
                  >
                    {(EventTypeTranslates[r.type as keyof typeof EventTypeTranslates] && EventTypeTranslates[r.type as keyof typeof EventTypeTranslates](jobsTranslation)) || r.type}
                  </td>
                  <td
                    style={{
                      textAlign: "left",
                    }}
                  >
                    {(EventActionTranslates[r.action as keyof typeof EventActionTranslates] && EventActionTranslates[r.action as keyof typeof EventActionTranslates](jobsTranslation)) || r.action}
                  </td>
                  <td
                      style={{
                        textAlign: "left",
                      }}
                  >
                    {(EventDirectionTranslates[(r.direction ?? EventDirection.TO_PRIMARY) as keyof typeof EventDirectionTranslates] && EventDirectionTranslates[(r.direction ?? EventDirection.TO_PRIMARY) as keyof typeof EventDirectionTranslates](jobsTranslation)) || r.direction || "-"}
                  </td>
                  <td>{!isNaN(new Date(r.creationDateTime).getTime()) ? new Date(r.creationDateTime).toLocaleString() : "-"}</td>

                  <td
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Status
                      statusText={
                        estadoVariant[r.status as keyof typeof estadoVariant]
                          ?.label && estadoVariant[r.status as keyof typeof estadoVariant].label(jobsTranslation)
                      }
                      status={
                        estadoVariant[r.status as keyof typeof estadoVariant]
                          ?.variant as "success" | "danger" | "warning"
                      }
                      order={{
                        icon: 1,
                        label: 0,
                        text: 2,
                      }}
                      gap={4}
                    />

                    {r.reason && (
                      <Icon
                        variant="alert"
                        height="14px"
                        width="14px"
                        color="inherit"
                        htmlProps={{
                          onClick: () => {
                            console.log("errorText", r.reason);
                            setErrorText(r.reason || null);
                            setOpenTextErrorModal(true);
                          },
                          type: "button",
                        }}
                      />
                    )}
                  </td>
                  <td
                    style={{
                      whiteSpace: "normal",
                      overflow: "visible",
                      textOverflow: "unset",
                      verticalAlign: "top",
                      lineHeight: theme.fonts.h1500.lineHeight,
                      overflowWrap: "break-word",
                      wordBreak: "normal",
                      textAlign: "left",
                    }}
                  >
                    {Object.entries(r.subjobs || {}).map(([key, value], index) => {
                      return (
                        <span key={`${id}-subjob-${index}`}>
                          {value} {(SubjobTypeTranslates[key as keyof typeof SubjobTypeTranslates] && SubjobTypeTranslates[key as keyof typeof SubjobTypeTranslates](jobsTranslation as (key: string) => [string, string])) || key}{
                            index < Object.entries(r.subjobs || {}).length - 1 ? ", " : ""
                        }
                        </span>
                      );
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </PaginatedTable>
        </section>
      )}
      <Modal
        isOpen={openTextErrorModal}
        showIn={root}
        isCentered={true}
        fade={true}
        animationDurationSec={0.3}
        htmlProps={{ as: "section" }}
      >
        <SimpleGrid
          itemsPerLine={2}
          htmlProps={{ as: "header", style: { paddingBottom: 10 } }}
        >
          <SimpleGrid.Item
            htmlProps={{
              as: "h1",
              style: {
                flex: "1 0 0",
                display: "flex",
                textWrap: "wrap",
                alignItems: "stretch",
                gap: 4,
                margin: 0,
              },
              className: "modal-title",
            }}
          >
            <Icon
              variant="alert"
              width="22px"
              height="22px"
              color={theme.colors.alertError.alertError100}
            />
            <span>{jobsTranslation("event_modal.error_modal.title")}</span>
          </SimpleGrid.Item>
          <SimpleGrid.Item
            htmlProps={{ as: "span", style: { flex: "0 0 auto" } }}
          >
            <Icon
              variant="close"
              htmlProps={{
                onClick: () => setOpenTextErrorModal(false),
                style: {
                  cursor: "pointer",
                  opacity: 0.5,
                },
              }}
              width="22px"
              height="22px"
              color="inherit"
            />
          </SimpleGrid.Item>
        </SimpleGrid>
        <section className="modal-text" style={{ paddingBottom: 22 }}>
          {errorText
            ? errorText
            : jobsTranslation("event_modal.text")}
        </section>

        <SimpleGrid itemsPerLine={2} gap={18}>
          <SimpleGrid.Item
            htmlProps={{
              style: {
                flex: "0 0 auto",
                alignContent: "center",
                ...theme.fonts.h1500,
                fontSize: 16,
              },
            }}
          >
            {jobsTranslation("event_modal.question")}
          </SimpleGrid.Item>
          <SimpleGrid.Item htmlProps={{ style: { flex: "1 0 0" } }}>
            <Button
              variant="gray"
              size="xl"
              htmlProps={{
                as: "a",
                href: "#",
                style: {
                  display: "flex",
                  gap: 6,
                  justifyContent: "center",
                  minHeight: 0,
                },
              }}
            >
              <Icon
                variant="contact"
                width="16px"
                height="16px"
                color="inherit"
              />
              <span>{jobsTranslation("event_modal.contact_support")}</span>
            </Button>
          </SimpleGrid.Item>
        </SimpleGrid>

        <SimpleGrid
          itemsPerLine={1}
          alignY="stretch"
          htmlProps={{ style: { paddingTop: 22 } }}
        >
          <SimpleGrid.Item>
            <Button
              variant="secondary"
              size="xl"
              htmlProps={{
                style: { width: "100%" },
                onClick: () => setOpenTextErrorModal(false),
              }}
            >
              {jobsTranslation("event_modal.btn_accept")}
            </Button>
          </SimpleGrid.Item>
        </SimpleGrid>
      </Modal>
    </>
  );
}
