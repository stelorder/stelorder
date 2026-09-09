import {EventJobsData} from "../../../hooks/360/event-jobs";
import {Icon, IntegrationsThemeType, ProgressBar, SimpleGrid} from "@stelsolutions/stelorder-catalog";
import {useTheme} from "styled-components";
import {useCalcEventJobs} from "./useCalcEventJobs.ts";
import {useTranslation} from "react-i18next";


export function EventStatusMeter({ eventJobs, isProcessing }: {
    eventJobs: EventJobsData|null,
    isProcessing?: boolean,
}) {
    const theme = useTheme() as IntegrationsThemeType;
    const { t } = useTranslation("configuration");
    const { color, now, label } = useCalcEventJobs({ status: eventJobs?.event.status || 'PENDING', eventJobs: eventJobs?.jobs ?? [] });
    const successIcon = <Icon
        variant="success"
        height="14px"
        width="14px"
    />;

    const syncIcon = <Icon
        variant="automatic-task"
        color={theme.colors.blue.blue80}
        height="14px"
        width="14px"
    />;
    return (
        <SimpleGrid gap={8}>
            <SimpleGrid.Item
                htmlProps={{
                    style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        justifyContent: "flex-end",
                    },
                }}
            >
                {
                    eventJobs?.event.status && eventJobs.event.status !== 'PENDING' ? successIcon : syncIcon
                }
                <div
                    style={{
                        ...theme.fonts.h2600,
                        color:
                        theme.colors.orderSecondary
                            .orderSecondary70,
                    }}
                >
                    {
                        isProcessing ?
                            t('sync_status.processing') :
                            label
                    }
                </div>
            </SimpleGrid.Item>
            <SimpleGrid.Item
                htmlProps={{
                    style: {
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        justifyContent: "flex-end",
                    },
                }}
            >
                <ProgressBar
                    now={now}
                    color={color}
                    trackColor={
                        theme.colors.orderSecondary
                            .orderSecondary0
                    }
                    width={"205px"}
                    height={"6px"}
                    label={false}
                    borderColor={theme.colors.blue.blue30}
                />
            </SimpleGrid.Item>
        </SimpleGrid>
    )
}