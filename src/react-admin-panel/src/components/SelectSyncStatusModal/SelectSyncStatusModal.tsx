import { useContext, useId } from "react";
import { Button, Form, Icon, IntegrationsThemeType, Modal, ScrollList, SimpleGrid } from "@stelsolutions/stelorder-catalog";
import { RootContext } from "../../context/RootContext/RootContext.context";
import { useTheme } from "styled-components";
import { useTranslation } from "react-i18next";

export type SelectSyncStatusModalProps = {
  title: string;
  availableStatuses: Record<string, string>;
  statuses: string[];
  isOpen: boolean;
  close: () => void;
  submitStatuses: (status: string[]) => void;

}
export const SelectSyncStatusModal : React.FC<SelectSyncStatusModalProps> = ({
    title,
    statuses,
    availableStatuses,
    isOpen,
    close,
    submitStatuses,
}) => {
    const id = useId();
    const { root } = useContext(RootContext) || { root: document.body };
    const theme = useTheme() as IntegrationsThemeType;
    const { t: configurationTranslation } = useTranslation("configuration");
    return <Modal
      isOpen={isOpen}
      isCentered={true}
      animationDurationSec={0.3}
      showIn={root}
      htmlProps={{
        as: "section",
        style: {
            maxWidth: "548px",
            borderRadius: "10px",
            padding: "18px",
        }
      }}
    >
        <Form
          notHandleValidation
          htmlProps={{
            onSubmit: (e) => {
              e.stopPropagation();
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const selectedStatuses = formData.getAll("statuses") as string[];
              console.log("selectedStatuses", selectedStatuses);
              submitStatuses(selectedStatuses);
              close();
            }
          }}
        >
            <header
                style={{
                    display: "flex"
                }}
            >
                <h2
                  style={{
                        ...theme.defaults.cardTitle,
                        color: theme.colors.orderSecondary.orderSecondary100,
                        flex: "1 0 0",
                        margin: "0 0 14px 0",
                      }}
                >
                  {title}
                </h2>
                <Icon
                    variant="close"
                    htmlProps={{
                    onClick: () => close(),
                    style: { cursor: "pointer", opacity: 0.5, flex: "0 0 auto" },
                    }}
                    width="22px"
                    height="22px"
                    color="inherit"
                />
            </header>
            <style>{`
                #${id}-scrolllist > div {
                    border-bottom: none;
                }
            `}</style>
            <ScrollList
               title=""
               containerElement="section"
               
               htmlProps={{
                id: `${id}-scrolllist`,
                style: {
                    maxHeight: "50vh",
                }
               }} 
            >
                <SimpleGrid
                    itemsPerLine={3}
                    gap={16}
                >
                    {Object.entries(availableStatuses).map(([key, label], index) => (
                        <SimpleGrid.Item key={`${id}-status-item-${index}`}>
                            <Form.Checkbox
                                label={label}
                                labelPosition="right"
                                id={`${id}-status-checkbox-${index}`}
                                htmlProps={{
                                    defaultChecked: statuses.includes(key),
                                    value: key,
                                    name: "statuses",
                                }}
                            />
                        </SimpleGrid.Item>
                    ))}
                </SimpleGrid>
            </ScrollList>
            <footer style={{
                marginTop: 20,
                display: "flex",
                flexDirection: "column",
            }}>
                <Button
                    variant="secondary"
                    size="xl"
                >
                    {configurationTranslation("header.btn.save_btn")}
                </Button>
            </footer>

        </Form>


    </Modal>
}