import { ButtonVariant } from "@stelsolutions/stelorder-catalog/dist/components/button/button";
import { StatusType } from "@stelsolutions/stelorder-catalog/dist/components/status/status";

export type PaginatedResult<T> = {
    totalResults: number;
    results: T[];
}

export type AccountStatus = "Active" | "Paused" | "Blocked";
export const accountStatusUI: Record<
  AccountStatus,
  {
    statusVariant: StatusType;
    statusText: (func: (key: string) => string) => string;
    buttonLabel: (func: (key: string) => string) => string;
    buttonVariant: ButtonVariant;
  }
> = {
  Active: {
    statusVariant: "active",
    statusText: (func) => func("integration_status.label_status.active_label"),
    buttonLabel: (func) => func("integration_status.btn.pause_btn"),
    buttonVariant: "gray",
  },
  Paused: {
    statusVariant: "paused",
    statusText: (func) => func("integration_status.label_status.paused_label"),
    buttonLabel: (func) => func("integration_status.btn.activate_btn"),
    buttonVariant: "primary",
  },
  Blocked: {
    statusVariant: "danger",
    statusText: (func) => func("integration_status.label_status.blocked_label"),
    buttonLabel: (func) => func("integration_status.btn.contract_now_btn"),
    buttonVariant: "secondary",
  },
};

export const verifactuConfig = {
  PENDING_ISSUE: { variant: "file-draft", label: (func: (key: string) => string) => func("state_verifactu.draft") },
  PENDING_REGISTRY: { variant: "file-draft", label: (func: (key: string) => string) => func("state_verifactu.draft") },
  SIGNED: { variant: "file-done", label: (func: (key: string) => string) => func("state_verifactu.accepted") },
  ISSUED: { variant: "file-done", label: (func: (key: string) => string) => func("state_verifactu.accepted") },
  SIGNED_WITH_INCIDENTS: {
    variant: "file-incidence",
    label: (func: (key: string) => string) => func("state_verifactu.incident"),
  },
  ISSUED_WITH_INCIDENTS: {
    variant: "file-incidence",
    label: (func: (key: string) => string) => func("state_verifactu.incident"),
  },
  REFUSED: { variant: "file-incidence", label: (func: (key: string) => string) => func("state_verifactu.refused") },
  CANCELED: { variant: "file-error", label: (func: (key: string) => string) => func("state_verifactu.refused") },
  CANCELED_WITH_INCIDENTS: { variant: "file-error", label: (func: (key: string) => string) => func("state_verifactu.refused") },
  DEFAULT: { variant: "file-draft", label: (func: (key: string) => string) => func("state_verifactu.draft") },
} as const;