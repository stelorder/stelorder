import { IntegrationsThemeType } from "@stelsolutions/stelorder-catalog";
import styled from "styled-components";
export const NavbarItem = styled.div<{ theme: IntegrationsThemeType }>`
  && {
    padding: 12px;
    min-width: 165px;
    height: 20px;
    color: ${({ theme }) => theme.colors.bn.bn100};
    font-size: ${({ theme }) => theme.fonts.h1500.fontSize};
    font-family: ${({ theme }) => theme.fonts.h1500.fontFamily};
    font-weight: ${({ theme }) => theme.fonts.h1500.fontWeight};
    line-height: ${({ theme }) => theme.fonts.h1500.lineHeight};
    font-style: ${({ theme }) => theme.fonts.h1500.fontStyle};
  }

  &:hover {
    background-color: ${({ theme }) =>
      theme.colors.orderPrimary.orderPrimary10};
  }

  &:hover:first-child {
    border-top-left-radius: 10px;
    border-top-right-radius: 10px;
  }

  &:hover:last-child {
    border-bottom-left-radius: 10px;
    border-bottom-right-radius: 10px;
  }
`;