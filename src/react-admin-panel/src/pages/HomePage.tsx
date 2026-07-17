import {
  Button,
  Card,
  Carousel,
  Icon,
  Image, integrationsTheme,
  SimpleGrid,
  VideoPreview,
} from "@stelsolutions/stelorder-catalog";
import { useForm } from "../hooks/useFormWebhooks";
import { API_URL } from "../config/SyncNameConfig";
import { useEffect, useMemo, useState } from "react";
import { ErrorModal } from "../components/ErrorModal/ErrorModal";
import { useTranslation } from "react-i18next";

export default function HomePage() {
  const [ isOpen, setIsOpen ] = useState(false);
  const [action, setAction] = useState<"login" | "register" | undefined>(
    undefined
  );
  const { t: homeTranslation } = useTranslation("home");
  const { t: errorTranslation } = useTranslation("error");

  const ImageWithAs = Image as unknown as React.FC<
    Omit<React.ComponentProps<typeof Image>, "src"> & { as?: React.ElementType }
  >;

  const { handleSubmit } = useForm({
    onComplete: (data: any) => {
      console.log("Data received:", data);
      const { redirectUrl } = data;
      window.location.href = redirectUrl;
    },
    onError: () => {
      setAction(undefined);
      setIsOpen(true);
    },
    endpoint: `${API_URL}/integrations/tempAccessToken`,
    method: "POST",
  });
  useEffect(() => {
    console.log("Action changed to:", action);
    switch (action) {
      case undefined:
        return;
      case "login":
        handleSubmit();
        break;
      case "register":
        handleSubmit({ requestData: { register: true } });
        break;
    }
  }, [action, handleSubmit]);
  const Logo = useMemo( () => Icon.Utils.LazyIcon("logo-STEL-principal"), []);

  return (
    <SimpleGrid direction="column" gap={0} htmlProps={{ style: {
        backgroundColor: integrationsTheme.colors.bn.bn0,
        padding: "40px 28px 28px 28px",
      } }}>
      <SimpleGrid
        gap={0}
        itemsPerLine={1}
        direction="row"
        htmlProps={{ style: { marginBottom: 28 } }}
      >
        <SimpleGrid.Item
          col={1}
          htmlProps={{ style: { textAlign: "center", alignContent: "center" } }}
        >
          <SimpleGrid
              wrap={false}
              direction="column"
              gap={0}
              itemsPerLine={1}

          >
            <SimpleGrid.Item col={1}>
              <ImageWithAs
                  alt="gorilla"
                  height="40.22px"
                  as={Logo}
                  width="139.83px"
              />
            </SimpleGrid.Item>
            <SimpleGrid.Item col={1}>
              <p className="text-title" style={{ margin: "0px", lineHeight: "23.40px", height: "43px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {homeTranslation("header.main_title")}
              </p>
            </SimpleGrid.Item>
            <SimpleGrid.Item col={1}>
              <SimpleGrid alignX="center" gap={22} itemsPerLine={3} htmlProps={{ style: { width: "100%" }}}>
                <SimpleGrid.Item col={1} htmlProps={{ style: { textAlign: "end" } }}>
                  <p
                      className="text1 "
                      style={{
                        fontFamily: "'Roboto', sans-serif",
                        marginRight: "5.87px",
                        display: "inline-block",
                        marginTop: "0px",
                        marginBottom: "0px",
                      }}
                  >
                    4,9
                  </p>
                  <span>
                <Icon variant="star" />
                <Icon variant="star" />
                <Icon variant="star" />
                <Icon variant="star" />
                <Icon variant="star" />
              </span>
                  <p className="text2 " style={{ margin: "0px", textAlign: "end", fontFamily: "'Roboto', sans-serif", }}>
                    {homeTranslation("header.reviews_badge")}
                  </p>
                </SimpleGrid.Item>

                <SimpleGrid.Item
                    col={"auto"}
                    htmlProps={{
                      style: { borderLeft: "1px solid #D4D4DA", width: "1px" },
                    }}
                ></SimpleGrid.Item>

                <SimpleGrid.Item col={1} htmlProps={{ style: { textAlign: "start" } }}>
                  <p
                      className="text1 "
                      style={{
                        display: "inline-block",
                        fontFamily: "'Roboto', sans-serif",
                        margin: "0px",
                      }}
                  >
                    {homeTranslation("header.downloads_badge_part1")}
                  </p>

                  <p className="text2 " style={{ margin: "0px", textAlign: "start", fontFamily: "'Roboto', sans-serif", }}>
                    {homeTranslation("header.downloads_badge_part2")}
                  </p>
                </SimpleGrid.Item>
              </SimpleGrid>
            </SimpleGrid.Item>
          </SimpleGrid>
        </SimpleGrid.Item>
      </SimpleGrid>

      <SimpleGrid
        alignX="center"
        alignY="center"
        gap={18}
        itemsPerLine={2}
        direction="row"
        htmlProps={{ style: { marginBottom: 18 } }}
      >
        <SimpleGrid.Item
          col={1}
          htmlProps={{ style: { flex: "0 0 calc((100% - 18px)/2)" } }}
        >
          <Card
            htmlProps={{
              style: {
                height: "176px",
                width: "100%",
                boxSizing: "border-box",
              },
            }}
            rounded
            text="center"
          >
            <Card.Body>
              <SimpleGrid gap={22}>
                <SimpleGrid.Item>
                  <SimpleGrid
                    direction="column"
                    wrap={false}
                    gap={12}
                    htmlProps={{
                      as: "header",
                    }}
                    itemsPerLine={1}
                  >
                    <SimpleGrid.Item
                      htmlProps={{
                        as: "section",
                      }}
                    >
                      <Card.Title>
                        {homeTranslation("login_card.title")}
                      </Card.Title>
                    </SimpleGrid.Item>
                    <SimpleGrid.Item
                      htmlProps={{
                        as: "section",
                      }}
                    >
                      <Card.Text>
                        {
                          homeTranslation("login_card.description")
                        }
                      </Card.Text>
                    </SimpleGrid.Item>
                  </SimpleGrid>
                </SimpleGrid.Item>
                <SimpleGrid.Item align="end">
                  <Button
                    size="xl"
                    variant="gray"
                    htmlProps={{
                      disabled: action !== undefined,
                      onClick: () => !action && setAction("login"),
                    }}
                  >
                    {homeTranslation("login_card.button_label")}
                  </Button>
                </SimpleGrid.Item>
              </SimpleGrid>
            </Card.Body>
          </Card>
        </SimpleGrid.Item>

        <SimpleGrid.Item
          col={1}
          htmlProps={{ style: { flex: "0 0 calc((100% - 18px)/2)" } }}
        >
          <Card
            htmlProps={{
              style: {
                height: "176px",
                width: "100%",
                boxSizing: "border-box",
              },
            }}
            rounded
            text="center"
          >
            <Card.Body>
              <SimpleGrid
                htmlProps={{
                  style: {
                    height: "100%",
                  },
                }}
                gap={22}
              >
                <SimpleGrid.Item>
                  <SimpleGrid
                    direction="column"
                    wrap={false}
                    gap={12}
                    htmlProps={{
                      as: "header",
                    }}
                    itemsPerLine={1}
                  >
                    <SimpleGrid.Item
                      htmlProps={{
                        as: "section",
                      }}
                    >
                      <Card.Title>
                        {homeTranslation("register_card.title")}
                      </Card.Title>
                    </SimpleGrid.Item>
                    <SimpleGrid.Item
                      htmlProps={{
                        as: "section",
                      }}
                    >
                      <Card.Text>
                        {
                          homeTranslation("register_card.description")
                        }
                      </Card.Text>
                    </SimpleGrid.Item>
                  </SimpleGrid>
                </SimpleGrid.Item>
                <SimpleGrid.Item align="end">
                  <Button size="xl" variant="secondary"
                    htmlProps={{
                      disabled: action !== undefined,
                      onClick: () => !action && setAction("register"),
                    }}
                  >
                    {homeTranslation("register_card.button_label")}
                  </Button>
                </SimpleGrid.Item>
              </SimpleGrid>
            </Card.Body>
          </Card>
        </SimpleGrid.Item>
      </SimpleGrid>

      <Card
        htmlProps={{
          as: "article",
          style: {
            height: "356px",
            width: "100%",
            padding: "32px 20px 20px",
            boxSizing: "border-box",
          },
        }}
        rounded
        text="center"
      >
        <Card.Body>
          <SimpleGrid
            alignX="center"
            alignY="center"
            direction="row"
            htmlProps={{
              style: {
                height: "100%",
              },
            }}
          >
            <SimpleGrid.Item col={1}>
              <SimpleGrid
                direction="column"
                gap={8}
                htmlProps={{
                  as: "header",
                }}
                itemsPerLine={1}
              >
                <SimpleGrid.Item
                  htmlProps={{
                    as: "section",
                  }}
                >
                  <Card.Title>
                    {homeTranslation("video_section.title")}
                  </Card.Title>
                </SimpleGrid.Item>
                <SimpleGrid.Item
                  htmlProps={{
                    as: "section",
                  }}
                >
                  <Card.Text>
                    {homeTranslation("video_section.description")}
                  </Card.Text>
                </SimpleGrid.Item>
              </SimpleGrid>
            </SimpleGrid.Item>
            <SimpleGrid.Item
              align="end"
              col={1}
              htmlProps={{
                style: {
                  minWidth: "0",
                },
              }}
            >
              <Carousel gap="18px">
                <Carousel.Slide id="1">
                  <VideoPreview
                    height="187px"
                    previewSrc="https://i.ytimg.com/vi/lf5INeETRa0/maxresdefault.jpg"
                    rounded
                    src="https://youtu.be/lf5INeETRa0"
                    width="330px"
                  >
                    <VideoPreview.Icon
                      color="#FFFFFF"
                      size="50px"
                      variant="play"
                    />
                  </VideoPreview>
                </Carousel.Slide>
                <Carousel.Slide id="2">
                  <VideoPreview
                    height="187px"
                    rounded
                    src="https://youtu.be/kUGjq2wAZ-k?si=9hrYFfh6vD_uSIos"
                    width="330px"
                  >
                    <VideoPreview.Icon
                      color="#FFFFFF"
                      size="50px"
                      variant="play"
                    />
                  </VideoPreview>
                </Carousel.Slide>
                <Carousel.Slide id="3">
                  <VideoPreview
                    height="187px"
                    rounded
                    src="https://youtu.be/67laROP-chs?si=CjAeVB2NLk60QMKZ"
                    width="330px"
                  >
                    <VideoPreview.Icon
                      color="#FFFFFF"
                      size="50px"
                      variant="play"
                    />
                  </VideoPreview>
                </Carousel.Slide>
                <Carousel.Slide id="4">
                  <VideoPreview
                    height="187px"
                    previewSrc="https://i.ytimg.com/vi/lf5INeETRa0/maxresdefault.jpg"
                    rounded
                    src="https://youtu.be/lf5INeETRa0"
                    width="330px"
                  >
                    <VideoPreview.Icon
                      color="#FFFFFF"
                      size="50px"
                      variant="play"
                    />
                  </VideoPreview>
                </Carousel.Slide>
              </Carousel>
            </SimpleGrid.Item>
          </SimpleGrid>
        </Card.Body>
      </Card>
      <ErrorModal message={errorTranslation("modal_error.message1")} isOpen={isOpen} close={() => setIsOpen(false)} />
    </SimpleGrid>
  );
}
