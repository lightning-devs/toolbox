import { ConditionalCase } from '@lightning/conditioners';

export interface Sequence {
    type: 'expression' | 'condition' | 'map';
    cases?: ConditionalCase[];
    apply?: {
        using: string,
        params?: any[]
    };
}
