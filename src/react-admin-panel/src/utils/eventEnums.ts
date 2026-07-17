export enum EventType {
  SALES_ORDER = "SALES_ORDER",
  REFUND_INVOICE = "REFUND_INVOICE",
  ORDINARY_INVOICE = "ORDINARY_INVOICE",
  PRODUCT = "PRODUCT",
}

export enum EventAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  PDF = "PDF",
  VERIFACTU = "VERIFACTU",
  EMAIL = "EMAIL",
}

export enum EventDirection {
  TO_PRIMARY = "TO_PRIMARY",
  TO_SECONDARY = "TO_SECONDARY",
}

export enum EventStatus {
  COMPLETED = "COMPLETED",
  INFO = "INFO",
  FAILED = "FAILED",
  UNCOMMITED = "UNCOMMITED",
}

export enum SubjobType {
  CREATE_PRODUCT = "CREATE_PRODUCT",
  CREATE_CUSTOMER = "CREATE_CUSTOMER",
  CREATE_ADDRESS = "CREATE_ADDRESS",
  SYNC_CUSTOMER = "SYNC_CUSTOMER",
  SYNC_PRODUCT = "SYNC_PRODUCT",
}

// Traducciones
export const EventTypeTranslates: Record<EventType, (func: (key: string) => string) => string> = {
  [EventType.PRODUCT]: (func) => func("row_values.state_type.product"),
  [EventType.SALES_ORDER]: (func) => func("row_values.state_type.sales_order"),
  [EventType.REFUND_INVOICE]: (func) => func("row_values.state_type.refund_invoice"),
  [EventType.ORDINARY_INVOICE]: (func) => func("row_values.state_type.ordinary_invoice"),
};

export const EventActionTranslates: Record<EventAction, (func: (key: string) => string) => string> = {
  [EventAction.CREATE]: (func) => func("row_values.action_type.create"),
  [EventAction.UPDATE]: (func) => func("row_values.action_type.update"),
  [EventAction.PDF]: (func) => func("row_values.action_type.pdf"),
  [EventAction.VERIFACTU]: (func) => func("row_values.action_type.verifactu"),
  [EventAction.EMAIL]: (func) => func("row_values.action_type.email"),
};

export const EventDirectionTranslates: Record<string, (func: (key: string) => string) => string> = {
  [EventDirection.TO_PRIMARY]: (func) => func("row_values.direction.to_primary"),
  [EventDirection.TO_SECONDARY]: (func) => func("row_values.direction.to_secondary"),
}

export const EventStatusTranslates: Record<EventStatus, (func: (key: string) => string) => string> = {
  [EventStatus.COMPLETED]: (func) => func("row_values.state_event.completed"),
  [EventStatus.INFO]: (func) => func("row_values.state_event.info"),
  [EventStatus.FAILED]: (func) => func("row_values.state_event.failed"),
  [EventStatus.UNCOMMITED]: (func) => func("row_values.state_event.uncommited"),
};

export const SubjobTypeTranslates: Record<SubjobType, (func: (key: string, opt: Record<string, unknown>) => [string, string]) => string> = {
  [SubjobType.CREATE_PRODUCT]: (func) => func("row_values.subjob_type.create_product", { returnObjects: true })[0],
  [SubjobType.CREATE_CUSTOMER]: (func) => func("row_values.subjob_type.create_customer", { returnObjects: true })[0],
  [SubjobType.CREATE_ADDRESS]: (func) => func("row_values.subjob_type.create_address", { returnObjects: true })[0],
  [SubjobType.SYNC_CUSTOMER]: (func) => func("row_values.subjob_type.sync_customer", { returnObjects: true })[0],
  [SubjobType.SYNC_PRODUCT]: (func) => func("row_values.subjob_type.sync_product", { returnObjects: true })[0],
};

export default {
  EventType,
  EventAction,
  EventStatus,
  SubjobType,
  EventTypeTranslates,
  EventActionTranslates,
  EventStatusTranslates,
  SubjobTypeTranslates,
};
