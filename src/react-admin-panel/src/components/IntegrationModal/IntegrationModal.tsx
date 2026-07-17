import { Button, Icon, Modal, SimpleGrid } from "@stelsolutions/stelorder-catalog";
import { useActionModal } from "../../hooks/useActionModal";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export type IntegrationModalProps = {
  closeModal: () => void;
  isOpen: boolean;
  onError: (error: unknown) => void;
  stopIntegration: () => void;
  reactivateIntegration: () => void;
  integrationStatus?: string;
};

export function IntegrationModal({
  closeModal,
  isOpen,
  onError,
  stopIntegration,
  reactivateIntegration,
  integrationStatus,
}: IntegrationModalProps) {
  const animationDurationSec = 0.3;
  const { t: welcomeTranslation } = useTranslation("welcome");

  const afterComplete = useCallback(() => {
    closeModal();
    setTimeout(() => {
      if (integrationStatus === "Active") {
        stopIntegration();
      } else {
        reactivateIntegration();
      }
    }, (animationDurationSec + 0.1) * 1000);
  }, [closeModal, integrationStatus, reactivateIntegration, stopIntegration]);
    

  const afterError = useCallback((error: unknown) => {
    closeModal();
    setTimeout(() => {
      onError(error);
    }, (animationDurationSec + 0.1) * 1000);
  }, [closeModal, onError]);

  const { close, root, loading, submit } = useActionModal({
    animationDurationSec,
    closeModal,
    isOpen,
    onError: afterError,
    onComplete: afterComplete,
    action: {
        endpoint: `/integrations/status/${integrationStatus === "Active" ? "paused" : "active"}`,
        method: "PUT",
    },
  });
  return (
    <Modal
      isOpen={isOpen}
      isCentered={true}
      fade={false}
      animationDurationSec={0.3}
      htmlProps={{ as: "section", id: "integration-modal" }}
      showIn={root}
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
          {integrationStatus === "Active"
            ? welcomeTranslation("paused_integration.title")
            : welcomeTranslation("active_integration.title")}
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
      <section className="modal-text">
        {integrationStatus === "Active"
          ? welcomeTranslation("paused_integration.text_modal")
          : welcomeTranslation("active_integration.text_modal")
          }
      </section>
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
            {welcomeTranslation("active_integration.btn.cancel_btn")}
          </Button>
        </SimpleGrid.Item>
        <SimpleGrid.Item>
          <Button
            variant="secondary"
            size="xl"
            htmlProps={{
              disabled: loading,
              style: { width: "100%" },
              onClick: () => submit(),
            }}
          >
            {loading
              ? integrationStatus === "Active" ?
                welcomeTranslation("paused_integration.btn.loading_pause_integration_btn") :
                welcomeTranslation("active_integration.btn.loading_activate_integration_btn")
              : integrationStatus === "Active"
              ? welcomeTranslation("paused_integration.btn.pause_integration_btn")
              : welcomeTranslation("active_integration.btn.activate_integration_btn")}
          </Button>
        </SimpleGrid.Item>
      </SimpleGrid>
    </Modal>
  );
}
