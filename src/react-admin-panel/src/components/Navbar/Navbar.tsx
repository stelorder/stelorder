import {
  Icon,
  IntegrationsThemeType,
  Modal,
  Navbar,
  SimpleGrid,
} from "@stelsolutions/stelorder-catalog";
import { NavbarItem } from "./NavbarItem";
import React, { PropsWithChildren, useContext, useId, useState } from "react";
import { useTheme } from "styled-components";
import { RootContext } from "../../context/RootContext/RootContext.context";
import { DeleteIntegration } from "../DeleteIntegration/DeleteIntegration";
import { ErrorModal } from "../ErrorModal/ErrorModal";
import { ResetConfiguration } from "../ResetConfiguration/ResetConfiguration";
import { useTranslation } from "react-i18next";

export const NavbarMenu: React.FC<PropsWithChildren> = ({children}) => {
  
  const { root } = useContext(RootContext) || { root: document.body };
  const [openErrorModal, setOpenErrorModal] = useState<boolean>(false);
  const [openResetModal, setOpenResetModal] = useState<boolean>(false);
  const [openSuccessModal, setOpenSuccessModal] = useState<boolean>(false);
  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);
  const theme = useTheme() as IntegrationsThemeType;
  const id = useId();
  const { t: navbarTranslation } = useTranslation("navbar");
  const { t: errorTranslation } = useTranslation("error");

  
  return (
    <>
      <Navbar
        htmlProps={{
          style: { width: "100%", boxSizing: "border-box" }
        }}
        options={{
          alignMessage: "left",
          message: (
            <>
              <NavbarItem
                onClick={() => {
                  setOpenResetModal(true);
                }}
              >
                {navbarTranslation("options.reset_config")}
              </NavbarItem>
              <NavbarItem
                onClick={() => {
                  setOpenDeleteModal(true);
                }}
              >
                {navbarTranslation("options.delete_integration")}
              </NavbarItem>
            </>
          ),
        }}
      >
        <div style={{ display: "flex" }}>
          {React.Children.toArray(children).map((tab, index) => (
            <Navbar.Tab
              key={`${id}-tab-${index}`}
            >
              {tab}  
            </Navbar.Tab>
          ))}
        </div>
      </Navbar>
      <Modal
        showIn={root}
        isOpen={openSuccessModal}
        isCentered={true}
        fade={false}
        animationDurationSec={0.3}
        htmlProps={{ as: "section", className: "stel-modal" }}
      >
        <SimpleGrid direction="column" gap={24} alignY="center">
          <SimpleGrid.Item>
            <Icon
              variant="success"
              width="46px"
              height="46px"
              color={theme.colors.bn.bn0}
            />
          </SimpleGrid.Item>
          <SimpleGrid.Item
            htmlProps={{
              as: "h1",
              style: { flex: "1 0 0", textWrap: "wrap", margin: 0 },
              className: "modal-title",
            }}
          >
            {navbarTranslation("reestablished_config")}
          </SimpleGrid.Item>
        </SimpleGrid>
      </Modal>
      <ErrorModal message={errorTranslation("modal_error.message1")} isOpen={openErrorModal} close={() => setOpenErrorModal(false)} />
      <ResetConfiguration
        isOpen={openResetModal}
        closeModal={() => setOpenResetModal(false)}
        onComplete={() => {
          setOpenSuccessModal(true);
          setTimeout(() => {
            setOpenSuccessModal(false);
          }, 2000);
        }}
        onError={() => setOpenErrorModal(true)}
      />
      <DeleteIntegration 
        isOpen={openDeleteModal}
        closeModal={() => setOpenDeleteModal(false)}
        onError={() => setOpenErrorModal(true)}
      />
      
    </>
  );
};
