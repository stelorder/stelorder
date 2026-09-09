import {useCategorySelection} from "./useCategorySelection";
import {Category} from "./category";
import React, {RefObject, useCallback, useEffect} from "react";
import {Form} from "@stelsolutions/stelorder-catalog";
import {usePublishProducts} from "../../../../hooks/360/usePublishProducts.ts";
import {useTranslation} from "react-i18next";

type FormSelectCategoriesProps = {
    categories: Category[];
    onComplete?: (eventId: string) => void;
    onError?: () => void;
    submitRef: RefObject<HTMLButtonElement | null>;
    canNotSubmit?: (isLoading: boolean) => void;
    handleExceededProductLimit: (exceeded: boolean) => void;
    maxProductsSync: number;
};

export function FormSelectCategories({ categories, onComplete, onError, submitRef, canNotSubmit, maxProductsSync, handleExceededProductLimit }: FormSelectCategoriesProps) {
    const {
        selectedProductIds,
        allProductIds,
        displayOption,
        toggleItem,
        toggleSelectAll,
        getCheckboxProps,
    } = useCategorySelection(categories);

    const { t } = useTranslation('configuration');

    const checkboxRef = useCallback(
        (el: HTMLInputElement | null, id: string) => {
            if (el) el.indeterminate = getCheckboxProps(id).indeterminate;
        },
        [getCheckboxProps],
    );

    const { publishProduct, isLoadingPublished } = usePublishProducts({
        maxProducts: maxProductsSync,
        productIds: selectedProductIds,
        onComplete,
        onError
    });

    useEffect(() => {
        if (canNotSubmit) {
            canNotSubmit(isLoadingPublished || selectedProductIds.size === 0);
        }
    }, [isLoadingPublished, canNotSubmit, selectedProductIds]);

    useEffect(() => {
        if (submitRef.current) {
            submitRef.current.onclick = () => {
                if (isLoadingPublished) return;
                publishProduct()
            };
        }
    }, [publishProduct, isLoadingPublished, submitRef]);

    useEffect(() => {
        handleExceededProductLimit(selectedProductIds.size > maxProductsSync);
    }, [maxProductsSync, handleExceededProductLimit, selectedProductIds]);

    const renderCategory = (cat: Category, level = 0) => (
        <React.Fragment key={cat.value}>
            <Form.Select.Item
                value={cat.value}
                searchValue={cat.label}
                label={
                    <label
                        htmlFor={`cat-chk-${cat.value}`}
                        style={{ fontWeight: level === 0 ? 600 : 400 }}
                    >
                        {cat.label} ({cat.productIds.length})
                    </label>
                }
                clickable={false}
                startAdornment={
                    <Form.Checkbox
                        id={`cat-chk-${cat.value}`}
                        labelGap={0}
                        htmlProps={{
                            checked: getCheckboxProps(cat.value).checked,
                            ref: (el: HTMLInputElement | null) => checkboxRef(el, cat.value),
                            onClick: (e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation(),
                            onChange: () => toggleItem(cat.value),
                        }}
                    />
                }
            />
            {cat.children?.length ? (
                <Form.Select.List dividers={false}>
                    {cat.children.map((child) => renderCategory(child, level + 1))}
                </Form.Select.List>
            ) : null}
        </React.Fragment>
    );

    return (
        <Form.Group>
            <Form.Label htmlProps={{ htmlFor: "multi-category-select" }}>
                {t("select_category_modal.select_label")}
            </Form.Label>
            <Form.Select
                optionValue={displayOption}
                handleChange={() => {}}
                defaultOption={{ label: `${t("select_category_modal.select_placeholder")}...`, value: "" }}
                htmlProps={{
                    name: "multi-category-select",
                    id: "multi-category-select",
                }}
                placeholderSearch={t("select_category_modal.search_placeholder")}
                noResultsLabel={t("select_category_modal.no_categories")}
                scrollable={true}
                searchable={true}
                size="lg"
                dropdownMaxWidth="400px"
            >
                <Form.Select.List>
                    <Form.Select.Item
                        value="__select_all__"
                        searchValue={t("select_category_modal.select_all")}
                        label={<label htmlFor="cat-chk-select-all">{t("select_category_modal.select_all")}</label>}
                        clickable={false}
                        startAdornment={
                            <Form.Checkbox
                                labelGap={0}
                                id="cat-chk-select-all"
                                htmlProps={{
                                    checked:
                                        selectedProductIds.size === allProductIds.length &&
                                        allProductIds.length > 0,
                                    ref: (el: HTMLInputElement | null) => checkboxRef(el, "__all__"),
                                    onClick: (e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation(),
                                    onChange: () => toggleSelectAll(),
                                }}
                            />
                        }
                    />

                    {categories.length > 0 ? (
                        categories.map((parent) => renderCategory(parent))
                    ) : (
                        <Form.Select.Item
                            value="__empty__"
                            searchValue={t("select_category_modal.no_categories")}
                            label={<span>{t("select_category_modal.no_categories")}</span>}
                            clickable={false}
                        />
                    )}
                </Form.Select.List>
            </Form.Select>
        </Form.Group>
    );
}
