import {SerialNumber} from "../hooks/useFetchConfiguration.ts";
import {SelectOption} from "@stelsolutions/stelorder-catalog/dist/components/form/form-select/form-select-types";

export default class SerialNumberUtils {
    private constructor() {
    }

     static mapSnOptions(
        sns: SerialNumber[] | undefined
    ): SelectOption[] | undefined {
        if (!sns) return undefined;
        return sns.map((sn) => ({
            label: `${sn.name} (${sn.prefix})`,
            value: `${sn.id}`,
        }));
    }

    static fetchSnOption({
                               snId,
                               sns,
                           }: {
        snId: number | null;
        sns: SerialNumber[];
    }): SelectOption | undefined {
        const value = snId;
        if (!value) return undefined;
        return {
            label: `${sns.find((sn) => sn.id === value)?.name} ${
                (() => {
                    const prefix = sns.find((sn) => sn.id === value)?.prefix;
                    return prefix ? `(${prefix})` : "";
                })()
            }`,
            value: `${value}`,
        };
    }


}