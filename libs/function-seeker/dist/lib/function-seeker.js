"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
exports.getFunctionSeeker = (sourceFunctions) => lodash_1.memoize((functionName) => {
    return sourceFunctions.reduce((acc, currentSource) => {
        const func = currentSource[functionName];
        if (func)
            return func;
        return acc;
    }, null);
});
//# sourceMappingURL=function-seeker.js.map