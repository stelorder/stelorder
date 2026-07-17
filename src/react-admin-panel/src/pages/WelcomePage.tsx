import { useEffect, useMemo, useState } from "react";
import {
  Card,
  IntegrationsThemeType,
  SimpleGrid,
  STELPlan,
  Status,
  Title,
  Icon,
  SimpleGraphicBar,
  ScrollList,
  DocumentCardInfo,
  Badge,
  Button, Spinner,
} from "@stelsolutions/stelorder-catalog";
import { useTheme } from "styled-components";
import {
  IntegrationData,
  useFetchIntegrationData,
} from "../hooks/useFetchIntegrationData";
import { STELPlanVariant } from "@stelsolutions/stelorder-catalog/dist/components/STEL-plan/STELPlan";
import { IntegrationModal } from "../components/IntegrationModal/IntegrationModal";
import {
  useFetchIntegrationDocuments,
  IntegrationDocuments,
} from "../hooks/useFetchIntegrationDocuments";
import { ErrorModal } from "../components/ErrorModal/ErrorModal";
import { capitalizeFirstLetter, parseDocumentDate } from "./utils/page-utils";
import { useWpApiSettings } from "../hooks/useWpApiSettings";
import { useNavigate } from "react-router-dom";
import { AccountStatus, accountStatusUI, verifactuConfig } from "../utils/types";
import { useTranslation } from "react-i18next";
import { useTranslateDocumentState } from "../hooks/useTranslateDocumentState.ts";

function calcTotalAmount(
  elements: {
    [key: string]: { amount: number; total: number };
  }[]
): { amount: number; total: number } {
  const result = elements
    ?.map((el) => Object.values(el)[0])
    .reduce(
      (acc, curr) => {
        return {
          amount: acc.amount + curr.amount,
          total: acc.total + curr.total,
        };
      },
      { amount: 0, total: 0 }
    ) || { amount: 0, total: 0 };
  result.total = parseFloat(result.total.toFixed(2));
  return result;
}

const month = [
  "",
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
] as const;

function parseDate(dateStr: `${number}-${number}`, months: string []): (string)[number] {
  const [, monthNum] = dateStr.split("-").map(Number);
  return months[monthNum] || "";
}

function parseStatisticData(
  elements?: {
    [key: string]: { amount: number };
  }[],
  months?: string[]
): { label: (typeof month | string[])[number]; value: number }[] {
  const data = (
    months || month
  ).slice(1).map((m) => ({ label: m, value: 0 }));
  elements?.forEach((el) => {
    const [dateStr, valueObj] = Object.entries(el)[0];
    const monthLabel = parseDate(dateStr as `${number}-${number}`, (months || month) as string[]);
    const dataItem = data.find((d) => d.label === monthLabel);
    if (dataItem) {
      dataItem.value += valueObj.amount;
    }
  });
  return data;
}

type KpiSectionConfig = {
  syncActive: boolean;
  value: number;
  amountText: string; // ej: "+12.000 €" o "-6.000 €"
  amountColor?: string; // override de color del amount
  color?: string; // color de barras del gráfico
  data?: Array<{ label: string; value: number }>;
};

const commonBodyStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  alignContent: "center",
  flexWrap: "wrap",
};

export function WelcomePage() {
  const theme = useTheme() as IntegrationsThemeType;
  const { stelUrl } = useWpApiSettings();
  const navigate = useNavigate();
  const [integrationSummaryData, setIntegrationSummaryData] = useState<
    IntegrationData | null | undefined
  >(undefined);
  const [integrationDocumentsData, setIntegrationDocumentsData] = useState<
    IntegrationDocuments | null | undefined
  >(undefined);
  const [openIntegrationModal, setOpenIntegrationModal] = useState(false);
  const [openErrorModal, setOpenErrorModal] = useState(false);

  const [loadingSummary, setLoadingSummary] = useState<boolean>(false);
  const [loadingDocuments, setLoadingDocuments] = useState<boolean>(false);
  const { t: welcomeTranslation } = useTranslation("welcome");
  const { t: errorTranslation } = useTranslation("error");

  const { textStatus } = useTranslateDocumentState();

  const { fetchIntegrationData } = useFetchIntegrationData({
    handleData: (data) => setIntegrationSummaryData(data),
    onError: () => navigate("/error"),
  });

  const { fetchIntegrationDocuments } = useFetchIntegrationDocuments({
    handleData: (data) => setIntegrationDocumentsData(data),
    onError: () => navigate("/error"),
  });

  useEffect(() => {
    setLoadingSummary(true);
    setLoadingDocuments(true);
    fetchIntegrationData();
    fetchIntegrationDocuments();
    console.log("Fetching integration data...");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (integrationSummaryData) {
      console.log("Integration Data fetched:", integrationSummaryData);
    }
    if (loadingSummary && integrationSummaryData !== undefined) {
      setLoadingSummary(false);
    }
  }, [integrationSummaryData, loadingSummary]);

  const groupInterationDocumentsByDateMemo = useMemo(() => {
    if (!integrationDocumentsData) return undefined;
    const groupMap = integrationDocumentsData.documents.reduce((acc, doc) => {
      const { date } = parseDocumentDate(doc["creation-date"]);
      const key = date;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(doc);
      return acc;
    }, {} as Record<string, typeof integrationDocumentsData.documents>);
    return Object.entries(groupMap)
      .flatMap(([date, documents]) => {
        return documents.map((d, idx) => ({
          d: { ...d },
          date: idx === 0 ? date : "",
          sortDate: date,
        }));
      })
      .sort((a, b) => {
        const [dayA, monthA, yearA] = a.sortDate.split("/").map(Number);
        const [dayB, monthB, yearB] = b.sortDate.split("/").map(Number);

        const dateA = new Date(yearA, monthA - 1, dayA);
        const dateB = new Date(yearB, monthB - 1, dayB);

        return dateB.getTime() - dateA.getTime();
      });
  }, [integrationDocumentsData]);

  useEffect(() => {
    if (integrationDocumentsData) {
      console.log("Integration Documents fetched:", integrationDocumentsData);
    }
    if (loadingDocuments && integrationDocumentsData !== undefined) {
      setLoadingDocuments(false);
    }
  }, [integrationDocumentsData, loadingDocuments]);

  return loadingSummary ? (
    <div
      style={{ height: "100vh", textAlign: "center", alignContent: "center" }}
    >
      <Spinner size={40} />
    </div>
  ) : (
    <section style={{ padding: "16px 20px" }}>
      <Card htmlProps={{ style: { boxSizing: "border-box", padding: 28 } }}>
        <SimpleGrid gap={18} direction="column" wrap={false}>
          {loadingSummary ? (
            <></>
          ) : (
            <>
              <SimpleGrid.Item htmlProps={{ style: { height: 'fit-content', flex: "0 1 auto" } }}
              >
                <SimpleGrid gap={14} itemsPerLine={2}>
                  <SimpleGrid.Item col={1}>
                    <Card
                      htmlProps={{
                        style: {
                          padding: "18px 20px",
                          height: "100%",
                          boxSizing: "border-box",
                        },
                      }}
                    >
                      <Card.Body
                        htmlProps={{
                          style: {
                            display: "flex",

                            justifyContent: "space-between",
                            alignItems: "center",
                            alignContent: "center",

                            flexWrap: "wrap",
                          },
                        }}
                      >
                        <SimpleGrid
                          gap={8}
                          itemsPerLine={2}
                          htmlProps={{
                            style: {
                              width: "auto",
                            },
                          }}
                        >
                          <SimpleGrid.Item
                            col={1}
                            htmlProps={{
                              style: {
                                flex: "0 0 auto",
                              },
                            }}
                          >
                            {!loadingSummary && integrationSummaryData && (
                              <STELPlan
                                htmlProps={{ style: { boxSizing: "revert" } }}
                                variant={
                                  integrationSummaryData.plan.toLowerCase() as STELPlanVariant
                                }
                              />
                            )}
                          </SimpleGrid.Item>
                          <SimpleGrid.Item
                            col={1}
                            htmlProps={{
                              style: {
                                flex: "0 0 auto",
                              },
                            }}
                          >
                            <SimpleGrid
                              gap={0}
                              itemsPerLine={1}
                              htmlProps={{
                                style: {
                                  textAlign: "left",
                                },
                              }}
                            >
                              <SimpleGrid.Item
                                col={1}
                                htmlProps={{
                                  style: {
                                    color:
                                      theme.colors.orderSecondary
                                        .orderSecondary100,
                                    fontFamily: theme.fonts.h1500.fontFamily,
                                    fontSize: theme.fonts.h1500.fontSize,
                                    fontWeight: theme.fonts.h1500.fontWeight,
                                    lineHeight: theme.fonts.h1500.lineHeight,
                                  },
                                }}
                              >
                                {!loadingSummary &&
                                  integrationSummaryData &&
                                  capitalizeFirstLetter(
                                    integrationSummaryData.plan.toLowerCase()
                                  )}
                              </SimpleGrid.Item>
                              <SimpleGrid.Item
                                col={1}
                                htmlProps={{
                                  style: {
                                    color:
                                      theme.colors.orderSecondary
                                        .orderSecondary70,
                                    fontFamily: theme.fonts.h1400.fontFamily,
                                    fontSize: theme.fonts.h1400.fontSize,
                                    fontWeight: theme.fonts.h1400.fontWeight,
                                    lineHeight: theme.fonts.h1400.lineHeight,
                                  },
                                }}
                              >
                                {!loadingSummary &&
                                  integrationSummaryData &&
                                  (integrationSummaryData["subscription-status"] === "SUSCRITO" ? welcomeTranslation("subscription.status.subscribed") : (
                                    <span
                                      style={{
                                        display: "flex",
                                        gap: 4,
                                        alignItems: "center",
                                        color:
                                          theme.colors.alertError.alertError100,
                                      }}
                                    >
                                      <Icon
                                        variant="alert"
                                        width="14px"
                                        height="14px"
                                        color={"inherit"}
                                      />
                                      <span>{welcomeTranslation("subscription.status.inactive")}</span>
                                    </span>
                                  ))}
                              </SimpleGrid.Item>
                            </SimpleGrid>
                          </SimpleGrid.Item>
                        </SimpleGrid>

                        {integrationSummaryData?.["integration-status"] === "ACTIVE" &&
                        integrationSummaryData?.["subscription-status"] ===
                          "SUSCRITO" ? (
                          <Button
                            variant="secondary"
                            size="xl"
                            htmlProps={{
                              as: "a",
                              style: { boxSizing: "border-box" },
                              href: `${stelUrl}/app`,
                            }}
                          >
                            {welcomeTranslation("subscription.open_app_btn")}
                          </Button>
                        ) : (
                          <Button variant="gray" size="xl"
                            htmlProps={{
                              as: "a",
                              target: "_blank",
                              href: `${stelUrl}/#deepLink=subscription`,
                            }}
                          >
                            {welcomeTranslation("subscription.show_plans")}
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  </SimpleGrid.Item>

                  <SimpleGrid.Item col={1}>
                    <Card
                      htmlProps={{
                        style: {
                          padding: "18px 20px",
                          height: "100%",
                          boxSizing: "border-box",
                        },
                      }}
                    >
                      {!loadingSummary &&
                        integrationSummaryData &&
                        (() => {
                          const status = capitalizeFirstLetter(integrationSummaryData["integration-status"].toLowerCase()) as AccountStatus;
                          const cfg = accountStatusUI[status];
                          console.log("config status", status)
                          if (!cfg)
                            return <span>{status}</span>;
                          return (
                            <Card.Body
                              htmlProps={{
                                style: commonBodyStyle,
                              }}
                            >
                              <Status
                                gap={6}
                                label=""
                                order={{ icon: 1, label: 0, text: 2 }}
                                status={cfg.statusVariant}
                                statusText={cfg.statusText(welcomeTranslation)}
                              />
                              <Button
                                variant={cfg.buttonVariant}
                                size="xl"
                                htmlProps={{
                                  onClick: () => {
                                    if (status !== "Active" && status !== "Paused") return;
                                    setOpenIntegrationModal(true)
                                  },
                                  ...(() => {
                                    if (status !== "Blocked") return {};
                                    return {
                                      as: "a",
                                      href: `${stelUrl}/#deepLink=subscription`,
                                      target: "_blank",
                                    };
                                  })(),
                                }}
                              >
                                {cfg.buttonLabel(welcomeTranslation)}
                              </Button>
                            </Card.Body>
                          );
                        })()}
                    </Card>
                  </SimpleGrid.Item>
                </SimpleGrid>
              </SimpleGrid.Item>
              <SimpleGrid.Item htmlProps={{ style: { flex: "1 0 auto" }} }
              >
                <SimpleGrid
                  gap={14}
                  itemsPerLine={2}
                >
                  <SimpleGrid.Item
                    col={1}
                    htmlProps={{
                      style: {
                        flex: "1",
                      },
                      id: "graph-section",
                    }}
                  >
                    <SimpleGrid>
                      <SimpleGrid.Item col={1}>
                        <SimpleGrid direction="column" wrap={false} gap={18}>
                          <SimpleGrid.Item htmlProps={{ style: { flex: "0 0 auto" } }}>
                            {!loadingSummary &&
                                integrationSummaryData &&
                                (() => {
                                  const totalOrders = calcTotalAmount(
                                      integrationSummaryData.totals.SALESORDER
                                  );
                                  const cfg = {
                                    syncActive: integrationSummaryData["sync-orders"],
                                    value: totalOrders.amount,
                                    amountText: `+${totalOrders.total} €`,
                                  } as KpiSectionConfig;
                                  const isActive =
                                      integrationSummaryData["sync-orders"];
                                  const syncIcon = isActive
                                      ? "dobleCheck"
                                      : "markPadding";
                                  const syncColor = isActive
                                      ? "#088738"
                                      : theme.colors.alertError.alertError100;
                                  const syncText = isActive
                                      ? welcomeTranslation("stats_cards.sync_enabled")
                                      : welcomeTranslation("stats_cards.sync_enabled");
                                  const barColor =
                                      cfg.color ??
                                      theme.colors.orderSecondary.orderSecondary80;
                                  const amountColor =
                                      cfg.amountColor ??
                                      (cfg.amountText?.trim()?.startsWith("-")
                                              ? theme.colors.alertError.alertError100
                                              : /^[+-]?0 €$/.test(cfg.amountText?.trim() || "") ? theme.colors.orderSecondary.orderSecondary80 : "#088738"
                                      );

                                  return (
                                      <Card
                                          htmlProps={{
                                            style: {
                                              padding: "24px 24px",
                                              boxSizing: "border-box",
                                              height: "176px",
                                              textAlign: "start"
                                            },
                                          }}
                                      >
                                        <SimpleGrid gap={0} itemsPerLine={2} htmlProps={{ style: { height: "100%" } }}>
                                          <SimpleGrid.Item col={1}>
                                            <div
                                                style={{
                                                  display: "flex",
                                                  flexDirection: "column",
                                                  alignItems: "flex-start",
                                                  flex: "1 0 0",
                                                  alignSelf: "stretch",
                                                  justifyContent: "space-between",
                                                  height: "100%",
                                                }}
                                            >
                                              <div>
                                                <Title
                                                    htmlProps={{
                                                      style: {
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary100,
                                                        lineHeight: "150%",
                                                      },
                                                    }}
                                                >
                                                  {welcomeTranslation("stats_cards.orders_title")}
                                                </Title>
                                                <div>
                                                  <Icon
                                                      variant={syncIcon}
                                                      width="18px"
                                                      height="18px"
                                                      color={syncColor}
                                                  />
                                                  <span
                                                      style={{
                                                        marginLeft: 1,
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary70,
                                                        fontFamily:
                                                        theme.fonts.h1400.fontFamily,
                                                        fontSize:
                                                        theme.fonts.h1400.fontSize,
                                                        fontWeight:
                                                        theme.fonts.h1400.fontWeight,
                                                        lineHeight:
                                                        theme.fonts.h1400.lineHeight,
                                                      }}
                                                  >
                                            {syncText}
                                          </span>
                                                </div>
                                              </div>
                                              <div>
                                                <Title
                                                    htmlProps={{
                                                      style: {
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary100,
                                                        fontWeight: 600,
                                                        fontSize: "28px",
                                                        lineHeight: "107.143%",
                                                      },
                                                    }}
                                                >
                                                  {cfg.value}
                                                </Title>
                                                <div>
                                          <span
                                              style={{
                                                color: amountColor,
                                                marginTop: 2,
                                                fontFamily:
                                                theme.fonts.h1500.fontFamily,
                                                fontSize: "16px",
                                                fontWeight:
                                                theme.fonts.h1500.fontWeight,
                                                lineHeight: "150%",
                                              }}
                                          >
                                            {cfg.amountText}
                                          </span>
                                                </div>
                                              </div>
                                            </div>
                                          </SimpleGrid.Item>
                                          <SimpleGrid.Item
                                              col={1}
                                              htmlProps={{
                                                id: "orders-chart",
                                                style: { containerType: "inline-size" },
                                              }}
                                          >
                                            {Object.keys(
                                                integrationSummaryData?.totals
                                                    ?.SALESORDER || {}
                                            ).length > 0 ? (
                                                <SimpleGraphicBar<"label", "value">
                                                    htmlProps={{ id: "orders-chart" }}
                                                    color={barColor}
                                                    height={"125px"}
                                                    width={"100%"}
                                                    data={parseStatisticData(
                                                        integrationSummaryData.totals
                                                            .SALESORDER as unknown as {
                                                          [key: string]: { amount: number };
                                                        }[],
                                                        welcomeTranslation("stats_cards.month",{returnObjects: true}) as string[]
                                                    )}
                                                    xKey="label"
                                                    yKey="value"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                      height: "100%",
                                                      textAlign: "center",
                                                      alignContent: "center",
                                                    }}
                                                >
                                                  {welcomeTranslation("stats_cards.no_created_documents")}
                                                </div>
                                            )}
                                          </SimpleGrid.Item>
                                        </SimpleGrid>
                                      </Card>
                                  );
                                })()}
                          </SimpleGrid.Item>

                          <SimpleGrid.Item htmlProps={{ style: { flex: "0 0 auto" } }}>
                            {!loadingSummary &&
                                integrationSummaryData &&
                                (() => {
                                  const totalInvoices = calcTotalAmount(
                                      integrationSummaryData.totals
                                          .ORDINARYINVOICE as unknown as {
                                        [key: string]: {
                                          amount: number;
                                          total: number;
                                        };
                                      }[]
                                  );
                                  const cfg = {
                                    syncActive:
                                        integrationSummaryData["sync-invoices"],
                                    value: totalInvoices.amount,
                                    amountText: `+${totalInvoices.total} €`,
                                  } as KpiSectionConfig;
                                  const isActive = cfg.syncActive;
                                  const syncIcon = isActive
                                      ? "dobleCheck"
                                      : "markPadding";
                                  const syncColor = isActive
                                      ? "#088738"
                                      : theme.colors.alertError.alertError100;
                                  const syncText = isActive
                                      ? welcomeTranslation("stats_cards.sync_enabled")
                                      : welcomeTranslation("stats_cards.sync_enabled");
                                  const barColor =
                                      cfg.color ?? theme.colors.blue.blue90;
                                  const amountColor =
                                      cfg.amountColor ??
                                      (cfg.amountText?.trim()?.startsWith("-")
                                          ? theme.colors.alertError.alertError100
                                          : /^[+-]?0 €$/.test(cfg.amountText?.trim() || "") ? theme.colors.orderSecondary.orderSecondary80 : "#088738");

                                  return (
                                      <Card
                                          htmlProps={{
                                            style: {
                                              padding: "24px 24px",
                                              boxSizing: "border-box",
                                              height: "176px",
                                              textAlign: "start"
                                            },
                                          }}
                                      >
                                        <SimpleGrid gap={0} itemsPerLine={2} htmlProps={{ style: { height: "100%" } }}>
                                          <SimpleGrid.Item col={1}>
                                            <div
                                                style={{
                                                  display: "flex",
                                                  flexDirection: "column",
                                                  alignItems: "flex-start",
                                                  flex: "1 0 0",
                                                  alignSelf: "stretch",
                                                  justifyContent: "space-between",
                                                  height: "100%",
                                                }}
                                            >
                                              <div>
                                                <Title
                                                    htmlProps={{
                                                      style: {
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary100,
                                                        lineHeight: "150%",
                                                      },
                                                    }}
                                                >
                                                  {welcomeTranslation("stats_cards.invoices_title")}
                                                </Title>
                                                <div>
                                                  <Icon
                                                      variant={syncIcon}
                                                      width="18px"
                                                      height="18px"
                                                      color={syncColor}
                                                  />
                                                  <span
                                                      style={{
                                                        marginLeft: 1,
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary70,
                                                        fontFamily:
                                                        theme.fonts.h1400.fontFamily,
                                                        fontSize:
                                                        theme.fonts.h1400.fontSize,
                                                        fontWeight:
                                                        theme.fonts.h1400.fontWeight,
                                                        lineHeight:
                                                        theme.fonts.h1400.lineHeight,
                                                      }}
                                                  >
                                            {syncText}
                                          </span>
                                                </div>
                                              </div>
                                              <div>
                                                <Title
                                                    htmlProps={{
                                                      style: {
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary100,
                                                        fontWeight: 600,
                                                        fontSize: "28px",
                                                        lineHeight: "107.143%",
                                                      },
                                                    }}
                                                >
                                                  {cfg.value}
                                                </Title>
                                                <div>
                                          <span
                                              style={{
                                                color: amountColor,
                                                marginTop: 2,
                                                fontFamily:
                                                theme.fonts.h1500.fontFamily,
                                                fontSize: "16px",
                                                fontWeight:
                                                theme.fonts.h1500.fontWeight,
                                                lineHeight: "150%",
                                              }}
                                          >
                                            {cfg.amountText}
                                          </span>
                                                </div>
                                              </div>
                                            </div>
                                          </SimpleGrid.Item>
                                          <SimpleGrid.Item
                                              col={1}
                                              htmlProps={{
                                                id: "invoices-chart",
                                                style: { containerType: "inline-size" },
                                              }}
                                          >
                                            {Object.keys(
                                                integrationSummaryData?.totals
                                                    ?.ORDINARYINVOICE || {}
                                            ).length > 0 ? (
                                                <SimpleGraphicBar<"label", "value">
                                                    htmlProps={{ id: "invoices-chart" }}
                                                    color={barColor}
                                                    height={"125px"}
                                                    width={"100%"}
                                                    data={parseStatisticData(
                                                        integrationSummaryData.totals
                                                            .ORDINARYINVOICE as unknown as {
                                                          [key: string]: { amount: number };
                                                        }[],
                                                        welcomeTranslation("stats_cards.month",{returnObjects: true}) as string[]
                                                    )}
                                                    xKey="label"
                                                    yKey="value"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                      height: "100%",
                                                      textAlign: "center",
                                                      alignContent: "center",
                                                    }}
                                                >
                                                  {welcomeTranslation("stats_cards.no_created_documents")}
                                                </div>
                                            )}
                                          </SimpleGrid.Item>
                                        </SimpleGrid>
                                      </Card>
                                  );
                                })()}
                          </SimpleGrid.Item>

                          <SimpleGrid.Item htmlProps={{ style: { flex: "0 0 auto" } }}>
                            {!loadingSummary &&
                                integrationSummaryData &&
                                (() => {
                                  const totalRefunds = calcTotalAmount(
                                      integrationSummaryData.totals
                                          .REFUNDINVOICE as unknown as {
                                        [key: string]: {
                                          amount: number;
                                          total: number;
                                        };
                                      }[]
                                  );
                                  const cfg = {
                                    syncActive:
                                        integrationSummaryData["sync-refund-invoices"],
                                    value: totalRefunds.amount,
                                    amountText: `${totalRefunds.total} €`,
                                  } as KpiSectionConfig;
                                  const isActive = cfg.syncActive;
                                  const syncIcon = isActive
                                      ? "dobleCheck"
                                      : "markPadding";
                                  const syncColor = isActive
                                      ? "#088738"
                                      : theme.colors.alertError.alertError100;
                                  const syncText = isActive
                                      ? welcomeTranslation("stats_cards.sync_enabled")
                                      : welcomeTranslation("stats_cards.sync_enabled");
                                  const barColor =
                                      cfg.color ??
                                      theme.colors.orderPrimary.orderPrimary90;
                                  const amountColor =
                                      cfg.amountColor ??
                                      (cfg.amountText?.trim()?.startsWith("-")
                                          ? theme.colors.alertError.alertError100
                                          : /^[+-]?0 €$/.test(cfg.amountText?.trim() || "") ? theme.colors.orderSecondary.orderSecondary80 : "#088738");

                                  return (
                                      <Card
                                          htmlProps={{
                                            style: {
                                              padding: "24px 24px",
                                              boxSizing: "border-box",
                                              height: "176px",
                                              textAlign: "start"
                                            },
                                          }}
                                      >
                                        <SimpleGrid gap={0} itemsPerLine={2} htmlProps={{ style: { height: "100%" } }}>
                                          <SimpleGrid.Item col={1}>
                                            <div
                                                style={{
                                                  display: "flex",
                                                  flexDirection: "column",
                                                  alignItems: "flex-start",
                                                  flex: "1 0 0",
                                                  alignSelf: "stretch",
                                                  justifyContent: "space-between",
                                                  height: "100%",
                                                }}
                                            >
                                              <div>
                                                <Title
                                                    htmlProps={{
                                                      style: {
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary100,
                                                        lineHeight: "150%",
                                                      },
                                                    }}
                                                >
                                                  {welcomeTranslation("stats_cards.refunds_title")}
                                                </Title>
                                                <div>
                                                  <Icon
                                                      variant={syncIcon}
                                                      width="18px"
                                                      height="18px"
                                                      color={syncColor}
                                                  />
                                                  <span
                                                      style={{
                                                        marginLeft: 1,
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary70,
                                                        fontFamily:
                                                        theme.fonts.h1400.fontFamily,
                                                        fontSize:
                                                        theme.fonts.h1400.fontSize,
                                                        fontWeight:
                                                        theme.fonts.h1400.fontWeight,
                                                        lineHeight:
                                                        theme.fonts.h1400.lineHeight,
                                                      }}
                                                  >
                                            {syncText}
                                          </span>
                                                </div>
                                              </div>
                                              <div>
                                                <Title
                                                    htmlProps={{
                                                      style: {
                                                        color:
                                                        theme.colors.orderSecondary
                                                            .orderSecondary100,
                                                        fontWeight: 600,
                                                        fontSize: "28px",
                                                        lineHeight: "107.143%",
                                                      },
                                                    }}
                                                >
                                                  {cfg.value}
                                                </Title>
                                                <div>
                                          <span
                                              style={{
                                                color: amountColor,
                                                marginTop: 2,
                                                fontFamily:
                                                theme.fonts.h1500.fontFamily,
                                                fontSize: "16px",
                                                fontWeight:
                                                theme.fonts.h1500.fontWeight,
                                                lineHeight: "150%",
                                              }}
                                          >
                                            {cfg.amountText}
                                          </span>
                                                </div>
                                              </div>
                                            </div>
                                          </SimpleGrid.Item>
                                          <SimpleGrid.Item
                                              col={1}
                                              htmlProps={{
                                                id: "refunds-chart",
                                                style: { containerType: "inline-size" },
                                              }}
                                          >
                                            {Object.keys(
                                                integrationSummaryData?.totals
                                                    ?.REFUNDINVOICE || {}
                                            ).length > 0 ? (
                                                <SimpleGraphicBar<"label", "value">
                                                    htmlProps={{ id: "refunds-chart" }}
                                                    color={barColor}
                                                    height={"125px"}
                                                    width={"100%"}
                                                    data={parseStatisticData(
                                                        integrationSummaryData.totals
                                                            .REFUNDINVOICE as unknown as {
                                                          [key: string]: { amount: number };
                                                        }[],
                                                        welcomeTranslation("stats_cards.month",{returnObjects: true}) as string[]
                                                    )}
                                                    xKey="label"
                                                    yKey="value"
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                      height: "100%",
                                                      textAlign: "center",
                                                      alignContent: "center",
                                                    }}
                                                >
                                                  {welcomeTranslation("stats_cards.no_created_documents")}
                                                </div>
                                            )}
                                          </SimpleGrid.Item>
                                        </SimpleGrid>
                                      </Card>
                                  );
                                })()}
                          </SimpleGrid.Item>

                          <SimpleGrid.Item htmlProps={{ style: { flex: "0 0 auto" }}}>
                            <SimpleGrid gap={18} itemsPerLine={2}>
                              <SimpleGrid.Item col={1}>
                                <Card
                                    htmlProps={{
                                      style: {
                                        flexDirection: "row",
                                        padding: "20px 20px",
                                        textAlign: "center",
                                        boxSizing: "border-box",
                                      },
                                    }}
                                >
                              <span
                                  style={{
                                    flex: "1 0 auto",
                                    minWidth: 0,
                                    textAlign: "left",
                                    color:
                                    theme.colors.orderSecondary
                                        .orderSecondary100,
                                    fontFamily: theme.fonts.titleL500.fontFamily,
                                    fontSize: theme.fonts.titleL500.fontSize,
                                    fontWeight: "500",
                                    lineHeight: "24px",
                                    alignContent: "center",
                                  }}
                              >
                                {welcomeTranslation("footer_stats.products")}
                              </span>

                                  <span
                                      style={{
                                        flex: "0 0 auto",
                                        textAlign: "right",

                                        color:
                                        theme.colors.orderSecondary
                                            .orderSecondary100,
                                        fontFamily: theme.fonts.titleL500.fontFamily,
                                        fontSize: "32px",
                                        fontWeight: "600",
                                        lineHeight: "30px",
                                      }}
                                  >
                                {!loadingSummary &&
                                    integrationSummaryData &&
                                    integrationSummaryData.totals["PRODUCT"] || 0}
                              </span>
                                </Card>
                              </SimpleGrid.Item>
                              <SimpleGrid.Item col={1}>
                                <Card
                                    htmlProps={{
                                      style: {
                                        flexDirection: "row",
                                        padding: "20px 20px",
                                        textAlign: "center",
                                        boxSizing: "border-box",
                                      },
                                    }}
                                >
                              <span
                                  style={{
                                    flex: "1 0 auto",
                                    minWidth: 0,
                                    textAlign: "left",
                                    color:
                                    theme.colors.orderSecondary
                                        .orderSecondary100,
                                    fontFamily: theme.fonts.titleL500.fontFamily,
                                    fontSize: theme.fonts.titleL500.fontSize,
                                    fontWeight: "500",
                                    lineHeight: "24px",
                                    alignContent: "center",
                                  }}
                              >
                                {welcomeTranslation("footer_stats.customers")}
                              </span>

                                  <span
                                      style={{
                                        flex: "0 0 auto",
                                        textAlign: "right",

                                        color:
                                        theme.colors.orderSecondary
                                            .orderSecondary100,
                                        fontFamily: theme.fonts.titleL500.fontFamily,
                                        fontSize: "32px",
                                        fontWeight: "600",
                                        lineHeight: "30px",
                                      }}
                                  >
                                {!loadingSummary &&
                                    integrationSummaryData &&
                                    integrationSummaryData.totals["CLIENT"] || 0}
                              </span>
                                </Card>
                              </SimpleGrid.Item>
                            </SimpleGrid>
                          </SimpleGrid.Item>
                        </SimpleGrid>
                      </SimpleGrid.Item>
                    </SimpleGrid>
                  </SimpleGrid.Item>

                  <SimpleGrid.Item
                    col={1}
                    htmlProps={{
                      style: {
                        flex: "1",
                      },
                    }}
                  >
                    <div style={{ height: "100%", position: "relative" }}>
                      <Card
                        htmlProps={{
                          style: {
                            textAlign: "left",
                            padding: "20px",
                            height: "inherit",
                            position: "absolute",
                            top: 0,
                            boxSizing: "border-box",
                          },
                        }}
                      >
                        {loadingDocuments && (
                          <div
                            style={{
                              width: "100%",
                              height: "100%",
                              textAlign: "center",
                              alignContent: "center",
                            }}
                          >
                            <Spinner size={40} />
                          </div>
                        )}
                        {!loadingDocuments &&
                          !integrationDocumentsData?.documents?.length && (
                            <section
                              style={{
                                height: "100%",
                                textAlign: "center",
                                alignContent: "center",
                              }}
                            >
                              {welcomeTranslation("stats_cards.no_created_documents")}
                            </section>
                          )}
                        {!loadingDocuments &&
                          !!integrationDocumentsData?.documents?.length &&
                          groupInterationDocumentsByDateMemo && (
                            <ScrollList
                              containerElement="section"
                              htmlProps={{
                                style: {
                                  width: "100%",

                                  height: "inherit",
                                },
                              }}
                              title={welcomeTranslation("recent_documents.title")}
                            >
                              {groupInterationDocumentsByDateMemo &&
                                groupInterationDocumentsByDateMemo.map(
                                  ({ d, date }) => {
                                    console.log(d["full-reference"]);
                                    const { time } = parseDocumentDate(
                                      d["creation-date"]
                                    );

                                    if (date) {
                                      const { date: today } = parseDocumentDate(
                                        new Date().toISOString()
                                      );
                                      if (date === today) {
                                        date = welcomeTranslation("recent_documents.today_label");
                                      }
                                    }

                                    return (
                                      <DocumentCardInfo
                                        key={d["full-reference"]}
                                      >
                                        <DocumentCardInfo.Body>
                                          <DocumentCardInfo.Body.Header>
                                            {date}
                                          </DocumentCardInfo.Body.Header>
                                          <DocumentCardInfo.Body.Body>
                                            <span
                                              style={{
                                                display: "flex",
                                                gap: "8px",
                                              }}
                                            >
                                              <span
                                                style={{
                                                  ...theme.fonts.h1500,
                                                  color:
                                                    theme.colors.orderSecondary
                                                      .orderSecondary100,
                                                }}
                                              >
                                                {(() => {
                                                  const documentState =
                                                    integrationDocumentsData.documentStates.find(
                                                      (ds) =>
                                                        ds.id ===
                                                        d["document-state-id"]
                                                    );
                                                  switch (documentState?.type) {
                                                    case "ORDINARYINVOICE":
                                                      return welcomeTranslation("recent_documents.doc_type.invoice");
                                                    case "SALESORDER":
                                                      return welcomeTranslation("recent_documents.doc_type.order");
                                                    case "REFUNDINVOICE":
                                                      return welcomeTranslation("recent_documents.doc_type.refund");
                                                    default:
                                                      return "";
                                                  }
                                                })()}
                                              </span>
                                              <span>{time}</span>
                                            </span>
                                            {(() => {
                                              const state =
                                                integrationDocumentsData.documentStates.find(
                                                  (ds) =>
                                                    ds.id ===
                                                    d["document-state-id"]
                                                );
                                              if (!state) return null;
                                              return (
                                                <Badge
                                                  htmlProps={{
                                                    style: {
                                                      backgroundColor:
                                                        state.color,
                                                        display: "inline-block",
                                                        maxWidth: "94px",
                                                        minWidth: "94px",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                    },
                                                  }}
                                                >
                                                  {textStatus(state.type ?? "", state.order, state.name)}
                                                </Badge>
                                              );
                                            })()}
                                          </DocumentCardInfo.Body.Body>
                                        </DocumentCardInfo.Body>
                                        <DocumentCardInfo.Footer>
                                          <div>
                                            <span>
                                              {(() => {
                                                const [ref] = d.title
                                                  .split(" - ")
                                                  .slice(0, -1);
                                                const { variant } = d.verifactuState ? verifactuConfig[d.verifactuState as keyof typeof verifactuConfig] : {};
                                                return (
                                                  <>
                                                    <strong>{ref}</strong>
                                                    <span> | </span>
                                                    <span>{d.customer}</span>
                                                    { variant && 
                                                      <>
                                                      { d.customer && <span> | </span> }
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
                                                      </>
                                                    }
                                                  </>
                                                );
                                              })()}
                                            </span>
                                          </div>
                                          <span>{d["total-amount"]} €</span>
                                        </DocumentCardInfo.Footer>
                                      </DocumentCardInfo>
                                    );
                                  }
                                )}
                            </ScrollList>
                          )}
                      </Card>
                    </div>
                  </SimpleGrid.Item>
                </SimpleGrid>
              </SimpleGrid.Item>
            </>
          )}
        </SimpleGrid>
      </Card>
      <IntegrationModal
        isOpen={openIntegrationModal}
        closeModal={() => setOpenIntegrationModal(false)}
        onError={(error) => console.error("Integration modal error:", error)}
        stopIntegration={() => setIntegrationSummaryData((prev) => prev ? { ...prev, "integration-status": "PAUSED" } : prev)}
        reactivateIntegration={() => setIntegrationSummaryData((prev) => prev ? { ...prev, "integration-status": "ACTIVE" } : prev)}
        integrationStatus={integrationSummaryData?.["integration-status"] === "ACTIVE" ? "Active" : "Paused"}
      />
      <ErrorModal
        isOpen={openErrorModal}
        close={() => setOpenErrorModal(false)}
        message={errorTranslation("modal_error.message2")}
      />
    </section>
  );
}
