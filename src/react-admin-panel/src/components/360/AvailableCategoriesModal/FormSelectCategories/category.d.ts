export type Category = {
    id: number;
    parent: number;
    label: string;
    value: string;
    count?: number;
    productIds: number[];
    children?: Category[];
};