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
    to: any[];
    this: any[];
}

export type Conditioner = {
    readonly [K in keyof WhenBooleanRelations]: WhenBooleanRelations[K];
}

export interface ConditionalCase {
    when: Conditioner[] | 'fallback';
    returns: any;
}