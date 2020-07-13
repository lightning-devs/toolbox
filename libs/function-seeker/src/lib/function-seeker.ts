import { memoize } from 'lodash';

export type FunctionSeeker = (functionName: string) => Function;

export const getFunctionSeeker = (sourceFunctions: Array<Record<string, Function>>) => memoize((functionName: string): FunctionSeeker => {
    return sourceFunctions.reduce((acc, currentSource) => {
        const func = currentSource[functionName];
        if (func) return func;
        return acc;
    }, null) as FunctionSeeker;
});
