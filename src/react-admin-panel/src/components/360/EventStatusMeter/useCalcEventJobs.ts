import {EventJobData, EventStatus} from "../../../hooks/360/event-jobs";
import {useMemo} from "react";
import {useTheme} from "styled-components";
import {IntegrationsThemeType} from "@stelsolutions/stelorder-catalog";
import {useTranslation} from "react-i18next";


function processEventJobs(t : (prop: string) => string ,theme: IntegrationsThemeType, status: EventStatus, jobs: EventJobData[]): {
    color: string;
    now: number;
    label: string;
} {
    const completed = jobs.filter(job => job.status !== 'UNCOMMITED').length;
    return {
        color: status !== 'PENDING' ? theme.colors.alertSuccess.alertSuccess100 :
            theme.colors.blue.blue100,
        label: status !== 'PENDING' ? t("sync_status.success") : `${t("sync_status.sync_message.message")} ${completed} ${t("sync_status.sync_message.of")} ${jobs.length}`,
        now: status !== 'PENDING' ? 100 : jobs.length === 0 ? 0 : (completed / jobs.length) * 100
    }
}

export function useCalcEventJobs({ status, eventJobs } : { status: EventStatus, eventJobs: EventJobData[] }){
    const theme = useTheme() as IntegrationsThemeType;
    const { t } = useTranslation("configuration");
    return useMemo(() => processEventJobs(t, theme, status, eventJobs), [t, theme, status, eventJobs]);
}