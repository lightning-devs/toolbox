export declare type FunctionSeeker = (functionName: string) => Function;
export declare const getFunctionSeeker: (sourceFunctions: {
    [key: string]: Function;
}[]) => any;
