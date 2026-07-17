import { useContext, useState } from "react";
import { IntegrationContext } from "../../context/integration/IntegrationContext";
import { Button, Form, Icon, Modal, SimpleGrid } from "@stelsolutions/stelorder-catalog";
import { useActionModal } from "../../hooks/useActionModal";
import { useTranslation } from "react-i18next";

export type DeleteIntegrationProps = {
  closeModal: () => void;
  isOpen: boolean;
  onError: (error: unknown) => void;
};

export function DeleteIntegration({
  closeModal,
  isOpen,
  onError,
}: DeleteIntegrationProps) {
  const [deleteText, setDeleteText] = useState("");
  const { deleteIntegration, integration: { integrationId } } = useContext(IntegrationContext) ?? {
    integration: "",
    deleteIntegration: () => {},
  };

  const animationDurationSec = 0.3;

  const { t: navbarTranslation } = useTranslation("navbar");

  const afterComplete = () => {
    closeModal();
    setTimeout(() => {
      deleteIntegration();
    }, (animationDurationSec + 0.1) * 1000);
  };

  const afterError = (error: unknown) => {
    closeModal();
    setTimeout(() => {
      onError(error);
    }, (animationDurationSec + 0.1) * 1000);
  };

  const { close, root, loading, submit } = useActionModal({ animationDurationSec, closeModal, isOpen, onError: afterError, onComplete: afterComplete, action: { endpoint: '/integrations', method: 'DELETE' }, submitData: { integrationId } });

  return (
    <Modal
      showIn={root}
      isOpen={isOpen}
      isCentered={true}
      fade={false}
      animationDurationSec={animationDurationSec}
      htmlProps={{ as: "section", className: "stel-modal", style: { boxSizing: "content-box" }  }}
    >
      <SimpleGrid
        itemsPerLine={2}
        htmlProps={{ as: "header", style: { paddingBottom: 16 } }}
      >
        <SimpleGrid.Item
          htmlProps={{
            as: "h1",
            style: { flex: "1 0 0", textWrap: "wrap", margin: 0 },
            className: "modal-title",
          }}
        >
          {navbarTranslation("delete_integration.title")}
        </SimpleGrid.Item>
        <SimpleGrid.Item
          htmlProps={{ as: "span", style: { flex: "0 0 auto" } }}
        >
          <Icon
            variant="close"
            htmlProps={{
              onClick: () => close(),
              style: { cursor: "pointer", opacity: 0.5 },
            }}
            width="22px"
            height="22px"
            color="inherit"
          />
        </SimpleGrid.Item>
      </SimpleGrid>
      <section className="modal-text" style={{ paddingBottom: 12 }}>
        {navbarTranslation("delete_integration.message_text")}
      </section>
      <Form.Group controlId="delete">
        <Form.Label>{navbarTranslation("delete_integration.title_write_text_delete")}</Form.Label>
        <Form.Control
          htmlProps={{
            type: "text",
            value: deleteText,
            onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
              setDeleteText(e.target.value),
            placeholder: navbarTranslation("delete_integration.placeholder_write_text_delete"),
          }}
        />
      </Form.Group>
      <SimpleGrid
        itemsPerLine={2}
        alignY="stretch"
        htmlProps={{ style: { paddingTop: 20 } }}
      >
        <SimpleGrid.Item>
          <Button
            variant="gray"
            size="xl"
            htmlProps={{
              style: { width: "100%" },
              onClick: () => close(),
            }}
          >
            {navbarTranslation("delete_integration.btn.cancelled_btn")}
          </Button>
        </SimpleGrid.Item>
        <SimpleGrid.Item>
          <Button
            variant="secondary"
            size="xl"
            htmlProps={{
              style: { width: "100%" },
              onClick: () => submit(),
              disabled:
                loading ||
                deleteText.toLowerCase() !== navbarTranslation("delete_integration.placeholder_write_text_delete").toLowerCase(),
            }}
          >
            {loading ? navbarTranslation("delete_integration.btn.loading_delete_btn") : navbarTranslation("delete_integration.btn.delete_btn")}
          </Button>
        </SimpleGrid.Item>
      </SimpleGrid>
    </Modal>
  );
}
