export type StringKeyMap = { [key: string]: any }

export enum Operation {
    INSERT = 'INSERT',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
}

export interface Event {
    timestamp: string
    operation: Operation
    schema: string
    table: string
    data: StringKeyMap
    columnNamesChanged?: string[]
}

export interface TableSub {
    schema: string
    table: string
    buffer: Event[]
    processEvents: any
}
