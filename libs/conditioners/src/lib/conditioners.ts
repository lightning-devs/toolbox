import { getFunctionSeeker } from '@lightning-devs/function-seeker';
import { ConditionalCase, Condition, ConditionerConfig } from './conditioner.typing';
import { isEmpty, flow } from 'lodash';

type FunctionSeeker = (functionName: string) => Function

const LOG_LEVEL = {
    NONE: 'none',
    VERBOSE: 'verbose',
};

const booleanRelations = ['is', 'it'];
const andBooleanRelations = ['andIt', 'andIs'];
const orRelations = ['orIt', 'orIs'];
const negatedRelations = ['isNot', 'itDoesnt'];
const andNegatedRelations = ['andIsNot', ' andItDoesnt'];
const orNegatedRelations = ['orIsNot', 'orItDoesnt'];
const allBooleanRelations = [...booleanRelations, ...andBooleanRelations, ...orRelations];
const allNegatedRelations = [...negatedRelations, ...andNegatedRelations, ...orNegatedRelations];
const allRelations = [...allBooleanRelations, ...allNegatedRelations];
const allOrRelations = [...orRelations, ...orNegatedRelations];
const allAndRelations = [...andNegatedRelations, ...andBooleanRelations];
const paramProperties = ['to', 'this'];

/*
const logs = (func) => (...params) => {
    console.log('===> logs params: ', params);
    const val = func(...params);
    console.log('===> logs returned values', params);
    return val;
}
*/

/**
 * This function composes the cases described by a specific conditioner (when clause)
 * and returns a function capable of determine if the case is successful based on an initial value
 * 
 * @param {Condition[]} conditions          An array with the conditions that will be evaluated
 * @param {FunctionSeeker} functionSeeker       Function that receives a function's name and returns it from the sources of functions
 * @returns {Function}                          Function that receives an initial value and returns if it's true based on the conditioners provided before
 */
const getConditionalPredicate = (conditions: Condition[], functionSeeker: FunctionSeeker, { logLevel } = { logLevel: LOG_LEVEL.NONE}) => {
    if (isEmpty(conditions)) throw new Error('The "when" clause must have at least 1 conditioner.')
    const conditionersToCompose = conditions.map((condition, index) => {
        const conditionerKeys = Object.keys(condition);
        if (conditionerKeys.length > 2) throw new Error('There to many properties on the conditional case');
        if (conditionerKeys.length === 0) throw new Error('Some conditions don\'t have the right amount of parameters');
        const [relation, value] = Object.entries(condition).find(([key]) => allRelations.includes(key));
        const [, params = []] = Object.entries(condition).find(([key]) => paramProperties.includes(key)) || [];
        const functionToApply = functionSeeker(value as string) || (() => val => val);
        const partialFunction = isEmpty(params) ? functionToApply : functionToApply(...params);
        const shouldNegateBoolean = allNegatedRelations.includes(relation);
        const isOrRelation = allOrRelations.includes(relation);
        const isAndRelation = allAndRelations.includes(relation);
        return (currentParameters) => {
            const { currentBoolean, currentValue } = currentParameters;
            // if the last iteration returns "false" and the next one uses an AND boolean relation
            // it should return the current parameters
            if (!currentBoolean && isAndRelation) return currentParameters;

            const gottenBoolean = partialFunction(currentValue);
            if (typeof gottenBoolean !== 'boolean') return currentParameters;
            const actualBoolean = shouldNegateBoolean ? !gottenBoolean : gottenBoolean;
            let nextBoolean = actualBoolean;
            if (isOrRelation) nextBoolean = currentBoolean || actualBoolean;
            if (isAndRelation) nextBoolean = currentBoolean && actualBoolean;
            const nextParameters = { currentBoolean: nextBoolean, currentValue };
            if (logLevel === LOG_LEVEL.VERBOSE) {
                console.log(`===> Index: ${index}; Statement: ${JSON.stringify(condition)}; Returned Params: ${JSON.stringify(nextParameters)}`);
            }
            return nextParameters
        }
    }, []);
    return flow((currentValue) => ({ currentBoolean: false, currentValue }), ...conditionersToCompose);
}

/**
 * Curried function that returns another function capable of evaluate multiple conditional cases
 * and return the value described by the success case (the first true case)
 * 
 * @param {Array<any>} sourceFunctions                                      Sources with the functions to be used to resolve the conditional cases
 * @param {Object {cases: Array<ConditionalCase>}} conditionalSequence      An array with the boolean conditions to be evaluated and its respective return value
 * @returns {Function}                                                      This function receives an initial value and returns the value described by the first true case
 */
export const getConditioner = (conditionerConfig: ConditionerConfig) => (conditionalSequence: { cases: ConditionalCase[] }) => {
    const { sources: sourceFunctions, config: { logLevel } = { logLevel: LOG_LEVEL.NONE} } = conditionerConfig;
    const { cases: conditionalCases = [] } = conditionalSequence;
    const functionSeeker = getFunctionSeeker(sourceFunctions);
    return (initialValues) => {
        const successCase = conditionalCases.find((conditionalCase, index) => {
            const { when } = conditionalCase;
            if (when === 'fallback') return true;
            const whenPredicate = getConditionalPredicate(when, functionSeeker, { logLevel });
            const { currentBoolean } = whenPredicate(initialValues);
            if (logLevel === LOG_LEVEL.VERBOSE) {
                console.log(`Index: ${index}; Statement: ${JSON.stringify(when)}; Is it True?: ${currentBoolean}`);
            }
            return currentBoolean;
        });
        if (isEmpty(successCase)) return null;
        if (isEmpty(successCase.returns)) throw new Error('Every condition must have a "returns" property.');
        return {
            initialValues,
            currentValue: successCase.returns,
        }
    }
}
