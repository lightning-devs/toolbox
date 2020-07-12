import { Sequence } from './sequences.typing';
import isEmpty from 'lodash/isEmpty';
import { reduce } from 'awaity/fp';
import { getFunctionSeeker, FunctionSeeker } from '@lightning-devs/function-seeker';


/**
 * This is a composer function capable of handle those functions that return promises as result
 *
 * @param {Array<Function>} functions   Functions to be composed
 * @returns {Function}                  Composed function ready to receive an initial value
 */
function asyncCompose(...functions) {
    return initialValue => {
        const reduced = reduce(async (finalValue, currentFunction) => {
            let currentValue = currentFunction(finalValue);
            if (currentValue instanceof Promise) {
                currentValue = await currentValue;
            }
            return currentValue;
        }, initialValue);
        return reduced(functions);
    }
}

/**
 * Function capable of map using a function that returns Promises as values
 *
 * @param {Function} mapFunction                Function that will be map every element
 * @param {Array<any>} valueArray               Array to map
 * @returns {Array<any>|Promise<Array<any>>}    Returns an array of plain values or a Promise containing an array with the mapped values
 */
const map = mapFunction => valueArray => {
    const mappedValues = valueArray.map(mapFunction);
    const didItReturnPromises = mappedValues[0] instanceof Promise;
    if (didItReturnPromises) {
        return Promise.all(mappedValues);
    }
    return mappedValues;
};

/**
 * This function generate Transformers using a sequence and a functionSeeker
 *
 * @param {Sequence} sequences          An array of transformation objects
 * @param {Function} functionSeeker     A function that receives a functionName {string} and looks for it on its sources of functions
 * @returns {Promise<any>}              Returns a function that receives an initial value and transforms it using the sequence that it received as param
 */
function getTransformer(sequences: Sequence[], functionSeeker: FunctionSeeker): (any) => Promise<any> {
    const functionsToBeComposed = sequences.map((sequence: Sequence) => {
        const { type, apply } = sequence;
        const { using, params } = apply;
        const functionToApply = functionSeeker(using);
        if (!functionToApply) {
            throw new Error(`This function cannot be find ${using}, please review your sources of functions.`);
        }
        let partialFunction = functionToApply;
        if (!isEmpty(params)) {
            if (Array.isArray(params)) {
                partialFunction = functionToApply(...params);
            } else {
                partialFunction = functionToApply(params);
            }
        }
        if (type === 'map') {
            return map(partialFunction as (item) => Record<string, any>);
        }
        return partialFunction;
    });
    return asyncCompose(...functionsToBeComposed);
}

/**
 * Curried function capable of transform values to objects by using the transformations described by the sequences provided for every expected field
 *
 * @param {Function} functionSeeker     A function that receives a functionName {string} and looks for it on its sources of functions
 * @param {Object} fieldsParams        This object describes the fields that will be generated by using a sequence for every field
 * @param {any} currentValue           Value that will be used to create a new object using the fields sequences provided
 * @returns {Object}                    Object generated using the transformers created by the field sequences
 */
const getFieldsFunction = functionSeeker => fieldsParams => {
  const { fieldsSequences } = fieldsParams;

  const getFieldsTransformers = reduce(async (fieldOperators, [key, fieldDefinition]) => {
      const { sequence } = fieldDefinition;
      const transformer = !isEmpty(sequence) && (getTransformer(sequence, functionSeeker));
      const operator = async (itemValue) => {
          if (!transformer) return 'Sequence Required';
          const transformedValue = await transformer(itemValue);
          return isEmpty(transformedValue) ? '' : transformedValue;
      }
      fieldOperators[key] = operator || (() => '');
      return fieldOperators;
  }, {});

  const transformer = getFieldsTransformers(Object.entries(fieldsSequences));

  return async currentValue => {
      const fieldsTransformers = await transformer;
      const getTransformedFields = reduce(async (acc, key) => {
          acc[key] = await fieldsTransformers[key](currentValue);
          return acc;
      }, {});
      return await getTransformedFields(Object.keys(fieldsTransformers));
  }
}

/**
 * This is a 'only forward' function, that is going to be used as expression for our intern source of functions
 *
 * @param {any} returnValue   Value to be forwarded/returned
 * @returns {any}             The same value that was received as param
 */
const returns = (returnValue) => () => returnValue;

/**
 * Curried function that allows to use a Sequencer as a expression in a transformation sequence, consequently this is used as a part of an intern source of functions.
 *
 * @param {Array} sourceOfFunctions     An array with the sources of functions provided by the user
 * @param {Object} sequenceParams       An object with a sequence, required to create a transformer, and the currentValue from the sequence that is being runned in order to initiate a side sequence that will transform the current value
 * @returns {any}                       A new value generated by the transformer created using the params described before
*/
const getSequencerAsExpression = sourceOfFunctions => async (sequenceParams) => {
    const { initialValues, currentValue: sequence } = sequenceParams;
    return await getSequencer(...sourceOfFunctions)(sequence)({ initialValues });
}

/**
 * This is a curried function that works in different stages:
 * 1. Receives some sources of functions and returns a "Sequencer"
 * 2. The returned "Sequencer" receives a sequence of transformations and returns a "Transformer"
 * 3. This "Transformer" receives an initial value (the first value you described in your transformation sequence) and returns a new value transformed using the sequence you provided before
 *
 * @param {Array} sourcesOfFunctions    An array containing multiple objects whose properties' structure is a key as the function name and its value is a curried function
 * @param {Sequence} sequence           An array which contains various objects describing a transformation that will be performed in the sequence
 * @param {any} initialValue            The value that will be used to initiate the sequence of transformations
 * @returns {Promise<any>}              Using the params described before, this curried function will return a transformed value by using the sequence and the initial value
 */
export function getSequencer(...sourcesOfFunctions) {
    return (sequence) => async ({ initialValues }) => {
        try {
            const sequencerExpression = getSequencerAsExpression(sourcesOfFunctions);
            const sources = [...sourcesOfFunctions, { returns, sequencer: sequencerExpression }];
            const fields = getFieldsFunction(getFunctionSeeker(sources));
            const functionSeeker = getFunctionSeeker([...sources, { fields }]);
            const transformer = getTransformer(sequence, functionSeeker);
            return await transformer(initialValues);
        } catch (error) {
            console.error(error);
            throw error;
        }
    }
}
