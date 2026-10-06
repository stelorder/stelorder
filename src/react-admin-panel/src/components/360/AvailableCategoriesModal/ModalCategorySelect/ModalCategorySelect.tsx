import {ModalProps} from "@stelsolutions/stelorder-catalog/dist/components/modal/modal";
import {useCallback, useContext, useMemo, useRef, useState} from "react";
import {
    Alert,
    Button,
    Icon,
    IntegrationsThemeType,
    Modal,
    SimpleGrid,
    Spinner,
    Title
} from "@stelsolutions/stelorder-catalog";
import {styled, useTheme} from "styled-components";
import {FormSelectCategories} from "../FormSelectCategories/FormSelectCategories.tsx";
import {RootContext} from "../../../../context/RootContext/RootContext.context.tsx";
import {useFetchAvailableProductCategories} from "../../../../hooks/360/useFetchAvailableProductCategories";
import {useTranslation} from "react-i18next";
import {Category} from "../FormSelectCategories/category";
import {useErrorContext} from "../../../../context/ErrorContext/ErrorContext.tsx";

type ModalCategorySelectProps = Pick<
    ModalProps,
    "isOpen" | "isCentered" | "fade" | "animationDurationSec"
> & {
    onComplete?: (eventId: string | null) => void;
};

const Container = styled.div`
  &, & *, & *::before, & *::after {
    box-sizing: content-box;
  }
`;

const MAX_PRODUCTS_SYNC = 500;

const getTotalProductsFromCategories = (categories: Category[]) => {
    const finalCats = new Set<number>();
    const run = (cats: Category[]) => {
        for (const category of cats) {
            category.productIds.forEach((id) => {finalCats.add(id)})
            if (category.children && category.children.length > 0) {
                run(category.children);
            }
        }
    }
    run(categories);

    return finalCats.size;
}

export function ModalCategorySelect({
                                 isOpen,
                                 isCentered,
                                 fade,
                                 animationDurationSec,
                                 onComplete: onCompleteCallback,
                             }: ModalCategorySelectProps) {
    const [open, setOpen] = useState<boolean>(isOpen);
    const [canNotSubmit, setCanNotSubmit] = useState<boolean>(true);
    const [isLoadingPublishProducts, setIsLoadingPublishProducts] = useState<boolean>(false);
    const [exceededProductLimit, setExceededProductLimit] = useState<boolean>(false);
    const { root } = useContext(RootContext) || { root: document.body };
    const { showErrorModal } = useErrorContext();
    const theme = useTheme() as IntegrationsThemeType;
    const { categories, isLoading } = useFetchAvailableProductCategories({
        onError: showErrorModal,
    });
    const { t } = useTranslation('configuration');
    const totalProducts = useMemo(() => {
        if (isLoading || !categories) return undefined;
        return getTotalProductsFromCategories(categories);
    }, [categories, isLoading]);

    const onComplete = useCallback((eventId: string) => {
        setOpen(false);
        setCanNotSubmit(true);
        if (onCompleteCallback) {
            onCompleteCallback(eventId);
        }
    }, [setOpen, onCompleteCallback]);
    const onError = useCallback((err?: Record<string, unknown> | undefined) => {
        setOpen(false);
        setCanNotSubmit(true);
        const errorCode = Boolean(err) && typeof err === "object" && Boolean(err.code) ? String(err.code) : undefined;
        setTimeout(() => showErrorModal(errorCode), (animationDurationSec || 0.3)*1000);
    }, [showErrorModal, animationDurationSec]);

    const handleCanNotSubmit = useCallback((isLoading: boolean) => {
        if (!isLoading && !open) {
            return;
        } else if (isLoading && open) {
            setCanNotSubmit(true);
        }
        setTimeout(() => setCanNotSubmit(isLoading), (animationDurationSec || 0.3)*1000);
    }, [animationDurationSec, open]);


    const submitBtnRef = useRef<HTMLButtonElement>(null);

    return (
        <>
            <SimpleGrid itemsPerLine={2} gap={10} alignY={"center"}>
                <SimpleGrid.Item col={"auto"}>
                    {totalProducts !== undefined && (
                        <span>{totalProducts} {t("select_category_modal.products_no_sync")}</span>
                    )}
                </SimpleGrid.Item>

                <SimpleGrid.Item col={"auto"}>
                    <Button variant="lightBlue"

                            htmlProps={{
                                disabled: totalProducts === undefined,
                                onClick: (e) => {
                                    e.preventDefault();
                                    setOpen(true);
                                    e.stopPropagation();
                                },
                                style: {
                                    height: "28px",
                                }
                            }}
                    >

                        <Icon variant="automatic-task" /> {t("product_sync_section.update_now")}
                    </Button>
                </SimpleGrid.Item>
            </SimpleGrid>

            <Modal
                isOpen={open}
                isCentered={isCentered ?? true}
                fade={fade ?? true}
                animationDurationSec={animationDurationSec ?? 0.3}
                showIn={root}
                showCloseButton
                onClose={() => setOpen(false)}
                htmlProps={{
                    as: "section",
                    "aria-label": t("select_category_modal.title"),
                    style: {
                        borderRadius: "20px",
                        minWidth: "466px",
                    },
                }}
            >
                <SimpleGrid direction="column" gap={20}>
                    <SimpleGrid.Item col="auto" htmlProps={{ as: "header" }}>
                        <Title
                            htmlProps={{
                                as: "h1",

                                style: {
                                    ...theme.fonts.titleXl500,
                                    lineHeight: "110%",
                                },
                            }}
                            textAlign="left"
                            variant="primary"
                        >
                            {t("select_category_modal.title")}
                        </Title>
                    </SimpleGrid.Item>
                    <SimpleGrid.Item col="auto">
                        {
                            isLoading || !categories ? <Spinner size={40} /> :
                            <FormSelectCategories
                                maxProductsSync={MAX_PRODUCTS_SYNC}
                                handleExceededProductLimit={setExceededProductLimit}
                                categories={categories}
                                onComplete={onComplete}
                                onError={onError}
                                canNotSubmit={handleCanNotSubmit}
                                submitRef={submitBtnRef}
                                handleLoadingPublishProducts={setIsLoadingPublishProducts}
                            />
                        }
                    </SimpleGrid.Item>

                    <SimpleGrid.Item col="auto" htmlProps={{ style: { width: "100%" } }}>
                        <Button
                            size="xl"
                            variant="secondary"
                            htmlProps={{
                                disabled: canNotSubmit,
                                ref: submitBtnRef,
                                style: {
                                    width: "100%",
                                    ...theme.fonts.h1500,
                                },
                            }}
                        >
                            { isLoadingPublishProducts ? t("select_category_modal.btn_accept_loading") :
                                t("select_category_modal.btn_accept")
                            }
                        </Button>
                    </SimpleGrid.Item>

                    <>
                        {exceededProductLimit && (
                            <SimpleGrid.Item col="auto" >

                                <Container>
                                    <Alert
                                        variant="warning"
                                        showCloseButton={false}
                                        showIcon
                                        closeAriaLabel="Cerrar"
                                        htmlProps={{
                                            style: {
                                                width: "auto"
                                            },
                                        }}
                                    >
                                        {t("select_category_modal.alert.1")} <strong>{MAX_PRODUCTS_SYNC}</strong>. {t("select_category_modal.alert.2")} <strong>{MAX_PRODUCTS_SYNC}</strong> {t("select_category_modal.alert.3")}
                                    </Alert>

                                </Container>
                            </SimpleGrid.Item>
                        )}
                    </>
                </SimpleGrid>
            </Modal>
        </>
    );
}