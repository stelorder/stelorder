import { Button, Icon, Modal, SimpleGrid } from "@stelsolutions/stelorder-catalog";
import { useActionModal } from "../../hooks/useActionModal";
import { useTranslation } from "react-i18next";

export type ResetConfigurationProps = {
  closeModal: () => void;
  isOpen: boolean;
  onError: (error: unknown) => void;
  onComplete: () => void;
};

export function ResetConfiguration({
  closeModal,
  isOpen,
  onError,
  onComplete,
}: ResetConfigurationProps) {
  const animationDurationSec = 0.3;

  const { t: navbarTranslation } = useTranslation("navbar");

  const afterComplete = () => {
    closeModal();
    setTimeout(() => {
      onComplete();
    }, (animationDurationSec + 0.1) * 1000);
  };

  const afterError = (error: unknown) => {
    closeModal();
    setTimeout(() => {
      onError(error);
    }, (animationDurationSec + 0.1) * 1000);
  };

  const { close, root, loading, submit } = useActionModal({ animationDurationSec, closeModal, isOpen, onError: afterError, onComplete: afterComplete, action: { endpoint: '/integrations/configurations/defaults', method: 'PUT' } });

  return (
    <Modal
      isOpen={isOpen}
      isCentered={true}
      fade={false}
      showIn={root}
      animationDurationSec={animationDurationSec}
      htmlProps={{ as: "section", className: "stel-modal" }}
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
          {navbarTranslation("reset_config.title")}
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
        {navbarTranslation("reset_config.message_text")}
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
            {navbarTranslation("reset_config.btn.cancelled_btn")}
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
            {loading ? navbarTranslation("reset_config.btn.loading_reset_btn") : navbarTranslation("reset_config.btn.reset_btn")}
          </Button>
        </SimpleGrid.Item>
      </SimpleGrid>
    </Modal>
  );
}
