import { useContext } from "react";
import { IntegrationContext } from "../../context/integration/IntegrationContext";
import { NavLink, useOutlet } from "react-router-dom";

import "./MainRoute.css";
import HomePage from "../../pages/HomePage";
import { NavbarMenu } from "../Navbar/Navbar";
import { IntegrationsThemeType, SimpleGrid } from "@stelsolutions/stelorder-catalog";
import { useTheme, styled } from "styled-components";
import { WelcomePage } from "../../pages/WelcomePage";
import { useTranslation } from "react-i18next";

const StyledNavLink = styled(NavLink)`
    all: unset;
    color: inherit;
    text-decoration: none;
    cursor: pointer;
`

export function MainRoute() {
  const { hasIntegrations } = useContext(IntegrationContext) ?? {
    hasIntegrations: () => false,
  };
  const outlet = useOutlet();
  const theme = useTheme() as IntegrationsThemeType;
  const { t: navbarTranslation } = useTranslation("navbar");

  return (
    <SimpleGrid
      alignX="center"
      htmlProps={{
        style: { minHeight: "max-content" },
        id: "app-container",
      }}
    >
      {hasIntegrations() ? (
        <SimpleGrid.Item
          htmlProps={{
            style: { width: "100%" },
          }}
        >
          <SimpleGrid direction="column" gap={0} htmlProps={{ style: { height: "100%", backgroundColor: theme.colors.orderSecondary.orderSecondary10 } }}>
            <SimpleGrid.Item col={"auto"}>
              <NavbarMenu>
                <StyledNavLink to="/">{navbarTranslation("menu.dashboard")}</StyledNavLink>
                <StyledNavLink to="order">{navbarTranslation("menu.order")}</StyledNavLink>
                <StyledNavLink to="invoice">{navbarTranslation("menu.invoices")}</StyledNavLink>
                <StyledNavLink to="configuration">{navbarTranslation("menu.settings")}</StyledNavLink>
                <StyledNavLink to="jobs">{navbarTranslation("menu.work_orders")}</StyledNavLink>
              </NavbarMenu>
            </SimpleGrid.Item>
            <SimpleGrid.Item htmlProps={{ style: { flex: "1 0 auto" } }}>
              {outlet ? outlet : <WelcomePage />}
            </SimpleGrid.Item>
          </SimpleGrid>
        </SimpleGrid.Item>
      ) : (
        <SimpleGrid.Item
          align="center"
          htmlProps={{
            style: { width: "100%", padding: 24, maxWidth: theme.breakpoints.xl },
          }}
        >
          <HomePage />
        </SimpleGrid.Item>
      )}
    </SimpleGrid>
  );
}
