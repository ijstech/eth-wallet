export interface IEventBusRegistry {
    id: number;
    event: string;
    unregister: () => void;
}
export interface ICallable {
    [key: string]: Function;
}
export interface ISubscriber {
    [key: string]: ICallable;
}
export interface IEventBus {
    dispatch<T>(event: string, arg?: T): void;
    register(sender: any, event: string, callback: Function): IEventBusRegistry;
}
export declare class EventBus implements IEventBus {
    private subscribers;
    private static nextId;
    private static instance?;
    private idEventMap;
    private constructor();
    static getInstance(): EventBus;
    dispatch<T>(event: string, arg?: T): void;
    register(sender: any, event: string, callback: Function): IEventBusRegistry;
    unregister(id: number): void;
    private getNextId;
}
