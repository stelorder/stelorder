export const SyncNameConfig: Record<string, any> = {
    'product' : {
        stock_quantity: 'Real stock',
        description: 'Description',
        price: 'Price',
        sku: 'SKU',
        global_unique_id: 'Bar code',
    },
    'customer' : {
        ['billing.phone']: 'Billing phone',
        ['billing.first_name']: 'Billing name',
        ['billing.last_name']: 'Billing surname',
        ['billing.address_2']: 'Billing address 2',
        ['billing.city']: 'Billing city',
        ['billing.state']: 'Billing state',
        ['billing.postcode']: 'Billing postcode',
        ['billing.country']: 'Billing country',
        ['shipping.phone']: 'Shipping phone',
        ['shipping.first_name']: 'Shipping name',
        ['shipping.last_name']: 'Shipping surname',
        ['shipping.address_2']: 'Shipping address 2',
        ['shipping.city']: 'Shipping city',
        ['shipping.state']: 'Shipping state',
        ['shipping.postcode']: 'Shipping postcode',
        ['shipping.country']: 'Shipping country',
    },
    
    'order' : {}
}

export const PropNameConfig: Record<string, any> = {
    'order' : {
        'sync_order' : 'Sync orders',
        'sync_order_invoices' : 'Sync invoices',
    }
}

export const defaultPropsValues: Record<string, any> = {
    order: {
        sync_order: true,
    }
}

export function getFieldsConfig({resourceName} : {resourceName: string}): Record<string, boolean> {
   return getItemConfig({resourceName}, SyncNameConfig)
}

export function getPropNameConfig({resourceName} : {resourceName: string}): Record<string, boolean> {
    return getItemConfig({resourceName}, PropNameConfig)
}

function getItemConfig({resourceName} : {resourceName: string}, map: Record<string, any>): Record<string, any> {
    const config = map[resourceName]
    if (!config) {
        return {}
    }
    return Object.keys(config).reduce((acc, key) => {
        acc[key] = false
        return acc
    }, {} as Record<string, any>)
}

export const API_URL = 'stel/verifactu/v1';