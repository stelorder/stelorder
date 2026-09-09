import {Category} from "./category";
import {useCallback, useMemo, useState} from "react";
import {SelectOption} from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";

function buildCategoryMap(categories: Category[]) {
    const map = new Map<string, Category>();
    const walk = (nodes: Category[] = []) => {
        nodes.forEach((n) => {
            map.set(n.value, n);
            if (n.children?.length) walk(n.children);
        });
    };
    walk(categories);
    return map;
}

export function useCategorySelection(categories: Category[]) {
    const [selectedProductCategories, setSelectedProductCategories] = useState<Set<Category>>(new Set());

    const categoryMap = useMemo(() => buildCategoryMap(categories), [categories]);

    const allProductIds = useMemo(() => {
        const set = new Set<number>();
        categoryMap.forEach((cat) => {
            (cat.productIds || []).forEach((id) => set.add(id));
        });
        return Array.from(set);
    }, [categoryMap]);

    const selectedProductIds = useMemo(() =>
        new Set([...selectedProductCategories]
            .flatMap(cat => cat.productIds || [])), [selectedProductCategories]);

    const displayOption: SelectOption | undefined = useMemo(() => {
        if (selectedProductIds.size === 0) return undefined;
        return {
            label: `${selectedProductIds.size} productos seleccionados`,
            value: "__multi__",
        };
    }, [selectedProductIds]);

    const toggleItem = useCallback(
        (value: string) => {
            setSelectedProductCategories((prev) => {
                const next = new Set(prev);
                const cat = categoryMap.get(value);
                if (!cat) return next;
                if (next.has(cat)) {
                    next.delete(cat);
                } else {
                    next.add(cat);
                }
                return next;
            });
        },
        [categoryMap],
    );

    const toggleSelectAll = useCallback(() => {
        setSelectedProductCategories((prev) =>
            prev.size === categoryMap.size ? new Set() : new Set(categoryMap.values())
        );
    }, [categoryMap]);

    const getCheckboxProps = useCallback(
        (id: string) => {
            let result: { checked: boolean; indeterminate: boolean } = { checked: false, indeterminate: false };
            if (id === "__all__") {
                result = {
                    checked: selectedProductCategories.size === categoryMap.size,
                    indeterminate: false
                }
            } else {
                result = {
                    checked: selectedProductCategories.has(categoryMap.get(id)!),
                    indeterminate: false
                }
            }

            return result;
        },
        [categoryMap, selectedProductCategories],
    );

    return {
        selectedProductIds,
        allProductIds,
        displayOption,
        toggleItem,
        toggleSelectAll,
        getCheckboxProps,
    };
}
