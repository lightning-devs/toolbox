import { ConditionalCase } from '@lightning-devs/conditioners';
export interface Sequence {
    type: 'expression' | 'condition' | 'map';
    cases?: ConditionalCase[];
    apply?: {
        using: string,
        params?: string | number | boolean | Record<string, any> | Array<any>
    };
}
