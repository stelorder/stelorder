import { useTranslation } from "react-i18next";
import { Card, Icon, IntegrationsThemeType, SimpleGrid } from "@stelsolutions/stelorder-catalog";
import { useTheme, styled } from "styled-components";

const StyledErrorSection = styled.section`
    *:has(&), #app-container {
        background-color: transparent!important;
    }
`;

export default function ErrorPage() {
    const theme = useTheme() as IntegrationsThemeType;
    const { t: errorTranslation} = useTranslation("error");

    return (
        <StyledErrorSection>
            <Card
            htmlProps={{
              style: {
                height: "100vh",
                alignItems: "center",
                justifyContent: "center",
                display: "flex",

                alignSelf: "stretch",
              },
            }}
          >
            <SimpleGrid
              gap={28}
              htmlProps={{
                style: {
                  maxWidth: "450px",
                },
              }}
            >
              <SimpleGrid.Item>
                <Icon
                  variant="disconnection"
                  width="100px"
                  height="100px"
                  color="inherit"
                />
              </SimpleGrid.Item>
              <SimpleGrid.Item>
                <SimpleGrid gap={12}>
                  <SimpleGrid.Item>
                    <span
                      style={{
                        ...theme.fonts.titleXl500,
                        color: theme.colors.orderSecondary.orderSecondary100,
                      }}
                    >
                      {errorTranslation("state.title")}
                    </span>
                  </SimpleGrid.Item>
                  <SimpleGrid.Item>
                    <SimpleGrid gap={8}>
                      <SimpleGrid.Item>
                        <span
                          style={{
                            ...theme.fonts.titleXl500,
                            color:
                              theme.colors.orderSecondary.orderSecondary100,
                          }}
                        >
                          {errorTranslation("state.subtitle")}
                        </span>
                      </SimpleGrid.Item>
                      <SimpleGrid.Item>
                        <span
                          style={{
                            ...theme.fonts.h1400,
                            color: theme.colors.orderSecondary.orderSecondary70,
                          }}
                        >
                          {errorTranslation("state.description")}
                        </span>
                      </SimpleGrid.Item>
                    </SimpleGrid>
                  </SimpleGrid.Item>
                </SimpleGrid>
              </SimpleGrid.Item>
              <SimpleGrid.Item
                htmlProps={{
                  style: {
                    borderTop: "1px solid " + theme.colors.bn.bn25,
                  },
                }}
              >
                <Icon
                  variant="logo-STEL-principal"
                  width="136px"
                  height="40px"
                  color="inherit"
                  htmlProps={{
                    style: {
                      marginTop: "32px",
                    },
                  }}
                />
              </SimpleGrid.Item>
            </SimpleGrid>
          </Card>
        </StyledErrorSection>
    )
}