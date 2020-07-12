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
export declare function getSequencer(...sourcesOfFunctions: any[]): (sequence: any) => ({ initialValues }: {
    initialValues: any;
}) => Promise<any>;
