import {styled} from "styled-components";
import {IntegrationsThemeType, List} from "@stelsolutions/stelorder-catalog";

export const ProductErrorItem = styled(List.Item)<{
    $theme: IntegrationsThemeType;
}>`
  box-sizing: border-box;
  background: ${({ $theme }) => $theme.colors.posPrimary.posPrimary10};
  border: 1px solid ${({ $theme }) => $theme.colors.posPrimary.posPrimary20};
  width: 100%;
  min-width: 0;
  border-radius: 6px;
  margin-top: 6px;
  padding: 8px 12px;

  &:hover {
    background: ${({ $theme }) => $theme.colors.posPrimary.posPrimary20};
    border: 1px solid ${({ $theme }) => $theme.colors.posPrimary.posPrimary80};
  }
`;