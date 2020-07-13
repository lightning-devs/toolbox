export interface WhenBooleanRelations {
    is: string;
    it: string;
    andIt: string;
    andIs: string;
    orIt: string;
    orIs: string;
    isNot: string;
    itDoesnt: string;
    andIsNot: string;
    andItDoesnt: string;
    orIsNot: string;
    orItDoesnt: string;
    to: string[] | number[] | boolean[] | Record<string, any>[] | Array<any>;
    this: string[] | number[] | boolean[] | Record<string, any>[] | Array<any>;
}

export type Condition = {
    readonly [K in keyof WhenBooleanRelations]: WhenBooleanRelations[K];
}

export interface ConditionalCase {
    when: Condition[] | 'fallback';
    returns: string[] | number[] | boolean[] | Record<string, any>[] | Array<any>;
}

export interface ConditionerConfig {
    sources: Array<Record<string, Function>>;
    config?: {
        logLevel: 'verbose' | 'none';
    };
}
