import { ConditionalCase } from './conditioner.typing';
/**
 * Curried function that returns another function capable of evaluate multiple conditional cases
 * and return the value described by the success case (the first true case)
 *
 * @param {Array<any>} sourceFunctions                                      Sources with the functions to be used to resolve the conditional cases
 * @param {Object {cases: Array<ConditionalCase>}} conditionalSequence      An array with the boolean conditions to be evaluated and its respective return value
 * @returns {Function}                                                      This function receives an initial value and returns the value described by the first true case
 */
export declare const getConditioner: (...sourceFunctions: any[]) => (conditionalSequence: {
    cases: ConditionalCase[];
}) => (initialValues: any) => {
    initialValues: any;
    currentValue: any;
};
