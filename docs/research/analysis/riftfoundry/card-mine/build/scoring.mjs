var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.cjs
var require_util = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getParsedType = exports.ZodParsedType = exports.objectUtil = exports.util = void 0;
    var util;
    (function(util2) {
      util2.assertEqual = (_) => {
      };
      function assertIs(_arg) {
      }
      util2.assertIs = assertIs;
      function assertNever(_x) {
        throw new Error();
      }
      util2.assertNever = assertNever;
      util2.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
          obj[item] = item;
        }
        return obj;
      };
      util2.getValidEnumValues = (obj) => {
        const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
          filtered[k] = obj[k];
        }
        return util2.objectValues(filtered);
      };
      util2.objectValues = (obj) => {
        return util2.objectKeys(obj).map(function(e) {
          return obj[e];
        });
      };
      util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
        const keys = [];
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            keys.push(key);
          }
        }
        return keys;
      };
      util2.find = (arr, checker) => {
        for (const item of arr) {
          if (checker(item))
            return item;
        }
        return void 0;
      };
      util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
      function joinValues(array, separator = " | ") {
        return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
      }
      util2.joinValues = joinValues;
      util2.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
    })(util || (exports.util = util = {}));
    var objectUtil;
    (function(objectUtil2) {
      objectUtil2.mergeShapes = (first, second) => {
        return {
          ...first,
          ...second
          // second overwrites first
        };
      };
    })(objectUtil || (exports.objectUtil = objectUtil = {}));
    exports.ZodParsedType = util.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]);
    var getParsedType = (data) => {
      const t = typeof data;
      switch (t) {
        case "undefined":
          return exports.ZodParsedType.undefined;
        case "string":
          return exports.ZodParsedType.string;
        case "number":
          return Number.isNaN(data) ? exports.ZodParsedType.nan : exports.ZodParsedType.number;
        case "boolean":
          return exports.ZodParsedType.boolean;
        case "function":
          return exports.ZodParsedType.function;
        case "bigint":
          return exports.ZodParsedType.bigint;
        case "symbol":
          return exports.ZodParsedType.symbol;
        case "object":
          if (Array.isArray(data)) {
            return exports.ZodParsedType.array;
          }
          if (data === null) {
            return exports.ZodParsedType.null;
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return exports.ZodParsedType.promise;
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return exports.ZodParsedType.map;
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return exports.ZodParsedType.set;
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return exports.ZodParsedType.date;
          }
          return exports.ZodParsedType.object;
        default:
          return exports.ZodParsedType.unknown;
      }
    };
    exports.getParsedType = getParsedType;
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.cjs
var require_ZodError = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.ZodError = exports.quotelessJson = exports.ZodIssueCode = void 0;
    var util_js_1 = require_util();
    exports.ZodIssueCode = util_js_1.util.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite"
    ]);
    var quotelessJson = (obj) => {
      const json = JSON.stringify(obj, null, 2);
      return json.replace(/"([^"]+)":/g, "$1:");
    };
    exports.quotelessJson = quotelessJson;
    var ZodError = class _ZodError extends Error {
      get errors() {
        return this.issues;
      }
      constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
          this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
          this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(this, actualProto);
        } else {
          this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
          for (const issue of error.issues) {
            if (issue.code === "invalid_union") {
              issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
              processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
              processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i = 0;
              while (i < issue.path.length) {
                const el = issue.path[i];
                const terminal = i === issue.path.length - 1;
                if (!terminal) {
                  curr[el] = curr[el] || { _errors: [] };
                } else {
                  curr[el] = curr[el] || { _errors: [] };
                  curr[el]._errors.push(mapper(issue));
                }
                curr = curr[el];
                i++;
              }
            }
          }
        };
        processError(this);
        return fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof _ZodError)) {
          throw new Error(`Not a ZodError: ${value}`);
        }
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util_js_1.util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
          if (sub.path.length > 0) {
            const firstEl = sub.path[0];
            fieldErrors[firstEl] = fieldErrors[firstEl] || [];
            fieldErrors[firstEl].push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      get formErrors() {
        return this.flatten();
      }
    };
    exports.ZodError = ZodError;
    ZodError.create = (issues) => {
      const error = new ZodError(issues);
      return error;
    };
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.cjs
var require_en = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ZodError_js_1 = require_ZodError();
    var util_js_1 = require_util();
    var errorMap = (issue, _ctx) => {
      let message;
      switch (issue.code) {
        case ZodError_js_1.ZodIssueCode.invalid_type:
          if (issue.received === util_js_1.ZodParsedType.undefined) {
            message = "Required";
          } else {
            message = `Expected ${issue.expected}, received ${issue.received}`;
          }
          break;
        case ZodError_js_1.ZodIssueCode.invalid_literal:
          message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util_js_1.util.jsonStringifyReplacer)}`;
          break;
        case ZodError_js_1.ZodIssueCode.unrecognized_keys:
          message = `Unrecognized key(s) in object: ${util_js_1.util.joinValues(issue.keys, ", ")}`;
          break;
        case ZodError_js_1.ZodIssueCode.invalid_union:
          message = `Invalid input`;
          break;
        case ZodError_js_1.ZodIssueCode.invalid_union_discriminator:
          message = `Invalid discriminator value. Expected ${util_js_1.util.joinValues(issue.options)}`;
          break;
        case ZodError_js_1.ZodIssueCode.invalid_enum_value:
          message = `Invalid enum value. Expected ${util_js_1.util.joinValues(issue.options)}, received '${issue.received}'`;
          break;
        case ZodError_js_1.ZodIssueCode.invalid_arguments:
          message = `Invalid function arguments`;
          break;
        case ZodError_js_1.ZodIssueCode.invalid_return_type:
          message = `Invalid function return type`;
          break;
        case ZodError_js_1.ZodIssueCode.invalid_date:
          message = `Invalid date`;
          break;
        case ZodError_js_1.ZodIssueCode.invalid_string:
          if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
              message = `Invalid input: must include "${issue.validation.includes}"`;
              if (typeof issue.validation.position === "number") {
                message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
              }
            } else if ("startsWith" in issue.validation) {
              message = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
              message = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
              util_js_1.util.assertNever(issue.validation);
            }
          } else if (issue.validation !== "regex") {
            message = `Invalid ${issue.validation}`;
          } else {
            message = "Invalid";
          }
          break;
        case ZodError_js_1.ZodIssueCode.too_small:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "bigint")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
          else
            message = "Invalid input";
          break;
        case ZodError_js_1.ZodIssueCode.too_big:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "bigint")
            message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
          else
            message = "Invalid input";
          break;
        case ZodError_js_1.ZodIssueCode.custom:
          message = `Invalid input`;
          break;
        case ZodError_js_1.ZodIssueCode.invalid_intersection_types:
          message = `Intersection results could not be merged`;
          break;
        case ZodError_js_1.ZodIssueCode.not_multiple_of:
          message = `Number must be a multiple of ${issue.multipleOf}`;
          break;
        case ZodError_js_1.ZodIssueCode.not_finite:
          message = "Number must be finite";
          break;
        default:
          message = _ctx.defaultError;
          util_js_1.util.assertNever(issue);
      }
      return { message };
    };
    exports.default = errorMap;
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.cjs
var require_errors = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.cjs"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.defaultErrorMap = void 0;
    exports.setErrorMap = setErrorMap;
    exports.getErrorMap = getErrorMap;
    var en_js_1 = __importDefault(require_en());
    exports.defaultErrorMap = en_js_1.default;
    var overrideErrorMap = en_js_1.default;
    function setErrorMap(map) {
      overrideErrorMap = map;
    }
    function getErrorMap() {
      return overrideErrorMap;
    }
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.cjs
var require_parseUtil = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.cjs"(exports) {
    "use strict";
    var __importDefault = exports && exports.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.isAsync = exports.isValid = exports.isDirty = exports.isAborted = exports.OK = exports.DIRTY = exports.INVALID = exports.ParseStatus = exports.EMPTY_PATH = exports.makeIssue = void 0;
    exports.addIssueToContext = addIssueToContext;
    var errors_js_1 = require_errors();
    var en_js_1 = __importDefault(require_en());
    var makeIssue = (params) => {
      const { data, path, errorMaps, issueData } = params;
      const fullPath = [...path, ...issueData.path || []];
      const fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (issueData.message !== void 0) {
        return {
          ...issueData,
          path: fullPath,
          message: issueData.message
        };
      }
      let errorMessage = "";
      const maps = errorMaps.filter((m) => !!m).slice().reverse();
      for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
      }
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    };
    exports.makeIssue = makeIssue;
    exports.EMPTY_PATH = [];
    function addIssueToContext(ctx, issueData) {
      const overrideMap = (0, errors_js_1.getErrorMap)();
      const issue = (0, exports.makeIssue)({
        issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          // contextual error map is first priority
          ctx.schemaErrorMap,
          // then schema-bound map if available
          overrideMap,
          // then global override map
          overrideMap === en_js_1.default ? void 0 : en_js_1.default
          // then global default map
        ].filter((x) => !!x)
      });
      ctx.common.issues.push(issue);
    }
    var ParseStatus = class _ParseStatus {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        if (this.value === "valid")
          this.value = "dirty";
      }
      abort() {
        if (this.value !== "aborted")
          this.value = "aborted";
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
          if (s.status === "aborted")
            return exports.INVALID;
          if (s.status === "dirty")
            status.dirty();
          arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return _ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const { key, value } = pair;
          if (key.status === "aborted")
            return exports.INVALID;
          if (value.status === "aborted")
            return exports.INVALID;
          if (key.status === "dirty")
            status.dirty();
          if (value.status === "dirty")
            status.dirty();
          if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
          }
        }
        return { status: status.value, value: finalObject };
      }
    };
    exports.ParseStatus = ParseStatus;
    exports.INVALID = Object.freeze({
      status: "aborted"
    });
    var DIRTY = (value) => ({ status: "dirty", value });
    exports.DIRTY = DIRTY;
    var OK = (value) => ({ status: "valid", value });
    exports.OK = OK;
    var isAborted = (x) => x.status === "aborted";
    exports.isAborted = isAborted;
    var isDirty = (x) => x.status === "dirty";
    exports.isDirty = isDirty;
    var isValid = (x) => x.status === "valid";
    exports.isValid = isValid;
    var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
    exports.isAsync = isAsync;
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/typeAliases.cjs
var require_typeAliases = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/typeAliases.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.cjs
var require_errorUtil = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.errorUtil = void 0;
    var errorUtil;
    (function(errorUtil2) {
      errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
      errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
    })(errorUtil || (exports.errorUtil = errorUtil = {}));
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.cjs
var require_types = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.cjs"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.discriminatedUnion = exports.date = exports.boolean = exports.bigint = exports.array = exports.any = exports.coerce = exports.ZodFirstPartyTypeKind = exports.late = exports.ZodSchema = exports.Schema = exports.ZodReadonly = exports.ZodPipeline = exports.ZodBranded = exports.BRAND = exports.ZodNaN = exports.ZodCatch = exports.ZodDefault = exports.ZodNullable = exports.ZodOptional = exports.ZodTransformer = exports.ZodEffects = exports.ZodPromise = exports.ZodNativeEnum = exports.ZodEnum = exports.ZodLiteral = exports.ZodLazy = exports.ZodFunction = exports.ZodSet = exports.ZodMap = exports.ZodRecord = exports.ZodTuple = exports.ZodIntersection = exports.ZodDiscriminatedUnion = exports.ZodUnion = exports.ZodObject = exports.ZodArray = exports.ZodVoid = exports.ZodNever = exports.ZodUnknown = exports.ZodAny = exports.ZodNull = exports.ZodUndefined = exports.ZodSymbol = exports.ZodDate = exports.ZodBoolean = exports.ZodBigInt = exports.ZodNumber = exports.ZodString = exports.ZodType = void 0;
    exports.NEVER = exports.void = exports.unknown = exports.union = exports.undefined = exports.tuple = exports.transformer = exports.symbol = exports.string = exports.strictObject = exports.set = exports.record = exports.promise = exports.preprocess = exports.pipeline = exports.ostring = exports.optional = exports.onumber = exports.oboolean = exports.object = exports.number = exports.nullable = exports.null = exports.never = exports.nativeEnum = exports.nan = exports.map = exports.literal = exports.lazy = exports.intersection = exports.instanceof = exports.function = exports.enum = exports.effect = void 0;
    exports.datetimeRegex = datetimeRegex;
    exports.custom = custom;
    var ZodError_js_1 = require_ZodError();
    var errors_js_1 = require_errors();
    var errorUtil_js_1 = require_errorUtil();
    var parseUtil_js_1 = require_parseUtil();
    var util_js_1 = require_util();
    var ParseInputLazyPath = class {
      constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
      }
      get path() {
        if (!this._cachedPath.length) {
          if (Array.isArray(this._key)) {
            this._cachedPath.push(...this._path, ...this._key);
          } else {
            this._cachedPath.push(...this._path, this._key);
          }
        }
        return this._cachedPath;
      }
    };
    var handleResult = (ctx, result) => {
      if ((0, parseUtil_js_1.isValid)(result)) {
        return { success: true, data: result.value };
      } else {
        if (!ctx.common.issues.length) {
          throw new Error("Validation failed but no issues detected.");
        }
        return {
          success: false,
          get error() {
            if (this._error)
              return this._error;
            const error = new ZodError_js_1.ZodError(ctx.common.issues);
            this._error = error;
            return this._error;
          }
        };
      }
    };
    function processCreateParams(params) {
      if (!params)
        return {};
      const { errorMap, invalid_type_error, required_error, description } = params;
      if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
      }
      if (errorMap)
        return { errorMap, description };
      const customMap = (iss, ctx) => {
        const { message } = params;
        if (iss.code === "invalid_enum_value") {
          return { message: message ?? ctx.defaultError };
        }
        if (typeof ctx.data === "undefined") {
          return { message: message ?? required_error ?? ctx.defaultError };
        }
        if (iss.code !== "invalid_type")
          return { message: ctx.defaultError };
        return { message: message ?? invalid_type_error ?? ctx.defaultError };
      };
      return { errorMap: customMap, description };
    }
    var ZodType = class {
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return (0, util_js_1.getParsedType)(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: (0, util_js_1.getParsedType)(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new parseUtil_js_1.ParseStatus(),
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: (0, util_js_1.getParsedType)(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if ((0, parseUtil_js_1.isAsync)(result)) {
          throw new Error("Synchronous parse encountered promise.");
        }
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        const ctx = {
          common: {
            issues: [],
            async: params?.async ?? false,
            contextualErrorMap: params?.errorMap
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: (0, util_js_1.getParsedType)(data)
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
      }
      "~validate"(data) {
        const ctx = {
          common: {
            issues: [],
            async: !!this["~standard"].async
          },
          path: [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: (0, util_js_1.getParsedType)(data)
        };
        if (!this["~standard"].async) {
          try {
            const result = this._parseSync({ data, path: [], parent: ctx });
            return (0, parseUtil_js_1.isValid)(result) ? {
              value: result.value
            } : {
              issues: ctx.common.issues
            };
          } catch (err) {
            if (err?.message?.toLowerCase()?.includes("encountered")) {
              this["~standard"].async = true;
            }
            ctx.common = {
              issues: [],
              async: true
            };
          }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => (0, parseUtil_js_1.isValid)(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        });
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: params?.errorMap,
            async: true
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: (0, util_js_1.getParsedType)(data)
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await ((0, parseUtil_js_1.isAsync)(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = (val) => {
          if (typeof message === "string" || typeof message === "undefined") {
            return { message };
          } else if (typeof message === "function") {
            return message(val);
          } else {
            return message;
          }
        };
        return this._refinement((val, ctx) => {
          const result = check(val);
          const setError = () => ctx.addIssue({
            code: ZodError_js_1.ZodIssueCode.custom,
            ...getIssueProperties(val)
          });
          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then((data) => {
              if (!data) {
                setError();
                return false;
              } else {
                return true;
              }
            });
          }
          if (!result) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
          if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
          } else {
            return true;
          }
        });
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "refinement", refinement }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      constructor(def) {
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
          version: 1,
          vendor: "zod",
          validate: (data) => this["~validate"](data)
        };
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([this, option], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "transform", transform }
        });
      }
      default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        const This = this.constructor;
        return new This({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    };
    exports.ZodType = ZodType;
    exports.Schema = ZodType;
    exports.ZodSchema = ZodType;
    var cuidRegex = /^c[^\s-]{8,}$/i;
    var cuid2Regex = /^[0-9a-z]+$/;
    var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
    var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
    var nanoidRegex = /^[a-z0-9_-]{21}$/i;
    var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    var emojiRegex;
    var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
    var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
    var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
    var dateRegex = new RegExp(`^${dateRegexSource}$`);
    function timeRegexSource(args) {
      let secondsRegexSource = `[0-5]\\d`;
      if (args.precision) {
        secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
      } else if (args.precision == null) {
        secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
      }
      const secondsQuantifier = args.precision ? "+" : "?";
      return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
    }
    function timeRegex(args) {
      return new RegExp(`^${timeRegexSource(args)}$`);
    }
    function datetimeRegex(args) {
      let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
      const opts = [];
      opts.push(args.local ? `Z?` : `Z`);
      if (args.offset)
        opts.push(`([+-]\\d{2}:?\\d{2})`);
      regex = `${regex}(${opts.join("|")})`;
      return new RegExp(`^${regex}$`);
    }
    function isValidIP(ip, version) {
      if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
      }
      if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
      }
      return false;
    }
    function isValidJWT(jwt, alg) {
      if (!jwtRegex.test(jwt))
        return false;
      try {
        const [header] = jwt.split(".");
        if (!header)
          return false;
        const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
        const decoded = JSON.parse(atob(base64));
        if (typeof decoded !== "object" || decoded === null)
          return false;
        if ("typ" in decoded && decoded?.typ !== "JWT")
          return false;
        if (!decoded.alg)
          return false;
        if (alg && decoded.alg !== alg)
          return false;
        return true;
      } catch {
        return false;
      }
    }
    function isValidCidr(ip, version) {
      if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
        return true;
      }
      if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
        return true;
      }
      return false;
    }
    var ZodString = class _ZodString extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.string) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx2, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.string,
            received: ctx2.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        const status = new parseUtil_js_1.ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.length < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.length > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              if (tooBig) {
                (0, parseUtil_js_1.addIssueToContext)(ctx, {
                  code: ZodError_js_1.ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              } else if (tooSmall) {
                (0, parseUtil_js_1.addIssueToContext)(ctx, {
                  code: ZodError_js_1.ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              }
              status.dirty();
            }
          } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "email",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "emoji") {
            if (!emojiRegex) {
              emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "emoji",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "uuid",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "nanoid",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "cuid",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "cuid2",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "ulid",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "url") {
            try {
              new URL(input.data);
            } catch {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "url",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "regex",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "trim") {
            input.data = input.data.trim();
          } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                validation: { includes: check.value, position: check.position },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
          } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
          } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                validation: { startsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                validation: { endsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                validation: "date",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                validation: "time",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "duration",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "ip",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "jwt") {
            if (!isValidJWT(input.data, check.alg)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "jwt",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cidr") {
            if (!isValidCidr(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "cidr",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "base64",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64url") {
            if (!base64urlRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                validation: "base64url",
                code: ZodError_js_1.ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util_js_1.util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
          validation,
          code: ZodError_js_1.ZodIssueCode.invalid_string,
          ...errorUtil_js_1.errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      email(message) {
        return this._addCheck({ kind: "email", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      url(message) {
        return this._addCheck({ kind: "url", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      base64url(message) {
        return this._addCheck({
          kind: "base64url",
          ...errorUtil_js_1.errorUtil.errToObj(message)
        });
      }
      jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil_js_1.errorUtil.errToObj(options) });
      }
      ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil_js_1.errorUtil.errToObj(options) });
      }
      cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil_js_1.errorUtil.errToObj(options) });
      }
      datetime(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options
          });
        }
        return this._addCheck({
          kind: "datetime",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          offset: options?.offset ?? false,
          local: options?.local ?? false,
          ...errorUtil_js_1.errorUtil.errToObj(options?.message)
        });
      }
      date(message) {
        return this._addCheck({ kind: "date", message });
      }
      time(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "time",
            precision: null,
            message: options
          });
        }
        return this._addCheck({
          kind: "time",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          ...errorUtil_js_1.errorUtil.errToObj(options?.message)
        });
      }
      duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil_js_1.errorUtil.errToObj(message) });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil_js_1.errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: options?.position,
          ...errorUtil_js_1.errorUtil.errToObj(options?.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil_js_1.errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil_js_1.errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil_js_1.errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil_js_1.errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil_js_1.errorUtil.errToObj(message)
        });
      }
      /**
       * Equivalent to `.min(1)`
       */
      nonempty(message) {
        return this.min(1, errorUtil_js_1.errorUtil.errToObj(message));
      }
      trim() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      toLowerCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toLowerCase" }]
        });
      }
      toUpperCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toUpperCase" }]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
      }
      get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
      }
      get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
      }
      get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
      }
      get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
      }
      get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
      }
      get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
      }
      get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
      }
      get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
      }
      get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
      }
      get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
      }
      get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
      }
      get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
      }
      get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
      }
      get isBase64url() {
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    exports.ZodString = ZodString;
    ZodString.create = (params) => {
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    function floatSafeRemainder(val, step) {
      const valDecCount = (val.toString().split(".")[1] || "").length;
      const stepDecCount = (step.toString().split(".")[1] || "").length;
      const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
      const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
      const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
      return valInt % stepInt / 10 ** decCount;
    }
    var ZodNumber = class _ZodNumber extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.number) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx2, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.number,
            received: ctx2.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        let ctx = void 0;
        const status = new parseUtil_js_1.ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "int") {
            if (!util_js_1.util.isInteger(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.not_finite,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util_js_1.util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil_js_1.errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil_js_1.errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil_js_1.errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil_js_1.errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodNumber({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil_js_1.errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodNumber({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: false,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: false,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: true,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: true,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: true,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil_js_1.errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: true,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util_js_1.util.isInteger(ch.value));
      }
      get isFinite() {
        let max = null;
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
          } else if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          } else if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    };
    exports.ZodNumber = ZodNumber;
    ZodNumber.create = (params) => {
      return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    var ZodBigInt = class _ZodBigInt extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
      }
      _parse(input) {
        if (this._def.coerce) {
          try {
            input.data = BigInt(input.data);
          } catch {
            return this._getInvalidInput(input);
          }
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.bigint) {
          return this._getInvalidInput(input);
        }
        let ctx = void 0;
        const status = new parseUtil_js_1.ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util_js_1.util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        (0, parseUtil_js_1.addIssueToContext)(ctx, {
          code: ZodError_js_1.ZodIssueCode.invalid_type,
          expected: util_js_1.ZodParsedType.bigint,
          received: ctx.parsedType
        });
        return parseUtil_js_1.INVALID;
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil_js_1.errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil_js_1.errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil_js_1.errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil_js_1.errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodBigInt({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil_js_1.errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodBigInt({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    exports.ZodBigInt = ZodBigInt;
    ZodBigInt.create = (params) => {
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    var ZodBoolean = class extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.boolean,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
      }
    };
    exports.ZodBoolean = ZodBoolean;
    ZodBoolean.create = (params) => {
      return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    var ZodDate = class _ZodDate extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.date) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx2, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.date,
            received: ctx2.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        if (Number.isNaN(input.data.getTime())) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx2, {
            code: ZodError_js_1.ZodIssueCode.invalid_date
          });
          return parseUtil_js_1.INVALID;
        }
        const status = new parseUtil_js_1.ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_small,
                message: check.message,
                inclusive: true,
                exact: false,
                minimum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_big,
                message: check.message,
                inclusive: true,
                exact: false,
                maximum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else {
            util_js_1.util.assertNever(check);
          }
        }
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new _ZodDate({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil_js_1.errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min != null ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max != null ? new Date(max) : null;
      }
    };
    exports.ZodDate = ZodDate;
    ZodDate.create = (params) => {
      return new ZodDate({
        checks: [],
        coerce: params?.coerce || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
      });
    };
    var ZodSymbol = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.symbol,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
      }
    };
    exports.ZodSymbol = ZodSymbol;
    ZodSymbol.create = (params) => {
      return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
      });
    };
    var ZodUndefined = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.undefined,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
      }
    };
    exports.ZodUndefined = ZodUndefined;
    ZodUndefined.create = (params) => {
      return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
      });
    };
    var ZodNull = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.null,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
      }
    };
    exports.ZodNull = ZodNull;
    ZodNull.create = (params) => {
      return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
      });
    };
    var ZodAny = class extends ZodType {
      constructor() {
        super(...arguments);
        this._any = true;
      }
      _parse(input) {
        return (0, parseUtil_js_1.OK)(input.data);
      }
    };
    exports.ZodAny = ZodAny;
    ZodAny.create = (params) => {
      return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
      });
    };
    var ZodUnknown = class extends ZodType {
      constructor() {
        super(...arguments);
        this._unknown = true;
      }
      _parse(input) {
        return (0, parseUtil_js_1.OK)(input.data);
      }
    };
    exports.ZodUnknown = ZodUnknown;
    ZodUnknown.create = (params) => {
      return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
      });
    };
    var ZodNever = class extends ZodType {
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        (0, parseUtil_js_1.addIssueToContext)(ctx, {
          code: ZodError_js_1.ZodIssueCode.invalid_type,
          expected: util_js_1.ZodParsedType.never,
          received: ctx.parsedType
        });
        return parseUtil_js_1.INVALID;
      }
    };
    exports.ZodNever = ZodNever;
    ZodNever.create = (params) => {
      return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
      });
    };
    var ZodVoid = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.void,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
      }
    };
    exports.ZodVoid = ZodVoid;
    ZodVoid.create = (params) => {
      return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
      });
    };
    var ZodArray = class _ZodArray extends ZodType {
      _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== util_js_1.ZodParsedType.array) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.array,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        if (def.exactLength !== null) {
          const tooBig = ctx.data.length > def.exactLength.value;
          const tooSmall = ctx.data.length < def.exactLength.value;
          if (tooBig || tooSmall) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
              code: tooBig ? ZodError_js_1.ZodIssueCode.too_big : ZodError_js_1.ZodIssueCode.too_small,
              minimum: tooSmall ? def.exactLength.value : void 0,
              maximum: tooBig ? def.exactLength.value : void 0,
              type: "array",
              inclusive: true,
              exact: true,
              message: def.exactLength.message
            });
            status.dirty();
          }
        }
        if (def.minLength !== null) {
          if (ctx.data.length < def.minLength.value) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
              code: ZodError_js_1.ZodIssueCode.too_small,
              minimum: def.minLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.minLength.message
            });
            status.dirty();
          }
        }
        if (def.maxLength !== null) {
          if (ctx.data.length > def.maxLength.value) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
              code: ZodError_js_1.ZodIssueCode.too_big,
              maximum: def.maxLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.maxLength.message
            });
            status.dirty();
          }
        }
        if (ctx.common.async) {
          return Promise.all([...ctx.data].map((item, i) => {
            return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
          })).then((result2) => {
            return parseUtil_js_1.ParseStatus.mergeArray(status, result2);
          });
        }
        const result = [...ctx.data].map((item, i) => {
          return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return parseUtil_js_1.ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new _ZodArray({
          ...this._def,
          minLength: { value: minLength, message: errorUtil_js_1.errorUtil.toString(message) }
        });
      }
      max(maxLength, message) {
        return new _ZodArray({
          ...this._def,
          maxLength: { value: maxLength, message: errorUtil_js_1.errorUtil.toString(message) }
        });
      }
      length(len, message) {
        return new _ZodArray({
          ...this._def,
          exactLength: { value: len, message: errorUtil_js_1.errorUtil.toString(message) }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    exports.ZodArray = ZodArray;
    ZodArray.create = (schema2, params) => {
      return new ZodArray({
        type: schema2,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
      });
    };
    function deepPartialify(schema2) {
      if (schema2 instanceof ZodObject) {
        const newShape = {};
        for (const key in schema2.shape) {
          const fieldSchema = schema2.shape[key];
          newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
          ...schema2._def,
          shape: () => newShape
        });
      } else if (schema2 instanceof ZodArray) {
        return new ZodArray({
          ...schema2._def,
          type: deepPartialify(schema2.element)
        });
      } else if (schema2 instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema2.unwrap()));
      } else if (schema2 instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema2.unwrap()));
      } else if (schema2 instanceof ZodTuple) {
        return ZodTuple.create(schema2.items.map((item) => deepPartialify(item)));
      } else {
        return schema2;
      }
    }
    var ZodObject = class _ZodObject extends ZodType {
      constructor() {
        super(...arguments);
        this._cached = null;
        this.nonstrict = this.passthrough;
        this.augment = this.extend;
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const shape = this._def.shape();
        const keys = util_js_1.util.objectKeys(shape);
        this._cached = { shape, keys };
        return this._cached;
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.object) {
          const ctx2 = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx2, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.object,
            received: ctx2.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
          for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
              extraKeys.push(key);
            }
          }
        }
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key];
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
              pairs.push({
                key: { status: "valid", value: key },
                value: { status: "valid", value: ctx.data[key] }
              });
            }
          } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
              (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.unrecognized_keys,
                keys: extraKeys
              });
              status.dirty();
            }
          } else if (unknownKeys === "strip") {
          } else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
          }
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: { status: "valid", value: key },
              value: catchall._parse(
                new ParseInputLazyPath(ctx, value, ctx.path, key)
                //, ctx.child(key), value, getParsedType(value)
              ),
              alwaysSet: key in ctx.data
            });
          }
        }
        if (ctx.common.async) {
          return Promise.resolve().then(async () => {
            const syncPairs = [];
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              syncPairs.push({
                key,
                value,
                alwaysSet: pair.alwaysSet
              });
            }
            return syncPairs;
          }).then((syncPairs) => {
            return parseUtil_js_1.ParseStatus.mergeObjectSync(status, syncPairs);
          });
        } else {
          return parseUtil_js_1.ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        errorUtil_js_1.errorUtil.errToObj;
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...message !== void 0 ? {
            errorMap: (issue, ctx) => {
              const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
              if (issue.code === "unrecognized_keys")
                return {
                  message: errorUtil_js_1.errorUtil.errToObj(message).message ?? defaultError
                };
              return {
                message: defaultError
              };
            }
          } : {}
        });
      }
      strip() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      // const AugmentFactory =
      //   <Def extends ZodObjectDef>(def: Def) =>
      //   <Augmentation extends ZodRawShape>(
      //     augmentation: Augmentation
      //   ): ZodObject<
      //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
      //     Def["unknownKeys"],
      //     Def["catchall"]
      //   > => {
      //     return new ZodObject({
      //       ...def,
      //       shape: () => ({
      //         ...def.shape(),
      //         ...augmentation,
      //       }),
      //     }) as any;
      //   };
      extend(augmentation) {
        return new _ZodObject({
          ...this._def,
          shape: () => ({
            ...this._def.shape(),
            ...augmentation
          })
        });
      }
      /**
       * Prior to zod@1.0.12 there was a bug in the
       * inferred type of merged objects. Please
       * upgrade if you are experiencing issues.
       */
      merge(merging) {
        const merged = new _ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: () => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
      }
      // merge<
      //   Incoming extends AnyZodObject,
      //   Augmentation extends Incoming["shape"],
      //   NewOutput extends {
      //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
      //       ? Augmentation[k]["_output"]
      //       : k extends keyof Output
      //       ? Output[k]
      //       : never;
      //   },
      //   NewInput extends {
      //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
      //       ? Augmentation[k]["_input"]
      //       : k extends keyof Input
      //       ? Input[k]
      //       : never;
      //   }
      // >(
      //   merging: Incoming
      // ): ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"],
      //   NewOutput,
      //   NewInput
      // > {
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      setKey(key, schema2) {
        return this.augment({ [key]: schema2 });
      }
      // merge<Incoming extends AnyZodObject>(
      //   merging: Incoming
      // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
      // ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"]
      // > {
      //   // const mergedShape = objectUtil.mergeShapes(
      //   //   this._def.shape(),
      //   //   merging._def.shape()
      //   // );
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      catchall(index) {
        return new _ZodObject({
          ...this._def,
          catchall: index
        });
      }
      pick(mask) {
        const shape = {};
        for (const key of util_js_1.util.objectKeys(mask)) {
          if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      omit(mask) {
        const shape = {};
        for (const key of util_js_1.util.objectKeys(this.shape)) {
          if (!mask[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      /**
       * @deprecated
       */
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        for (const key of util_js_1.util.objectKeys(this.shape)) {
          const fieldSchema = this.shape[key];
          if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
          } else {
            newShape[key] = fieldSchema.optional();
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      required(mask) {
        const newShape = {};
        for (const key of util_js_1.util.objectKeys(this.shape)) {
          if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
          } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
              newField = newField._def.innerType;
            }
            newShape[key] = newField;
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      keyof() {
        return createZodEnum(util_js_1.util.objectKeys(this.shape));
      }
    };
    exports.ZodObject = ZodObject;
    ZodObject.create = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.strictCreate = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.lazycreate = (shape, params) => {
      return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    var ZodUnion = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
          for (const result of results) {
            if (result.result.status === "valid") {
              return result.result;
            }
          }
          for (const result of results) {
            if (result.result.status === "dirty") {
              ctx.common.issues.push(...result.ctx.common.issues);
              return result.result;
            }
          }
          const unionErrors = results.map((result) => new ZodError_js_1.ZodError(result.ctx.common.issues));
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_union,
            unionErrors
          });
          return parseUtil_js_1.INVALID;
        }
        if (ctx.common.async) {
          return Promise.all(options.map(async (option) => {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: childCtx
              }),
              ctx: childCtx
            };
          })).then(handleResults);
        } else {
          let dirty = void 0;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            const result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if (result.status === "valid") {
              return result;
            } else if (result.status === "dirty" && !dirty) {
              dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
              issues.push(childCtx.common.issues);
            }
          }
          if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
          }
          const unionErrors = issues.map((issues2) => new ZodError_js_1.ZodError(issues2));
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_union,
            unionErrors
          });
          return parseUtil_js_1.INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    };
    exports.ZodUnion = ZodUnion;
    ZodUnion.create = (types, params) => {
      return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
      });
    };
    var getDiscriminator = (type) => {
      if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
      } else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
      } else if (type instanceof ZodLiteral) {
        return [type.value];
      } else if (type instanceof ZodEnum) {
        return type.options;
      } else if (type instanceof ZodNativeEnum) {
        return util_js_1.util.objectValues(type.enum);
      } else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
      } else if (type instanceof ZodUndefined) {
        return [void 0];
      } else if (type instanceof ZodNull) {
        return [null];
      } else if (type instanceof ZodOptional) {
        return [void 0, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
      } else {
        return [];
      }
    };
    var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.object) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.object,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [discriminator]
          });
          return parseUtil_js_1.INVALID;
        }
        if (ctx.common.async) {
          return option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        } else {
          return option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        }
      }
      get discriminator() {
        return this._def.discriminator;
      }
      get options() {
        return this._def.options;
      }
      get optionsMap() {
        return this._def.optionsMap;
      }
      /**
       * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
       * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
       * have a different value for each object in the union.
       * @param discriminator the name of the discriminator property
       * @param types an array of object schemas
       * @param params
       */
      static create(discriminator, options, params) {
        const optionsMap = /* @__PURE__ */ new Map();
        for (const type of options) {
          const discriminatorValues = getDiscriminator(type.shape[discriminator]);
          if (!discriminatorValues.length) {
            throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
          }
          for (const value of discriminatorValues) {
            if (optionsMap.has(value)) {
              throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            }
            optionsMap.set(value, type);
          }
        }
        return new _ZodDiscriminatedUnion({
          typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
          discriminator,
          options,
          optionsMap,
          ...processCreateParams(params)
        });
      }
    };
    exports.ZodDiscriminatedUnion = ZodDiscriminatedUnion;
    function mergeValues(a, b) {
      const aType = (0, util_js_1.getParsedType)(a);
      const bType = (0, util_js_1.getParsedType)(b);
      if (a === b) {
        return { valid: true, data: a };
      } else if (aType === util_js_1.ZodParsedType.object && bType === util_js_1.ZodParsedType.object) {
        const bKeys = util_js_1.util.objectKeys(b);
        const sharedKeys = util_js_1.util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
          const sharedValue = mergeValues(a[key], b[key]);
          if (!sharedValue.valid) {
            return { valid: false };
          }
          newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
      } else if (aType === util_js_1.ZodParsedType.array && bType === util_js_1.ZodParsedType.array) {
        if (a.length !== b.length) {
          return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
          const itemA = a[index];
          const itemB = b[index];
          const sharedValue = mergeValues(itemA, itemB);
          if (!sharedValue.valid) {
            return { valid: false };
          }
          newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
      } else if (aType === util_js_1.ZodParsedType.date && bType === util_js_1.ZodParsedType.date && +a === +b) {
        return { valid: true, data: a };
      } else {
        return { valid: false };
      }
    }
    var ZodIntersection = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
          if ((0, parseUtil_js_1.isAborted)(parsedLeft) || (0, parseUtil_js_1.isAborted)(parsedRight)) {
            return parseUtil_js_1.INVALID;
          }
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          if (!merged.valid) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
              code: ZodError_js_1.ZodIssueCode.invalid_intersection_types
            });
            return parseUtil_js_1.INVALID;
          }
          if ((0, parseUtil_js_1.isDirty)(parsedLeft) || (0, parseUtil_js_1.isDirty)(parsedRight)) {
            status.dirty();
          }
          return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
          return Promise.all([
            this._def.left._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            }),
            this._def.right._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            })
          ]).then(([left, right]) => handleParsed(left, right));
        } else {
          return handleParsed(this._def.left._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }), this._def.right._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }));
        }
      }
    };
    exports.ZodIntersection = ZodIntersection;
    ZodIntersection.create = (left, right, params) => {
      return new ZodIntersection({
        left,
        right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
      });
    };
    var ZodTuple = class _ZodTuple extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.array) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.array,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          return parseUtil_js_1.INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          status.dirty();
        }
        const items = [...ctx.data].map((item, itemIndex) => {
          const schema2 = this._def.items[itemIndex] || this._def.rest;
          if (!schema2)
            return null;
          return schema2._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x) => !!x);
        if (ctx.common.async) {
          return Promise.all(items).then((results) => {
            return parseUtil_js_1.ParseStatus.mergeArray(status, results);
          });
        } else {
          return parseUtil_js_1.ParseStatus.mergeArray(status, items);
        }
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new _ZodTuple({
          ...this._def,
          rest
        });
      }
    };
    exports.ZodTuple = ZodTuple;
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      }
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    var ZodRecord = class _ZodRecord extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.object) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.object,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
          pairs.push({
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
            value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (ctx.common.async) {
          return parseUtil_js_1.ParseStatus.mergeObjectAsync(status, pairs);
        } else {
          return parseUtil_js_1.ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get element() {
        return this._def.valueType;
      }
      static create(first, second, third) {
        if (second instanceof ZodType) {
          return new _ZodRecord({
            keyType: first,
            valueType: second,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(third)
          });
        }
        return new _ZodRecord({
          keyType: ZodString.create(),
          valueType: first,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(second)
        });
      }
    };
    exports.ZodRecord = ZodRecord;
    var ZodMap = class extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.map) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.map,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
          return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
          };
        });
        if (ctx.common.async) {
          const finalMap = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              if (key.status === "aborted" || value.status === "aborted") {
                return parseUtil_js_1.INVALID;
              }
              if (key.status === "dirty" || value.status === "dirty") {
                status.dirty();
              }
              finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
          });
        } else {
          const finalMap = /* @__PURE__ */ new Map();
          for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return parseUtil_js_1.INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        }
      }
    };
    exports.ZodMap = ZodMap;
    ZodMap.create = (keyType, valueType, params) => {
      return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
      });
    };
    var ZodSet = class _ZodSet extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.set) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.set,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
          if (ctx.data.size < def.minSize.value) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
              code: ZodError_js_1.ZodIssueCode.too_small,
              minimum: def.minSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.minSize.message
            });
            status.dirty();
          }
        }
        if (def.maxSize !== null) {
          if (ctx.data.size > def.maxSize.value) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
              code: ZodError_js_1.ZodIssueCode.too_big,
              maximum: def.maxSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.maxSize.message
            });
            status.dirty();
          }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements2) {
          const parsedSet = /* @__PURE__ */ new Set();
          for (const element of elements2) {
            if (element.status === "aborted")
              return parseUtil_js_1.INVALID;
            if (element.status === "dirty")
              status.dirty();
            parsedSet.add(element.value);
          }
          return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
          return Promise.all(elements).then((elements2) => finalizeSet(elements2));
        } else {
          return finalizeSet(elements);
        }
      }
      min(minSize, message) {
        return new _ZodSet({
          ...this._def,
          minSize: { value: minSize, message: errorUtil_js_1.errorUtil.toString(message) }
        });
      }
      max(maxSize, message) {
        return new _ZodSet({
          ...this._def,
          maxSize: { value: maxSize, message: errorUtil_js_1.errorUtil.toString(message) }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    exports.ZodSet = ZodSet;
    ZodSet.create = (valueType, params) => {
      return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
      });
    };
    var ZodFunction = class _ZodFunction extends ZodType {
      constructor() {
        super(...arguments);
        this.validate = this.implement;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.function) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.function,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        function makeArgsIssue(args, error) {
          return (0, parseUtil_js_1.makeIssue)({
            data: args,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, (0, errors_js_1.getErrorMap)(), errors_js_1.defaultErrorMap].filter((x) => !!x),
            issueData: {
              code: ZodError_js_1.ZodIssueCode.invalid_arguments,
              argumentsError: error
            }
          });
        }
        function makeReturnsIssue(returns, error) {
          return (0, parseUtil_js_1.makeIssue)({
            data: returns,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, (0, errors_js_1.getErrorMap)(), errors_js_1.defaultErrorMap].filter((x) => !!x),
            issueData: {
              code: ZodError_js_1.ZodIssueCode.invalid_return_type,
              returnTypeError: error
            }
          });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
          const me = this;
          return (0, parseUtil_js_1.OK)(async function(...args) {
            const error = new ZodError_js_1.ZodError([]);
            const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
              error.addIssue(makeArgsIssue(args, e));
              throw error;
            });
            const result = await Reflect.apply(fn, this, parsedArgs);
            const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
              error.addIssue(makeReturnsIssue(result, e));
              throw error;
            });
            return parsedReturns;
          });
        } else {
          const me = this;
          return (0, parseUtil_js_1.OK)(function(...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) {
              throw new ZodError_js_1.ZodError([makeArgsIssue(args, parsedArgs.error)]);
            }
            const result = Reflect.apply(fn, this, parsedArgs.data);
            const parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) {
              throw new ZodError_js_1.ZodError([makeReturnsIssue(result, parsedReturns.error)]);
            }
            return parsedReturns.data;
          });
        }
      }
      parameters() {
        return this._def.args;
      }
      returnType() {
        return this._def.returns;
      }
      args(...items) {
        return new _ZodFunction({
          ...this._def,
          args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
      }
      returns(returnType) {
        return new _ZodFunction({
          ...this._def,
          returns: returnType
        });
      }
      implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      static create(args, returns, params) {
        return new _ZodFunction({
          args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
          returns: returns || ZodUnknown.create(),
          typeName: ZodFirstPartyTypeKind.ZodFunction,
          ...processCreateParams(params)
        });
      }
    };
    exports.ZodFunction = ZodFunction;
    var ZodLazy = class extends ZodType {
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
      }
    };
    exports.ZodLazy = ZodLazy;
    ZodLazy.create = (getter, params) => {
      return new ZodLazy({
        getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
      });
    };
    var ZodLiteral = class extends ZodType {
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            received: ctx.data,
            code: ZodError_js_1.ZodIssueCode.invalid_literal,
            expected: this._def.value
          });
          return parseUtil_js_1.INVALID;
        }
        return { status: "valid", value: input.data };
      }
      get value() {
        return this._def.value;
      }
    };
    exports.ZodLiteral = ZodLiteral;
    ZodLiteral.create = (value, params) => {
      return new ZodLiteral({
        value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
      });
    };
    function createZodEnum(values, params) {
      return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params)
      });
    }
    var ZodEnum = class _ZodEnum extends ZodType {
      _parse(input) {
        if (typeof input.data !== "string") {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            expected: util_js_1.util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodError_js_1.ZodIssueCode.invalid_type
          });
          return parseUtil_js_1.INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(this._def.values);
        }
        if (!this._cache.has(input.data)) {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            received: ctx.data,
            code: ZodError_js_1.ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return _ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
          ...this._def,
          ...newDef
        });
      }
    };
    exports.ZodEnum = ZodEnum;
    ZodEnum.create = createZodEnum;
    var ZodNativeEnum = class extends ZodType {
      _parse(input) {
        const nativeEnumValues = util_js_1.util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.string && ctx.parsedType !== util_js_1.ZodParsedType.number) {
          const expectedValues = util_js_1.util.objectValues(nativeEnumValues);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            expected: util_js_1.util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodError_js_1.ZodIssueCode.invalid_type
          });
          return parseUtil_js_1.INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(util_js_1.util.getValidEnumValues(this._def.values));
        }
        if (!this._cache.has(input.data)) {
          const expectedValues = util_js_1.util.objectValues(nativeEnumValues);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            received: ctx.data,
            code: ZodError_js_1.ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
      }
      get enum() {
        return this._def.values;
      }
    };
    exports.ZodNativeEnum = ZodNativeEnum;
    ZodNativeEnum.create = (values, params) => {
      return new ZodNativeEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
      });
    };
    var ZodPromise = class extends ZodType {
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.promise && ctx.common.async === false) {
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.promise,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        const promisified = ctx.parsedType === util_js_1.ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return (0, parseUtil_js_1.OK)(promisified.then((data) => {
          return this._def.type.parseAsync(data, {
            path: ctx.path,
            errorMap: ctx.common.contextualErrorMap
          });
        }));
      }
    };
    exports.ZodPromise = ZodPromise;
    ZodPromise.create = (schema2, params) => {
      return new ZodPromise({
        type: schema2,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
      });
    };
    var ZodEffects = class extends ZodType {
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
          addIssue: (arg) => {
            (0, parseUtil_js_1.addIssueToContext)(ctx, arg);
            if (arg.fatal) {
              status.abort();
            } else {
              status.dirty();
            }
          },
          get path() {
            return ctx.path;
          }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(processed).then(async (processed2) => {
              if (status.value === "aborted")
                return parseUtil_js_1.INVALID;
              const result = await this._def.schema._parseAsync({
                data: processed2,
                path: ctx.path,
                parent: ctx
              });
              if (result.status === "aborted")
                return parseUtil_js_1.INVALID;
              if (result.status === "dirty")
                return (0, parseUtil_js_1.DIRTY)(result.value);
              if (status.value === "dirty")
                return (0, parseUtil_js_1.DIRTY)(result.value);
              return result;
            });
          } else {
            if (status.value === "aborted")
              return parseUtil_js_1.INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return parseUtil_js_1.INVALID;
            if (result.status === "dirty")
              return (0, parseUtil_js_1.DIRTY)(result.value);
            if (status.value === "dirty")
              return (0, parseUtil_js_1.DIRTY)(result.value);
            return result;
          }
        }
        if (effect.type === "refinement") {
          const executeRefinement = (acc) => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
              return Promise.resolve(result);
            }
            if (result instanceof Promise) {
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
          };
          if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inner.status === "aborted")
              return parseUtil_js_1.INVALID;
            if (inner.status === "dirty")
              status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
              if (inner.status === "aborted")
                return parseUtil_js_1.INVALID;
              if (inner.status === "dirty")
                status.dirty();
              return executeRefinement(inner.value).then(() => {
                return { status: status.value, value: inner.value };
              });
            });
          }
        }
        if (effect.type === "transform") {
          if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!(0, parseUtil_js_1.isValid)(base))
              return parseUtil_js_1.INVALID;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
              throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
              if (!(0, parseUtil_js_1.isValid)(base))
                return parseUtil_js_1.INVALID;
              return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
                status: status.value,
                value: result
              }));
            });
          }
        }
        util_js_1.util.assertNever(effect);
      }
    };
    exports.ZodEffects = ZodEffects;
    exports.ZodTransformer = ZodEffects;
    ZodEffects.create = (schema2, effect, params) => {
      return new ZodEffects({
        schema: schema2,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params)
      });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema2, params) => {
      return new ZodEffects({
        schema: schema2,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
      });
    };
    var ZodOptional = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === util_js_1.ZodParsedType.undefined) {
          return (0, parseUtil_js_1.OK)(void 0);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    exports.ZodOptional = ZodOptional;
    ZodOptional.create = (type, params) => {
      return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
      });
    };
    var ZodNullable = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === util_js_1.ZodParsedType.null) {
          return (0, parseUtil_js_1.OK)(null);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    exports.ZodNullable = ZodNullable;
    ZodNullable.create = (type, params) => {
      return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
      });
    };
    var ZodDefault = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === util_js_1.ZodParsedType.undefined) {
          data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    };
    exports.ZodDefault = ZodDefault;
    ZodDefault.create = (type, params) => {
      return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params)
      });
    };
    var ZodCatch = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        };
        const result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        if ((0, parseUtil_js_1.isAsync)(result)) {
          return result.then((result2) => {
            return {
              status: "valid",
              value: result2.status === "valid" ? result2.value : this._def.catchValue({
                get error() {
                  return new ZodError_js_1.ZodError(newCtx.common.issues);
                },
                input: newCtx.data
              })
            };
          });
        } else {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError_js_1.ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        }
      }
      removeCatch() {
        return this._def.innerType;
      }
    };
    exports.ZodCatch = ZodCatch;
    ZodCatch.create = (type, params) => {
      return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params)
      });
    };
    var ZodNaN = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.nan,
            received: ctx.parsedType
          });
          return parseUtil_js_1.INVALID;
        }
        return { status: "valid", value: input.data };
      }
    };
    exports.ZodNaN = ZodNaN;
    ZodNaN.create = (params) => {
      return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
      });
    };
    exports.BRAND = /* @__PURE__ */ Symbol("zod_brand");
    var ZodBranded = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    };
    exports.ZodBranded = ZodBranded;
    var ZodPipeline = class _ZodPipeline extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
          const handleAsync = async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inResult.status === "aborted")
              return parseUtil_js_1.INVALID;
            if (inResult.status === "dirty") {
              status.dirty();
              return (0, parseUtil_js_1.DIRTY)(inResult.value);
            } else {
              return this._def.out._parseAsync({
                data: inResult.value,
                path: ctx.path,
                parent: ctx
              });
            }
          };
          return handleAsync();
        } else {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return parseUtil_js_1.INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return {
              status: "dirty",
              value: inResult.value
            };
          } else {
            return this._def.out._parseSync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        }
      }
      static create(a, b) {
        return new _ZodPipeline({
          in: a,
          out: b,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    };
    exports.ZodPipeline = ZodPipeline;
    var ZodReadonly = class extends ZodType {
      _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
          if ((0, parseUtil_js_1.isValid)(data)) {
            data.value = Object.freeze(data.value);
          }
          return data;
        };
        return (0, parseUtil_js_1.isAsync)(result) ? result.then((data) => freeze(data)) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    exports.ZodReadonly = ZodReadonly;
    ZodReadonly.create = (type, params) => {
      return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
      });
    };
    function cleanParams(params, data) {
      const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
      const p2 = typeof p === "string" ? { message: p } : p;
      return p2;
    }
    function custom(check, _params = {}, fatal) {
      if (check)
        return ZodAny.create().superRefine((data, ctx) => {
          const r = check(data);
          if (r instanceof Promise) {
            return r.then((r2) => {
              if (!r2) {
                const params = cleanParams(_params, data);
                const _fatal = params.fatal ?? fatal ?? true;
                ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
              }
            });
          }
          if (!r) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
          return;
        });
      return ZodAny.create();
    }
    exports.late = {
      object: ZodObject.lazycreate
    };
    var ZodFirstPartyTypeKind;
    (function(ZodFirstPartyTypeKind2) {
      ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
      ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
      ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
      ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
      ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
      ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
      ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
      ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
      ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
      ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
      ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
      ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
      ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
      ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
      ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
      ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
      ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
      ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
      ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
      ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
      ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
      ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
      ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
      ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
      ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
      ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
      ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
      ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
      ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
      ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
      ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
      ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
      ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
      ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
      ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
      ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
    })(ZodFirstPartyTypeKind || (exports.ZodFirstPartyTypeKind = ZodFirstPartyTypeKind = {}));
    var instanceOfType = (cls, params = {
      message: `Input not instance of ${cls.name}`
    }) => custom((data) => data instanceof cls, params);
    exports.instanceof = instanceOfType;
    var stringType = ZodString.create;
    exports.string = stringType;
    var numberType = ZodNumber.create;
    exports.number = numberType;
    var nanType = ZodNaN.create;
    exports.nan = nanType;
    var bigIntType = ZodBigInt.create;
    exports.bigint = bigIntType;
    var booleanType = ZodBoolean.create;
    exports.boolean = booleanType;
    var dateType = ZodDate.create;
    exports.date = dateType;
    var symbolType = ZodSymbol.create;
    exports.symbol = symbolType;
    var undefinedType = ZodUndefined.create;
    exports.undefined = undefinedType;
    var nullType = ZodNull.create;
    exports.null = nullType;
    var anyType = ZodAny.create;
    exports.any = anyType;
    var unknownType = ZodUnknown.create;
    exports.unknown = unknownType;
    var neverType = ZodNever.create;
    exports.never = neverType;
    var voidType = ZodVoid.create;
    exports.void = voidType;
    var arrayType = ZodArray.create;
    exports.array = arrayType;
    var objectType = ZodObject.create;
    exports.object = objectType;
    var strictObjectType = ZodObject.strictCreate;
    exports.strictObject = strictObjectType;
    var unionType = ZodUnion.create;
    exports.union = unionType;
    var discriminatedUnionType = ZodDiscriminatedUnion.create;
    exports.discriminatedUnion = discriminatedUnionType;
    var intersectionType = ZodIntersection.create;
    exports.intersection = intersectionType;
    var tupleType = ZodTuple.create;
    exports.tuple = tupleType;
    var recordType = ZodRecord.create;
    exports.record = recordType;
    var mapType = ZodMap.create;
    exports.map = mapType;
    var setType = ZodSet.create;
    exports.set = setType;
    var functionType = ZodFunction.create;
    exports.function = functionType;
    var lazyType = ZodLazy.create;
    exports.lazy = lazyType;
    var literalType = ZodLiteral.create;
    exports.literal = literalType;
    var enumType = ZodEnum.create;
    exports.enum = enumType;
    var nativeEnumType = ZodNativeEnum.create;
    exports.nativeEnum = nativeEnumType;
    var promiseType = ZodPromise.create;
    exports.promise = promiseType;
    var effectsType = ZodEffects.create;
    exports.effect = effectsType;
    exports.transformer = effectsType;
    var optionalType = ZodOptional.create;
    exports.optional = optionalType;
    var nullableType = ZodNullable.create;
    exports.nullable = nullableType;
    var preprocessType = ZodEffects.createWithPreprocess;
    exports.preprocess = preprocessType;
    var pipelineType = ZodPipeline.create;
    exports.pipeline = pipelineType;
    var ostring = () => stringType().optional();
    exports.ostring = ostring;
    var onumber = () => numberType().optional();
    exports.onumber = onumber;
    var oboolean = () => booleanType().optional();
    exports.oboolean = oboolean;
    exports.coerce = {
      string: ((arg) => ZodString.create({ ...arg, coerce: true })),
      number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
      boolean: ((arg) => ZodBoolean.create({
        ...arg,
        coerce: true
      })),
      bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
      date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
    };
    exports.NEVER = parseUtil_js_1.INVALID;
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.cjs
var require_external = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.cjs"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    __exportStar(require_errors(), exports);
    __exportStar(require_parseUtil(), exports);
    __exportStar(require_typeAliases(), exports);
    __exportStar(require_util(), exports);
    __exportStar(require_types(), exports);
    __exportStar(require_ZodError(), exports);
  }
});

// ../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/index.cjs
var require_zod = __commonJS({
  "../../../../../../Untitled/node_modules/.pnpm/zod@3.25.76/node_modules/zod/index.cjs"(exports) {
    "use strict";
    var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    }) : (function(o, m, k, k2) {
      if (k2 === void 0) k2 = k;
      o[k2] = m[k];
    }));
    var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    }) : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports && exports.__importStar || function(mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __exportStar = exports && exports.__exportStar || function(m, exports2) {
      for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
    };
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.z = void 0;
    var z2 = __importStar(require_external());
    exports.z = z2;
    __exportStar(require_external(), exports);
    exports.default = z2;
  }
});

// ../raw/apps/web/src/data/tournament/calibration.json
var calibration_default = {
  version: 1,
  kind: "historical-top8-adoption",
  corpusSha256: "9d52949e85186582fe5ef7b301a83ff182278e12875a9df1795dcc2807fe2180",
  sources: [
    {
      event: "Utrecht Regional Qualifier",
      url: "https://playriftbound.com/en-us/news/organizedplay/utrechts-top-decks/",
      date: "2026-06-14"
    },
    {
      event: "Hartford Regional Qualifier",
      url: "https://playriftbound.com/en-us/news/hartfords-top-decks/",
      date: "2026-06-21"
    },
    {
      event: "Barcelona Regional Qualifier",
      url: "https://playriftbound.com/en-us/news/organizedplay/barcelonas-top-decks/",
      date: "2026-08-23"
    },
    {
      event: "Singapore Regional Qualifier",
      url: "https://playriftbound.com/en-us/news/organizedplay/singapores-top-decks/",
      date: "2026-09-06"
    }
  ],
  eventCount: 4,
  deckCount: 32,
  observedFrom: "2026-06-12",
  observedTo: "2026-09-06",
  retrievedAt: "2026-09-20",
  priorOpportunities: 20,
  adjustmentCap: 0.15,
  cards: {
    "ogn-004-298": {
      eligibleDecks: 7,
      includedDecks: 3,
      events: 2,
      adjustment: 4167e-6,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-012-298": {
      eligibleDecks: 7,
      includedDecks: 6,
      events: 4,
      adjustment: 0.025,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-024-298": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-027-298": {
      eligibleDecks: 7,
      includedDecks: 3,
      events: 3,
      adjustment: 625e-5,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-029-298": {
      eligibleDecks: 7,
      includedDecks: 3,
      events: 3,
      adjustment: 625e-5,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-039-298": {
      eligibleDecks: 7,
      includedDecks: 5,
      events: 4,
      adjustment: 0.017361,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-043-298": {
      eligibleDecks: 10,
      includedDecks: 7,
      events: 4,
      adjustment: 0.030625,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-044-298": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-045-298": {
      eligibleDecks: 10,
      includedDecks: 10,
      events: 4,
      adjustment: 0.05,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-046-298": {
      eligibleDecks: 10,
      includedDecks: 7,
      events: 4,
      adjustment: 0.030625,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogs-019-024": {
          eligible: 6,
          included: 5
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-057-298": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-058-298": {
      eligibleDecks: 10,
      includedDecks: 9,
      events: 4,
      adjustment: 0.045,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-060-298": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-067-298": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-077-298": {
      eligibleDecks: 10,
      includedDecks: 7,
      events: 4,
      adjustment: 0.030625,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-081-298": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-084-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 1
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-087-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-091-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-093-298": {
      eligibleDecks: 8,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-095-298": {
      eligibleDecks: 8,
      includedDecks: 7,
      events: 2,
      adjustment: 0.021875,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-103-298": {
      eligibleDecks: 8,
      includedDecks: 4,
      events: 2,
      adjustment: 7143e-6,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-104-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-110-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-114-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-115-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-116-298": {
      eligibleDecks: 8,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-120-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-122-298": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-124-298": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-128-298": {
      eligibleDecks: 9,
      includedDecks: 4,
      events: 3,
      adjustment: 0.010345,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 2
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-132-298": {
      eligibleDecks: 9,
      includedDecks: 8,
      events: 4,
      adjustment: 0.041379,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-133-298": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-134-298": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-135-298": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-136-298": {
      eligibleDecks: 9,
      includedDecks: 8,
      events: 4,
      adjustment: 0.041379,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-139-298": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-141-298": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-154-298": {
      eligibleDecks: 9,
      includedDecks: 3,
      events: 3,
      adjustment: 5819e-6,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 3
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-156-298": {
      eligibleDecks: 9,
      includedDecks: 8,
      events: 4,
      adjustment: 0.041379,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-160-298": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-164-298": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-169-298": {
      eligibleDecks: 15,
      includedDecks: 11,
      events: 4,
      adjustment: 0.047143,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 6
        }
      }
    },
    "ogn-172-298": {
      eligibleDecks: 15,
      includedDecks: 5,
      events: 3,
      adjustment: 0.013393,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 1
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 4
        }
      }
    },
    "ogn-173-298": {
      eligibleDecks: 15,
      includedDecks: 11,
      events: 4,
      adjustment: 0.047143,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ogn-179-298": {
      eligibleDecks: 15,
      includedDecks: 4,
      events: 2,
      adjustment: 5714e-6,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "ogn-181-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "ogn-183-298": {
      eligibleDecks: 15,
      includedDecks: 15,
      events: 4,
      adjustment: 0.064286,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ogn-185-298": {
      eligibleDecks: 15,
      includedDecks: 14,
      events: 4,
      adjustment: 0.06,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ogn-186-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "ogn-192-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "ogn-194-298": {
      eligibleDecks: 15,
      includedDecks: 7,
      events: 2,
      adjustment: 0.0175,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ogn-195-298": {
      eligibleDecks: 15,
      includedDecks: 7,
      events: 2,
      adjustment: 0.0175,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ogn-198-298": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 2
        }
      }
    },
    "ogn-199-298": {
      eligibleDecks: 15,
      includedDecks: 10,
      events: 4,
      adjustment: 0.042857,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 5
        }
      }
    },
    "ogn-204-298": {
      eligibleDecks: 15,
      includedDecks: 7,
      events: 2,
      adjustment: 0.0175,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ogn-207-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-209-298": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-210-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-211-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-212-298": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-213-298": {
      eligibleDecks: 15,
      includedDecks: 6,
      events: 2,
      adjustment: 0.012857,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-216-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-218-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-220-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-221-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-224-298": {
      eligibleDecks: 15,
      includedDecks: 3,
      events: 2,
      adjustment: 3214e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 2
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-226-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-232-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-233-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-234-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-240-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-242-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-245-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-246-298": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-253-298": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-253-298": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-265-298": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-269-298": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ogn-270-298": {
      eligibleDecks: 2,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-276-298": {
      eligibleDecks: 32,
      includedDecks: 3,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-280-298": {
      eligibleDecks: 32,
      includedDecks: 5,
      events: 3,
      adjustment: 9014e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-282-298": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-287-298": {
      eligibleDecks: 32,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-289-298": {
      eligibleDecks: 32,
      includedDecks: 3,
      events: 2,
      adjustment: 2163e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 3
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-290-298": {
      eligibleDecks: 32,
      includedDecks: 7,
      events: 2,
      adjustment: 0.011779,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 1
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 1
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-291-298": {
      eligibleDecks: 32,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-294-298": {
      eligibleDecks: 32,
      includedDecks: 4,
      events: 2,
      adjustment: 3846e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-296-298": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogn-298-298": {
      eligibleDecks: 32,
      includedDecks: 9,
      events: 4,
      adjustment: 0.025962,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogs-010-024": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "ogs-011-024": {
      eligibleDecks: 15,
      includedDecks: 7,
      events: 4,
      adjustment: 0.02625,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 3
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 2
        }
      }
    },
    "ogs-014-024": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ogs-017-024": {
      eligibleDecks: 2,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "ogs-017-024": {
          eligible: 2,
          included: 2
        }
      }
    },
    "ogs-019-024": {
      eligibleDecks: 6,
      includedDecks: 6,
      events: 4,
      adjustment: 0.025962,
      byLegend: {
        "ogs-019-024": {
          eligible: 6,
          included: 6
        }
      }
    },
    "ogs-021-024": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogs-021-024": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-003-221": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-021-221": {
      eligibleDecks: 7,
      includedDecks: 4,
      events: 3,
      adjustment: 0.011111,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-022-221": {
      eligibleDecks: 7,
      includedDecks: 3,
      events: 3,
      adjustment: 625e-5,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-025-221": {
      eligibleDecks: 7,
      includedDecks: 4,
      events: 2,
      adjustment: 7407e-6,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-029-221": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-033-221": {
      eligibleDecks: 10,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-036-221": {
      eligibleDecks: 10,
      includedDecks: 6,
      events: 4,
      adjustment: 0.0225,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-042-221": {
      eligibleDecks: 10,
      includedDecks: 3,
      events: 2,
      adjustment: 375e-5,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-045-221": {
      eligibleDecks: 10,
      includedDecks: 3,
      events: 2,
      adjustment: 375e-5,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 2
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-046-221": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-048-221": {
      eligibleDecks: 10,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-051-221": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-056-221": {
      eligibleDecks: 10,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-057-221": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-058-221": {
      eligibleDecks: 10,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-061-221": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-064-221": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-070-221": {
      eligibleDecks: 8,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-080-221": {
      eligibleDecks: 8,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-081-221": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-097-221": {
      eligibleDecks: 9,
      includedDecks: 8,
      events: 4,
      adjustment: 0.041379,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-105-221": {
      eligibleDecks: 9,
      includedDecks: 6,
      events: 4,
      adjustment: 0.023276,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-109-221": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-110-221": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-128-221": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "sfd-130-221": {
      eligibleDecks: 15,
      includedDecks: 4,
      events: 3,
      adjustment: 8571e-6,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 3
        }
      }
    },
    "sfd-136-221": {
      eligibleDecks: 15,
      includedDecks: 10,
      events: 4,
      adjustment: 0.042857,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 4
        }
      }
    },
    "sfd-139-221": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 1
        }
      }
    },
    "sfd-140-221": {
      eligibleDecks: 15,
      includedDecks: 12,
      events: 4,
      adjustment: 0.051429,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 6
        }
      }
    },
    "sfd-145-221": {
      eligibleDecks: 15,
      includedDecks: 8,
      events: 3,
      adjustment: 0.034286,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "sfd-149-221": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "sfd-150-221": {
      eligibleDecks: 15,
      includedDecks: 7,
      events: 2,
      adjustment: 0.0175,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "sfd-153-221": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-154-221": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-155-221": {
      eligibleDecks: 15,
      includedDecks: 3,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-161-221": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-163-221": {
      eligibleDecks: 15,
      includedDecks: 3,
      events: 3,
      adjustment: 4821e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-166-221": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-175-221": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-176-221": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-177-221": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-180-221": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-187-221": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-188-221": {
      eligibleDecks: 2,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-189-221": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-197-221": {
      eligibleDecks: 2,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        }
      }
    },
    "sfd-198-221": {
      eligibleDecks: 2,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        }
      }
    },
    "sfd-199-221": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-199-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-205-221": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-206-221": {
      eligibleDecks: 2,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-207-221": {
      eligibleDecks: 32,
      includedDecks: 8,
      events: 4,
      adjustment: 0.023077,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-209-221": {
      eligibleDecks: 32,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-210-221": {
      eligibleDecks: 32,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-212-221": {
      eligibleDecks: 32,
      includedDecks: 7,
      events: 2,
      adjustment: 0.011779,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 7
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-213-221": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-216-221": {
      eligibleDecks: 32,
      includedDecks: 3,
      events: 2,
      adjustment: 2163e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 2
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-217-221": {
      eligibleDecks: 32,
      includedDecks: 11,
      events: 4,
      adjustment: 0.031731,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 2
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 3
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-218-221": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "sfd-219-221": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "sfd-221-221": {
      eligibleDecks: 32,
      includedDecks: 3,
      events: 2,
      adjustment: 2163e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 2
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-002-219": {
      eligibleDecks: 7,
      includedDecks: 5,
      events: 3,
      adjustment: 0.017361,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-003-219": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-019-219": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-021-219": {
      eligibleDecks: 7,
      includedDecks: 3,
      events: 3,
      adjustment: 625e-5,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-028-219": {
      eligibleDecks: 7,
      includedDecks: 3,
      events: 3,
      adjustment: 625e-5,
      byLegend: {
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-039-219": {
      eligibleDecks: 10,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-042-219": {
      eligibleDecks: 10,
      includedDecks: 5,
      events: 3,
      adjustment: 0.015625,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 2
        },
        "ogs-019-024": {
          eligible: 6,
          included: 2
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-053-219": {
      eligibleDecks: 10,
      includedDecks: 8,
      events: 4,
      adjustment: 0.04,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-061-219": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-063-219": {
      eligibleDecks: 8,
      includedDecks: 6,
      events: 2,
      adjustment: 0.016071,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-069-219": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-070-219": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-071-219": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-073-219": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-078-219": {
      eligibleDecks: 8,
      includedDecks: 6,
      events: 3,
      adjustment: 0.024107,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 3
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-079-219": {
      eligibleDecks: 8,
      includedDecks: 4,
      events: 2,
      adjustment: 7143e-6,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-080-219": {
      eligibleDecks: 8,
      includedDecks: 4,
      events: 2,
      adjustment: 7143e-6,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-085-219": {
      eligibleDecks: 8,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-095-219": {
      eligibleDecks: 9,
      includedDecks: 3,
      events: 3,
      adjustment: 5819e-6,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 3
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-097-219": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-106-219": {
      eligibleDecks: 9,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-112-219": {
      eligibleDecks: 9,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-113-219": {
      eligibleDecks: 9,
      includedDecks: 6,
      events: 4,
      adjustment: 0.023276,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-114-219": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-116-219": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-118-219": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-120-219": {
      eligibleDecks: 9,
      includedDecks: 9,
      events: 4,
      adjustment: 0.046552,
      byLegend: {
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 6,
          included: 6
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-121-219": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "unl-128-219": {
      eligibleDecks: 15,
      includedDecks: 14,
      events: 4,
      adjustment: 0.06,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 6
        }
      }
    },
    "unl-131-219": {
      eligibleDecks: 15,
      includedDecks: 4,
      events: 3,
      adjustment: 8571e-6,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 2
        }
      }
    },
    "unl-134-219": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 1
        }
      }
    },
    "unl-138-219": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "unl-143-219": {
      eligibleDecks: 15,
      includedDecks: 3,
      events: 2,
      adjustment: 3214e-6,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 3
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "unl-147-219": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 2
        }
      }
    },
    "unl-150-219": {
      eligibleDecks: 15,
      includedDecks: 7,
      events: 2,
      adjustment: 0.0175,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "ogs-017-024": {
          eligible: 2,
          included: 2
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        }
      }
    },
    "unl-153-219": {
      eligibleDecks: 15,
      includedDecks: 4,
      events: 2,
      adjustment: 5714e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-158-219": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-161-219": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-164-219": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-165-219": {
      eligibleDecks: 15,
      includedDecks: 3,
      events: 2,
      adjustment: 3214e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-173-219": {
      eligibleDecks: 15,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-176-219": {
      eligibleDecks: 15,
      includedDecks: 5,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 1
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "sfd-187-221": {
          eligible: 1,
          included: 1
        },
        "ogn-253-298": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-179-219": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-180-219": {
      eligibleDecks: 15,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 1
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-183-219": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-183-219": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-184-219": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-183-219": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-185-219": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-185-219": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-192-219": {
      eligibleDecks: 6,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "ogs-019-024": {
          eligible: 6,
          included: 2
        }
      }
    },
    "unl-197-219": {
      eligibleDecks: 4,
      includedDecks: 4,
      events: 2,
      adjustment: 8333e-6,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        }
      }
    },
    "unl-198-219": {
      eligibleDecks: 5,
      includedDecks: 4,
      events: 2,
      adjustment: 8e-3,
      byLegend: {
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-205-219": {
      eligibleDecks: 32,
      includedDecks: 5,
      events: 3,
      adjustment: 9014e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 4
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 1
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-207-219": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "unl-210-219": {
      eligibleDecks: 32,
      includedDecks: 4,
      events: 4,
      adjustment: 5769e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 1
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 2
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-212-219": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 1
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-214-219": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 1
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-215-219": {
      eligibleDecks: 32,
      includedDecks: 4,
      events: 3,
      adjustment: 5769e-6,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 0
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 3
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "unl-218-219": {
      eligibleDecks: 32,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-197-221": {
          eligible: 2,
          included: 0
        },
        "ogn-265-298": {
          eligible: 1,
          included: 0
        },
        "ogn-269-298": {
          eligible: 1,
          included: 1
        },
        "unl-197-219": {
          eligible: 4,
          included: 0
        },
        "sfd-187-221": {
          eligible: 1,
          included: 0
        },
        "ogn-253-298": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 6,
          included: 0
        },
        "ogs-017-024": {
          eligible: 2,
          included: 0
        },
        "sfd-199-221": {
          eligible: 1,
          included: 0
        },
        "ogs-021-024": {
          eligible: 1,
          included: 0
        },
        "unl-185-219": {
          eligible: 1,
          included: 0
        },
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ven-021-166": {
      eligibleDecks: 2,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ven-027-166": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "sfd-197-221": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 4,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ven-028-166": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "sfd-197-221": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 4,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ven-043-166": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "sfd-197-221": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 4,
          included: 1
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ven-044-166": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "sfd-197-221": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 4,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ven-045-166": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 1
        },
        "sfd-197-221": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 4,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ven-058-166": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ven-081-166": {
      eligibleDecks: 6,
      includedDecks: 3,
      events: 2,
      adjustment: 4327e-6,
      byLegend: {
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 4,
          included: 3
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ven-083-166": {
      eligibleDecks: 6,
      includedDecks: 6,
      events: 2,
      adjustment: 0.017308,
      byLegend: {
        "unl-183-219": {
          eligible: 1,
          included: 1
        },
        "ogs-019-024": {
          eligible: 4,
          included: 4
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ven-095-166": {
      eligibleDecks: 7,
      includedDecks: 5,
      events: 2,
      adjustment: 0.011574,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 5
        }
      }
    },
    "ven-100-166": {
      eligibleDecks: 7,
      includedDecks: 6,
      events: 2,
      adjustment: 0.016667,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 6
        }
      }
    },
    "ven-101-166": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 1
        }
      }
    },
    "ven-103-166": {
      eligibleDecks: 7,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 1
        }
      }
    },
    "ven-104-166": {
      eligibleDecks: 7,
      includedDecks: 2,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 2
        }
      }
    },
    "ven-113-166": {
      eligibleDecks: 7,
      includedDecks: 7,
      events: 2,
      adjustment: 0.022685,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ven-135-166": {
      eligibleDecks: 9,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-197-221": {
          eligible: 1,
          included: 1
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    },
    "ven-139-166": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ven-140-166": {
      eligibleDecks: 1,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "ven-139-166": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ven-155-166": {
      eligibleDecks: 7,
      includedDecks: 7,
      events: 2,
      adjustment: 0.022685,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ven-156-166": {
      eligibleDecks: 7,
      includedDecks: 7,
      events: 2,
      adjustment: 0.022685,
      byLegend: {
        "ven-155-166": {
          eligible: 7,
          included: 7
        }
      }
    },
    "ven-163-166": {
      eligibleDecks: 16,
      includedDecks: 1,
      events: 1,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 0
        },
        "sfd-197-221": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 4,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 1
        }
      }
    },
    "ven-164-166": {
      eligibleDecks: 16,
      includedDecks: 2,
      events: 2,
      adjustment: 0,
      byLegend: {
        "sfd-189-221": {
          eligible: 1,
          included: 0
        },
        "ven-155-166": {
          eligible: 7,
          included: 2
        },
        "sfd-197-221": {
          eligible: 1,
          included: 0
        },
        "unl-183-219": {
          eligible: 1,
          included: 0
        },
        "ogs-019-024": {
          eligible: 4,
          included: 0
        },
        "ven-139-166": {
          eligible: 1,
          included: 0
        },
        "sfd-205-221": {
          eligible: 1,
          included: 0
        }
      }
    }
  },
  families: {
    damage: {
      observedCards: 12,
      eligibleOpportunities: 419,
      included: 16,
      regularizedAdoption: 0.036446,
      coefficient: 0,
      status: "neutral: Top-8-only outcomes cannot identify mechanical strength independently of selection and legend"
    },
    removal: {
      observedCards: 11,
      eligibleOpportunities: 556,
      included: 21,
      regularizedAdoption: 0.036458,
      coefficient: 0,
      status: "neutral: Top-8-only outcomes cannot identify mechanical strength independently of selection and legend"
    },
    draw: {
      observedCards: 43,
      eligibleOpportunities: 1248,
      included: 143,
      regularizedAdoption: 0.112776,
      coefficient: 0,
      status: "neutral: Top-8-only outcomes cannot identify mechanical strength independently of selection and legend"
    },
    movement: {
      observedCards: 29,
      eligibleOpportunities: 1304,
      included: 119,
      regularizedAdoption: 0.089879,
      coefficient: 0,
      status: "neutral: Top-8-only outcomes cannot identify mechanical strength independently of selection and legend"
    },
    ramp: {
      observedCards: 6,
      eligibleOpportunities: 231,
      included: 7,
      regularizedAdoption: 0.027888,
      coefficient: 0,
      status: "neutral: Top-8-only outcomes cannot identify mechanical strength independently of selection and legend"
    },
    gear: {
      observedCards: 22,
      eligibleOpportunities: 673,
      included: 45,
      regularizedAdoption: 0.064935,
      coefficient: 0,
      status: "neutral: Top-8-only outcomes cannot identify mechanical strength independently of selection and legend"
    },
    buff: {
      observedCards: 19,
      eligibleOpportunities: 721,
      included: 34,
      regularizedAdoption: 0.045884,
      coefficient: 0,
      status: "neutral: Top-8-only outcomes cannot identify mechanical strength independently of selection and legend"
    }
  },
  holdouts: [
    {
      heldOutEvent: "barcelona-2026",
      opportunities: 1553,
      brierAdoption: 0.054147,
      baselineBrier: 0.068009
    },
    {
      heldOutEvent: "hartford-2026",
      opportunities: 1056,
      brierAdoption: 0.068567,
      baselineBrier: 0.078735
    },
    {
      heldOutEvent: "singapore-2026",
      opportunities: 1550,
      brierAdoption: 0.052411,
      baselineBrier: 0.065953
    },
    {
      heldOutEvent: "utrecht-2026",
      opportunities: 850,
      brierAdoption: 0.062976,
      baselineBrier: 0.076534
    }
  ],
  method: "Compatible per-Legend opportunities; 20 prior opportunities; minimum 3 inclusions in 2 events; positive adoption correction capped at 0.15. No causal or win-rate interpretation. Family strength coefficients remain zero because all lists are Top 8."
};

// ../raw/apps/web/src/lib/gameplay-evidence.ts
var import_zod = __toESM(require_zod());
var count = import_zod.z.number().int().nonnegative();
var rate = import_zod.z.number().min(0).max(1).nullable();
var metric = import_zod.z.object({
  wins: count,
  games: count,
  winRate: rate,
  adjustedWinRate: rate,
  interval: import_zod.z.tuple([import_zod.z.number().min(0).max(1), import_zod.z.number().min(0).max(1)]).nullable(),
  tierEligible: import_zod.z.boolean()
}).superRefine((m, ctx) => {
  const bad = m.wins > m.games || m.tierEligible !== m.games >= 50 || (m.games < 20 ? m.winRate !== null || m.adjustedWinRate !== null : m.winRate === null || m.adjustedWinRate === null || Math.abs(m.winRate - m.wins / m.games) > 1e-5 || Math.abs(m.adjustedWinRate - (m.wins + 10) / (m.games + 20)) > 1e-5) || (m.games === 0 ? m.interval !== null : m.interval === null || m.interval[0] > m.interval[1]);
  const z2 = 1.959963984540054, p = m.games ? m.wins / m.games : 0, denominator = 1 + z2 * z2 / m.games;
  const center = (p + z2 * z2 / (2 * m.games)) / denominator;
  const margin = z2 * Math.sqrt(
    p * (1 - p) / m.games + z2 * z2 / (4 * m.games * m.games)
  ) / denominator;
  const intervalInvalid = m.games > 0 && m.interval !== null && (Math.abs(m.interval[0] - (center - margin)) > 1e-5 || Math.abs(m.interval[1] - (center + margin)) > 1e-5);
  if (bad || intervalInvalid)
    ctx.addIssue({ code: "custom", message: "Inconsistent evidence metric" });
});
var schema = import_zod.z.object({
  version: import_zod.z.literal(1),
  window: import_zod.z.enum(["30d", "90d", "all"]),
  cohort: import_zod.z.enum(["human", "bot"]),
  generatedAt: import_zod.z.string().datetime(),
  completedMatches: count,
  coverage: import_zod.z.object({
    eligiblePlayerMatches: count,
    playedKnown: count,
    playedMissing: count,
    openingHandKnown: count,
    openingHandMissing: count,
    legacyUnknownMatches: count
  }),
  cards: import_zod.z.array(
    import_zod.z.object({
      cardId: import_zod.z.string().min(1),
      inclusion: metric,
      played: metric,
      openingHand: metric
    })
  ),
  decks: import_zod.z.array(
    import_zod.z.object({
      fingerprint: import_zod.z.string().min(1),
      legendId: import_zod.z.string().min(1),
      outcome: metric
    })
  ),
  legends: import_zod.z.array(import_zod.z.object({ legendId: import_zod.z.string().min(1), outcome: metric }))
});
function outcomeAdjustment(metric2, cohort = "human") {
  if (cohort !== "human" || !metric2?.tierEligible || metric2.games < 50 || metric2.adjustedWinRate === null || !Number.isFinite(metric2.adjustedWinRate) || metric2.adjustedWinRate < 0 || metric2.adjustedWinRate > 1 || !Number.isSafeInteger(metric2.games) || !Number.isSafeInteger(metric2.wins) || metric2.wins < 0 || metric2.wins > metric2.games || !metric2.interval || metric2.interval[0] <= 0.5 && metric2.interval[1] >= 0.5)
    return 0;
  return Math.max(-0.35, Math.min(0.35, (metric2.adjustedWinRate - 0.5) * 1.4));
}

// ../raw/apps/web/src/lib/score-model-version.ts
var SCORE_MODEL_VERSION = "RDS 0.8.4";

// ../raw/apps/web/src/lib/meta.ts
function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}
var MAX_SELECTED_TOP_LIST_CARD_ADJUSTMENT = 0.15;
var MAX_CONDITIONAL_PAIR_ADJUSTMENT = 0.35;
function boundedAdjustment(adjustment, requestedCap, maximumCap) {
  if (!Number.isFinite(adjustment)) return 0;
  const cap = Number.isFinite(requestedCap) ? clamp(Math.abs(requestedCap), 0, maximumCap) : maximumCap;
  return clamp(adjustment, -cap, cap);
}
function pairKey(left, right) {
  return left < right ? `${left}\0${right}` : `${right}\0${left}`;
}
function rounded(value, places = 4) {
  const factor = 10 ** places;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
function resolveDeckMetaOverlay(entries, calibration) {
  if (!calibration || calibration.snapshot?.scoreModelVersion !== SCORE_MODEL_VERSION) {
    return {
      card: 0,
      pair: 0,
      total: 0,
      matchedCardRows: 0,
      matchedPairRows: 0,
      matchedCardNames: []
    };
  }
  const copies = /* @__PURE__ */ new Map();
  const names = /* @__PURE__ */ new Map();
  for (const { card: card2, quantity } of entries) {
    if (!card2.id || !Number.isFinite(quantity) || quantity <= 0) continue;
    const count2 = Math.floor(quantity);
    copies.set(card2.id, (copies.get(card2.id) ?? 0) + count2);
    names.set(card2.id, card2.name);
  }
  let cardTotal = 0;
  let pairTotal = 0;
  let matchedCardRows = 0;
  let matchedPairRows = 0;
  const matchedNames = /* @__PURE__ */ new Set();
  const cardRows = [...calibration.cardAdjustments].sort(
    (left, right) => left.gameplayCardKey.localeCompare(right.gameplayCardKey)
  );
  for (const row of cardRows) {
    const quantity = copies.get(row.gameplayCardKey) ?? 0;
    if (quantity <= 0) continue;
    const adjustment = boundedAdjustment(
      row.adjustment,
      row.adjustmentCap,
      MAX_SELECTED_TOP_LIST_CARD_ADJUSTMENT
    );
    cardTotal += Math.max(0, adjustment);
    matchedCardRows += 1;
    const name = names.get(row.gameplayCardKey);
    if (name) matchedNames.add(name);
  }
  const pairRows = [...calibration.pairAdjustments].sort(
    (left, right) => pairKey(left.leftCardKey, left.rightCardKey).localeCompare(
      pairKey(right.leftCardKey, right.rightCardKey)
    )
  );
  for (const row of pairRows) {
    const leftQuantity = copies.get(row.leftCardKey) ?? 0;
    const rightQuantity = copies.get(row.rightCardKey) ?? 0;
    if (leftQuantity <= 0 || rightQuantity <= 0) continue;
    const adjustment = boundedAdjustment(
      row.adjustment,
      row.adjustmentCap,
      MAX_CONDITIONAL_PAIR_ADJUSTMENT
    );
    pairTotal += adjustment;
    matchedPairRows += 1;
    const leftName = names.get(row.leftCardKey);
    const rightName = names.get(row.rightCardKey);
    if (leftName) matchedNames.add(leftName);
    if (rightName) matchedNames.add(rightName);
  }
  const card = rounded(cardTotal);
  const pair = rounded(pairTotal);
  return {
    card,
    pair,
    total: rounded(card + pair),
    matchedCardRows,
    matchedPairRows,
    matchedCardNames: [...matchedNames].sort()
  };
}

// ../raw/config/current-constructed-rules.json
var current_constructed_rules_default = {
  policyVersion: "current-constructed-2026-09-18-v1",
  rulesSnapshotDate: "2026-09-20",
  source: "Riot Standard Constructed bans effective September 18, reviewed September 20, 2026.",
  sources: {
    "march-2026": {
      label: "Announcing Riftbound's First Bans",
      url: "https://playriftbound.com/en-us/news/announcements/announcing-riftbounds-first-bans/"
    },
    "july-2026": {
      label: "July Ban List Updates",
      url: "https://playriftbound.com/en-us/news/announcements/july-ban-list-updates/"
    },
    "september-2026": {
      label: "September Ban List Updates (effective September 18, 2026)",
      url: "https://playriftbound.com/en-us/news/announcements/september-ban-list-updates-effective-september-18-2026/"
    }
  },
  observationWindowMonths: 3,
  setLegalFrom: {
    VEN: "2026-07-31"
  },
  bannedCards: [
    {
      id: "sfd-122-221",
      zone: "main",
      effectiveFrom: "2026-03-31",
      sourceId: "march-2026"
    },
    {
      id: "sfd-020-221",
      zone: "main",
      effectiveFrom: "2026-03-31",
      sourceId: "march-2026"
    },
    {
      id: "ogn-168-298",
      zone: "main",
      effectiveFrom: "2026-03-31",
      sourceId: "march-2026"
    },
    {
      id: "ogn-182-298",
      zone: "main",
      effectiveFrom: "2026-03-31",
      sourceId: "march-2026"
    },
    {
      id: "ogn-177-298",
      zone: "main",
      effectiveFrom: "2026-07-24",
      sourceId: "july-2026"
    },
    {
      id: "ogn-292-298",
      zone: "battlefield",
      effectiveFrom: "2026-03-31",
      sourceId: "march-2026"
    },
    {
      id: "ogn-284-298",
      zone: "battlefield",
      effectiveFrom: "2026-03-31",
      sourceId: "march-2026"
    },
    {
      id: "ogn-285-298",
      zone: "battlefield",
      effectiveFrom: "2026-03-31",
      sourceId: "march-2026"
    },
    {
      id: "ogn-290-298",
      zone: "battlefield",
      effectiveFrom: "2026-07-24",
      sourceId: "july-2026"
    },
    {
      id: "ogn-276-298",
      zone: "battlefield",
      effectiveFrom: "2026-07-24",
      sourceId: "july-2026"
    },
    {
      id: "ogn-110-298",
      zone: "main",
      effectiveFrom: "2026-09-18",
      sourceId: "september-2026"
    },
    {
      id: "ogn-183-298",
      zone: "main",
      effectiveFrom: "2026-09-18",
      sourceId: "september-2026"
    }
  ]
};

// ../raw/apps/web/src/lib/scoring.ts
var RULES_SNAPSHOT_DATE = current_constructed_rules_default.rulesSnapshotDate;
var VENDETTA_LEGAL_DATE = current_constructed_rules_default.setLegalFrom.VEN;
var SET_PREVIEW_LABELS = { VEN: "Vendetta" };
function previewSetLegalFrom(setId, onDate = RULES_SNAPSHOT_DATE) {
  const legalFrom = current_constructed_rules_default.setLegalFrom[setId];
  return legalFrom && legalFrom > onDate ? legalFrom : null;
}
function previewSetLabel(setId) {
  return SET_PREVIEW_LABELS[setId] ?? setId;
}
var CURRENT_CONSTRUCTED_BAN_ENTRIES = current_constructed_rules_default.bannedCards.map((entry) => {
  const source = current_constructed_rules_default.sources[entry.sourceId];
  return {
    cardId: entry.id,
    effectiveDate: entry.effectiveFrom,
    format: "standard-1v1",
    kind: entry.zone === "battlefield" ? "battlefield" : "main-deck",
    sourceLabel: source.label,
    sourceUrl: source.url
  };
});
var CURRENT_CONSTRUCTED_BANS = {
  cards: new Set(
    CURRENT_CONSTRUCTED_BAN_ENTRIES.filter(
      (entry) => entry.kind === "main-deck"
    ).map((entry) => entry.cardId)
  ),
  battlefields: new Set(
    CURRENT_CONSTRUCTED_BAN_ENTRIES.filter(
      (entry) => entry.kind === "battlefield"
    ).map((entry) => entry.cardId)
  )
};
function constructedBanFor(card) {
  return CURRENT_CONSTRUCTED_BAN_ENTRIES.find((entry) => entry.cardId === card.id) ?? null;
}
function isConstructedBanned(card) {
  return constructedBanFor(card) !== null;
}
var CARD_TIER_GRADES = [
  "SSS+",
  "SSS",
  "SS",
  "S",
  "A",
  "B",
  "C",
  "D",
  "F"
];
var CARD_TIER_THRESHOLDS = {
  "SSS+": 6.86,
  SSS: 6.14,
  SS: 5.81,
  S: 5.49,
  A: 5.19,
  B: 4.91,
  C: 4.18,
  D: 3.14
};
function cardTierGrade(score) {
  if (!Number.isFinite(score)) return "F";
  if (score >= CARD_TIER_THRESHOLDS["SSS+"]) return "SSS+";
  if (score >= CARD_TIER_THRESHOLDS.SSS) return "SSS";
  if (score >= CARD_TIER_THRESHOLDS.SS) return "SS";
  if (score >= CARD_TIER_THRESHOLDS.S) return "S";
  if (score >= CARD_TIER_THRESHOLDS.A) return "A";
  if (score >= CARD_TIER_THRESHOLDS.B) return "B";
  if (score >= CARD_TIER_THRESHOLDS.C) return "C";
  if (score >= CARD_TIER_THRESHOLDS.D) return "D";
  return "F";
}
var FOUNDATION_SCORE_CARD_TYPES = /* @__PURE__ */ new Set([
  "unit",
  "spell",
  "gear",
  "legend",
  "battlefield"
]);
function isScoredCard(card) {
  return FOUNDATION_SCORE_CARD_TYPES.has(card.type);
}
function isMainDeckScoreCard(card) {
  return ["unit", "spell", "gear"].includes(card.type);
}
function foundationGradeForCard(card) {
  return isScoredCard(card) ? cardTierGrade(baseCardRating(card)) : null;
}
function rateCardWithEvidence(card, report) {
  const foundation = baseCardRating(card);
  const rows = calibration_default.cards;
  const evidence = rows[card.id];
  const banned = isConstructedBanned(card);
  const tournament = banned ? 0 : Math.min(0.15, Math.max(0, evidence?.adjustment ?? 0));
  const metric2 = card.type === "legend" ? report?.legends.find((row) => row.legendId === card.id)?.outcome : report?.cards.find((row) => row.cardId === card.id)?.inclusion;
  const outcomes = banned ? 0 : outcomeAdjustment(metric2, report?.cohort);
  const score = Math.round((foundation + tournament + outcomes) * 1e3) / 1e3;
  return {
    foundation,
    tournament,
    outcomes,
    score,
    grade: cardTierGrade(score),
    tournamentDecks: evidence?.includedDecks ?? 0,
    siteGames: metric2?.games ?? 0
  };
}
var STANDARD_OPENING_HAND = 4;
var DEFAULT_EARLY_DRAWS = 3;
var FOUNDATION_DECK_SCALE = 10.5;
var TRAIT_LABELS = {
  accelerate: "Accelerate",
  action: "Action speed",
  ambush: "Ambush",
  assault: "Assault",
  backline: "Backline",
  "banish-enabler": "Banish enabler",
  "banish-payoff": "Banish payoff",
  "buff-consumer": "Buff spender / payoff",
  "buff-producer": "Buff producer",
  "burn-opponent": "Opponent burn",
  "burn-payoff": "Burn payoff",
  "burn-self": "Self burn",
  "card-copy": "Copy effects",
  "card-naming": "Card / tag naming",
  "channel-rune": "Rune channel",
  "cost-reduction": "Cost reduction",
  counter: "Countermagic",
  conquer: "Conquer payoff",
  "damage-provider": "Enemy damage provider",
  "damage-prevention": "Damage prevention",
  death: "Death matters",
  "death-enabler": "Death enabler",
  "death-payoff": "Death payoff",
  deflect: "Deflect",
  discard: "Discard outlet",
  "discard-payoff": "Discard payoff",
  disempower: "Disempower",
  draw: "Card draw",
  "energy-ramp": "Energy ramp",
  empower: "Empower enabler",
  "empowered-payoff": "Empowered payoff",
  equip: "Equip",
  equipment: "Equipment",
  "equipment-matters": "Equipment payoff",
  exhaust: "Exhaust",
  flow: "Flow / cast from trash",
  ganking: "Ganking",
  gear: "Gear",
  "gear-matters": "Gear payoff",
  heal: "Healing",
  hidden: "Hidden",
  hold: "Hold payoff",
  "hold-enabler": "Hold enabler",
  "hold-payoff": "Hold reward",
  hunt: "Hunt / XP gain",
  interaction: "Interaction",
  legion: "Legion",
  "lethal-damage-conversion": "Lethal damage conversion",
  level: "Level / XP payoff",
  mighty: "Mighty",
  movement: "Movement enabler",
  "movement-payoff": "Movement payoff",
  "power-demand": "Power-heavy",
  predict: "Predict / top-deck control",
  "quick-draw": "Quick-Draw",
  reaction: "Reaction speed",
  ready: "Ready",
  recycle: "Recycle / rune reuse",
  removal: "Removal",
  repeat: "Repeat",
  "rune-count-payoff": "Rune-count payoff",
  scoring: "Conquer / scoring",
  shield: "Shield",
  skip: "Skip / turn manipulation",
  spell: "Spell",
  "spell-matters": "Spell payoff",
  stun: "Stun",
  "stun-payoff": "Stun payoff",
  tank: "Tank",
  temporary: "Temporary",
  "topdeck-payoff": "Top-deck payoff",
  token: "Token producer",
  "token-matters": "Token payoff",
  "trash-banish": "Banish from trash",
  "trash-filler": "Trash filler",
  "trash-payoff": "Trash payoff",
  "trash-retrieval": "Trash retrieval",
  unique: "Unique",
  unit: "Unit",
  "unit-gear": "Unit-Gear",
  vision: "Vision",
  weaponmaster: "Weaponmaster",
  wide: "Go wide",
  "xp-spend": "XP spender"
};
function normalizedChampionIdentity(value) {
  return value.normalize("NFKD").replaceAll(/\p{Diacritic}/gu, "").toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, " ").trim();
}
function championMatchesLegend(legend, champion) {
  if (champion.type !== "unit") return false;
  const championName = normalizedChampionIdentity(
    champion.name.split(",")[0] ?? champion.name
  );
  if (!championName) return false;
  return legend.tags.some((tag) => {
    const identity = normalizedChampionIdentity(tag);
    return identity === championName || identity.endsWith(` ${championName}`) || championName.endsWith(` ${identity}`);
  });
}
function isSignatureCard(card) {
  return (card.superTypes ?? []).some(
    (superType) => normalizedChampionIdentity(superType) === normalizedChampionIdentity("Signature")
  );
}
function signatureMatchesLegend(card, legend) {
  if (!isSignatureCard(card)) return true;
  const legendTags = new Set(legend.tags.map(normalizedChampionIdentity));
  return card.tags.some(
    (tag) => legendTags.has(normalizedChampionIdentity(tag))
  );
}
var PACKAGE_PAIRS = [
  { left: "buff-producer", right: "buff-consumer", label: "Buff engine" },
  { left: "burn-self", right: "flow", label: "Burn into Flow" },
  { left: "burn-self", right: "burn-payoff", label: "Burn rewards" },
  { left: "trash-filler", right: "trash-payoff", label: "Trash threshold" },
  { left: "trash-filler", right: "trash-retrieval", label: "Trash recursion" },
  { left: "trash-filler", right: "trash-banish", label: "Trash as fuel" },
  { left: "banish-enabler", right: "banish-payoff", label: "Banish engine" },
  { left: "discard", right: "discard-payoff", label: "Discard rewards" },
  { left: "empower", right: "empowered-payoff", label: "Empower engine" },
  { left: "hunt", right: "level", label: "XP progression" },
  { left: "hunt", right: "xp-spend", label: "XP economy" },
  { left: "gear", right: "gear-matters", label: "Gear workshop" },
  {
    left: "equipment",
    right: "equipment-matters",
    label: "Equipment package"
  },
  { left: "movement", right: "movement-payoff", label: "Move triggers" },
  { left: "hold-enabler", right: "hold-payoff", label: "Hold engine" },
  { left: "predict", right: "topdeck-payoff", label: "Top-deck certainty" },
  { left: "spell", right: "spell-matters", label: "Spellcraft package" },
  { left: "token", right: "wide", label: "Go-wide package" },
  { left: "token", right: "token-matters", label: "Token rewards" },
  { left: "death-enabler", right: "death-payoff", label: "Death engine" },
  { left: "temporary", right: "death-payoff", label: "Disposable force" },
  { left: "stun", right: "stun-payoff", label: "Stun lock" },
  {
    left: "damage-provider",
    right: "lethal-damage-conversion",
    label: "Lethal damage conversion"
  },
  {
    left: "channel-rune",
    right: "rune-count-payoff",
    label: "Rune-count acceleration"
  }
];
var ORPHAN_ENGINE_RULES = [
  {
    id: "orphan-trash",
    enablers: ["trash-filler", "burn-self"],
    payoffs: ["flow", "trash-payoff", "trash-retrieval", "trash-banish"],
    label: "Trash setup without enough payoff",
    minimumEnablers: 4,
    minimumPayoffs: 2,
    coefficient: 0.46,
    cap: 5.5
  },
  {
    id: "orphan-empower",
    enablers: ["empower"],
    payoffs: ["empowered-payoff", "disempower"],
    label: "Empower without enough payoff",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.42,
    cap: 4.5
  },
  {
    id: "orphan-xp",
    enablers: ["hunt"],
    payoffs: ["level", "xp-spend"],
    label: "XP generation without enough outlet",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.42,
    cap: 4.5
  },
  {
    id: "orphan-token",
    enablers: ["token"],
    payoffs: ["token-matters", "wide", "legion"],
    label: "Token production without enough payoff",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.34,
    cap: 3.8
  },
  {
    id: "orphan-death",
    enablers: ["death-enabler", "temporary"],
    payoffs: ["death-payoff"],
    label: "Disposable units without death payoff",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.38,
    cap: 4.2
  },
  {
    id: "orphan-discard",
    enablers: ["discard"],
    payoffs: ["discard-payoff"],
    label: "Discard package without enough reward",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.32,
    cap: 3.5
  },
  {
    id: "orphan-predict",
    enablers: ["predict"],
    payoffs: ["topdeck-payoff", "recycle"],
    label: "Top-deck setup without enough payoff",
    minimumEnablers: 3,
    minimumPayoffs: 2,
    coefficient: 0.3,
    cap: 3.2
  },
  {
    id: "orphan-ramp",
    enablers: ["channel-rune"],
    payoffs: ["rune-count-payoff"],
    label: "Rune channels without enough rune-count payoff",
    minimumEnablers: 3,
    minimumPayoffs: 3,
    coefficient: 0.3,
    cap: 3.5
  }
];
function round(value, places = 1) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}
function countMatches(text, pattern) {
  return text.match(pattern)?.length ?? 0;
}
var RULE_ANALYSIS_CACHE_LIMIT = 4096;
var controllerInstructionPatternCache = /* @__PURE__ */ new Map();
function rememberRuleAnalysis(cache, text, value) {
  if (cache.size >= RULE_ANALYSIS_CACHE_LIMIT) cache.clear();
  cache.set(text, value);
  return value;
}
function controllerInstructionClauses(text, verbSource, includeAnd = false) {
  const sequentialBoundary = includeAnd ? String.raw`\b(?:then|and)\s+` : String.raw`\bthen\s+`;
  const patternKey = `${verbSource}:${includeAnd ? "and" : "then"}`;
  let pattern = controllerInstructionPatternCache.get(patternKey);
  if (!pattern) {
    pattern = new RegExp(
      String.raw`(?:^|[.!?;:—]\s*|\]\s*|,\s*|${sequentialBoundary})(?:you\s+(?:may\s+)?)?(${verbSource})\b([^.!?;]*)`,
      "g"
    );
    controllerInstructionPatternCache.set(patternKey, pattern);
  }
  pattern.lastIndex = 0;
  const clauses = [];
  for (const match of text.matchAll(pattern)) {
    clauses.push(`${match[1] ?? ""}${match[2] ?? ""}`.trim());
  }
  return clauses;
}
function instructionAmount(clause, verb, fallback = 1) {
  const match = clause.match(
    new RegExp(
      String.raw`\b${verb}\s+(?:up to\s+)?(\d+|a|an|one|two|three|four|five)\b`
    )
  );
  if (match) return clamp2(writtenNumber(match[1]), 1, 12);
  if (new RegExp(String.raw`\b${verb}\s+(?:your|their)\s+hand\b`).test(clause)) {
    return 2;
  }
  if (new RegExp(String.raw`\b${verb}\s+(?:this|that)\b`).test(clause)) {
    return 1;
  }
  return fallback;
}
var discardDirectionCache = /* @__PURE__ */ new Map();
function discardDirection(text) {
  const cached = discardDirectionCache.get(text);
  if (cached) return cached;
  const selfAmount = controllerInstructionClauses(text, "discard").reduce(
    (total, clause) => total + instructionAmount(clause, "discard"),
    0
  );
  let opponentAmount = 0;
  for (const match of text.matchAll(
    /\b(?:an? opponent|each opponent|opponents?|they)\s+(?:may\s+)?discards?\s+(?:(\d+|a|an|one|two|three|four|five)\b|that card\b|their hand\b)/g
  )) {
    const instruction = match[0] ?? "";
    opponentAmount += /\btheir hand\b/.test(instruction) ? 2 : writtenNumber(match[1]);
  }
  return rememberRuleAnalysis(discardDirectionCache, text, {
    selfAmount,
    opponentAmount,
    symmetric: /\beach player discards?\b|\byou and each opponent discard\b/.test(text),
    payoff: /\bwhen you discard\b|\bif you(?:'ve| have) discarded\b|\bwhen (?:one or more|a) cards? (?:is|are) discarded\b|\bwhen (?:this|me|i) (?:is|am) discarded\b|\bwhen\b[^.!?]{0,64}\b(?:this|me)\b[^.!?]{0,32}\bdiscarded\b|\bfor each cards? (?:you )?discarded\b|\bcards? (?:you )?discarded this turn\b/.test(
      text
    )
  });
}
var removalDirectionCache = /* @__PURE__ */ new Map();
var gearInteractionDirectionCache = /* @__PURE__ */ new Map();
function gearInteractionDirection(text) {
  const cached = gearInteractionDirectionCache.get(text);
  if (cached) return cached;
  const friendlySupport = /\bwhen you play (?:a |an |another |the |non-token )*gear\b|\bwhen you (?:attach|activate|use) (?:a |an |the )*(?:gear|equipment)\b|\bfor each (?:friendly )?(?:gear|equipment)(?: you control)?\b|\b(?:gear|equipment) you control\b|\byour (?:non-token )*(?:gear|equipment)\b|\beach equipment in your hand\b|\bequipped (?:friendly )?unit\b|\b(?:gear|equipment) from your (?:trash|hand|main deck)\b|\bif (?:it|the top card) (?:is|was) a gear\b|\byou control (?:\d+|two|three|four|five|seven) or more (?:other )?gear\b|\b(?:kill|return|ready|exhaust|attach|detach|empower|disempower)\b[^.!?]{0,40}\bfriendly\b[^.!?]{0,24}\b(?:gear|equipment)\b/.test(
    text
  );
  const hostileOrSymmetric = /\bkill all gear\b|\beach player\b[^.!?]{0,48}\bgear\b|\b(?:enemy|opponent'?s) gear\b|\bopponents? plays? a gear\b|\breturn all\b[^.!?]{0,32}\bgear\b|\b(?:kill|banish|return|give) (?:a|an|all) gear\b/.test(
    text
  );
  return rememberRuleAnalysis(gearInteractionDirectionCache, text, {
    friendlySupport,
    hostileOrSymmetric
  });
}
function removalDirection(text) {
  const cached = removalDirectionCache.get(text);
  if (cached) return cached;
  let killCount = 0;
  let banishCount = 0;
  let friendlyKillCount = 0;
  let banishEnabler = false;
  let trashBanish = false;
  for (const clause of controllerInstructionClauses(text, "kill|banish")) {
    const verb = clause.startsWith("kill") ? "kill" : "banish";
    const enemyTarget = /\b(?:enemy|opponent'?s|attacking)\b/.test(clause);
    const friendlyTarget = !enemyTarget && /\b(?:me|myself|this|friendly|your|you control|of your)\b/.test(clause);
    const selfCleanup = verb === "banish" && /\bbanish (?:me|this)\b/.test(clause);
    const sourceZone = /\bfrom (?:your |the )?(?:trash|hand|main deck)\b|\bfrom among\b|\bamong (?:them|those cards)\b/.test(
      clause
    );
    const transient = /\bthen (?:play|return|put) (?:it|them|that card|those cards)\b|\bplay (?:it|them) [^.!?]{0,24}\bignoring\b/.test(
      clause
    );
    const boardObject = /\b(?:units?|gear)\b/.test(clause);
    const genericBoardTarget = boardObject && !friendlyTarget && !sourceZone && !transient;
    const gearOnly = /\bgear\b/.test(clause) && !/\bunits?\b/.test(clause);
    const costLimit = clause.match(
      /\b(?:energy cost|costs?|might)\s+(?:of\s+)?(?:no more than|at most|up to)\s*\[?(\d+)\]?/
    );
    const scopeWeight = (gearOnly ? 0.6 : 1) * (costLimit ? Math.min(0.9, 0.25 + Number(costLimit[1]) * 0.13) : 1);
    if (verb === "kill") {
      if (friendlyTarget) friendlyKillCount += 1;
      if (enemyTarget || genericBoardTarget) killCount += scopeWeight;
    } else {
      if (enemyTarget || genericBoardTarget) banishCount += scopeWeight;
      if (!selfCleanup && !transient && (enemyTarget || genericBoardTarget || sourceZone || /\b(?:cards?|it|them)\b/.test(clause))) {
        banishEnabler = true;
      }
      if (!transient && /\bfrom (?:your |the )?trash\b/.test(clause)) {
        trashBanish = true;
      }
    }
  }
  const enemyReplacement = /\b(?:enemy|opponent'?s) unit\b[^.!?]{0,48}\bwould die\b[^.!?]{0,48}\bbanish (?:it|them) instead\b/.test(
    text
  );
  if (enemyReplacement) {
    banishCount += 1;
    banishEnabler = true;
  }
  const handDisruptionCount = /\b(?:choose|chosen)\b[^]{0,64}\bopponent\b[^]{0,128}\breveal\b[^]{0,128}\bchoose a card\b[^]{0,64}\bbanish it\b|\bbanish\b[^.!?]{0,48}\bfrom (?:an? |the )?opponent'?s hand\b/.test(
    text
  ) ? 1 : 0;
  if (handDisruptionCount > 0) banishEnabler = true;
  return rememberRuleAnalysis(removalDirectionCache, text, {
    killCount,
    banishCount,
    friendlyKillCount,
    handDisruptionCount,
    banishEnabler,
    banishPayoff: /\bwhen you banish\b|\bwhenever\b[^.!?]{0,48}\byou banish\b|\bfor each banished\b|\bwhen (?:a|one or more) cards? (?:is|are) banished\b/.test(
      text
    ),
    trashBanish,
    deathPayoff: /\[deathknell\]|\bwhen\b[^,.!?]{0,48}\b(?:you kill|dies?|died|is killed)\b|\bwhenever\b[^,.!?]{0,48}\b(?:dies?|died|is killed)\b|\bif\b[^,.!?]{0,48}\bkills?\b|\bfor each\b[^,.!?]{0,48}\b(?:died|in your trash)\b/.test(
      text
    )
  });
}
var damageDirectionCache = /* @__PURE__ */ new Map();
function damageDirection(text) {
  const cached = damageDirectionCache.get(text);
  if (cached) return cached;
  let hostileAmount = 0;
  let friendlyAmount = 0;
  let previousHostile = 0;
  let previousFriendly = 0;
  for (const clause of controllerInstructionClauses(text, "deal", true)) {
    const effect = clause.split(/\bthen\b/, 1)[0] ?? clause;
    const amount = instructionAmount(effect, "deal", 0);
    if (amount <= 0) continue;
    const enemyTarget = /\b(?:enemy|opponent'?s)\b/.test(effect);
    const friendlyTarget = !enemyTarget && /\b(?:me|myself|friendly|your|you control)\b/.test(effect);
    const symmetricTarget = !enemyTarget && !friendlyTarget && /\ball units\b/.test(effect);
    const replacement = /\binstead\b/.test(effect);
    if (enemyTarget || !friendlyTarget) {
      hostileAmount += replacement && previousHostile > 0 ? (amount - previousHostile) * 0.5 : amount;
      previousHostile = amount;
    }
    if (friendlyTarget || symmetricTarget) {
      friendlyAmount += replacement && previousFriendly > 0 ? (amount - previousFriendly) * 0.5 : amount;
      previousFriendly = amount;
    }
  }
  return rememberRuleAnalysis(damageDirectionCache, text, {
    hostileAmount,
    friendlyAmount
  });
}
var returnDirectionCache = /* @__PURE__ */ new Map();
function returnDirection(text) {
  const cached = returnDirectionCache.get(text);
  if (cached) return cached;
  let enemyCount = 0;
  let friendlyCount = 0;
  let flexibleCount = 0;
  let symmetric = false;
  for (const clause of controllerInstructionClauses(
    text,
    "return|recall",
    true
  )) {
    const verb = clause.startsWith("recall") ? "recall" : "return";
    const boardUnit = /\bunits?\b/.test(clause) && (verb === "recall" || /\bto (?:its|their|the) owner(?:'s|s')? hands?\b/.test(clause));
    const sourceZone = /\bfrom (?:your |the )?(?:trash|hand|main deck)\b/.test(
      clause
    );
    if (!boardUnit || sourceZone) continue;
    const enemyTarget = /\b(?:enemy|opponent'?s) units?\b/.test(clause);
    const friendlyTarget = /\b(?:friendly units?|units? you control|your units?)\b/.test(clause);
    const allUnits = !enemyTarget && !friendlyTarget && /\b(?:all|each) units?\b/.test(clause);
    if (allUnits) {
      symmetric = true;
      continue;
    }
    if (enemyTarget) {
      enemyCount += /\ball enemy units\b|\beach enemy unit\b/.test(clause) ? 2 : 1;
    }
    if (friendlyTarget) {
      friendlyCount += /\ball friendly units\b|\beach friendly unit\b/.test(
        clause
      ) ? 2 : 1;
    }
    if (!enemyTarget && !friendlyTarget && /\b(?:up to (?:one|two|\d+) |an? |one |chosen |target )?units?\b/.test(
      clause
    )) {
      flexibleCount += instructionAmount(clause, verb, 1);
    }
  }
  if (/\beach player\b[^.!?]{0,48}\bmay return\b[^.!?]{0,48}\bunits?\b[^.!?]{0,32}\bowner(?:'s|s')? hands?\b/.test(
    text
  )) {
    symmetric = true;
  }
  return rememberRuleAnalysis(returnDirectionCache, text, {
    enemyCount,
    friendlyCount,
    flexibleCount,
    symmetric
  });
}
var mightReductionDirectionCache = /* @__PURE__ */ new Map();
function mightReductionDirection(text) {
  const cached = mightReductionDirectionCache.get(text);
  if (cached) return cached;
  let hostileAmount = 0;
  let friendlyAmount = 0;
  for (const clause of text.split(/[.!?;]+/)) {
    const amount = sumCapturedNumbers(
      clause,
      /\b(?:give|gets?|have|has) [^.!?]{0,42}-(\d+) (?:\[[ms]\]|might\b)/g
    );
    if (amount <= 0) continue;
    const enemyTarget = /\b(?:enemy|opponent'?s|attacking|defending) units?\b/.test(clause);
    const friendlyTarget = !enemyTarget && /\b(?:friendly units?|units? you control|your units?|me|myself)\b/.test(
      clause
    );
    const flexibleTarget = !enemyTarget && !friendlyTarget && /\b(?:an? |one |chosen |target )units?\b/.test(clause) && !/\b(?:all|each) units?\b/.test(clause);
    if (enemyTarget) hostileAmount += amount;
    else if (friendlyTarget) friendlyAmount += amount;
    else if (flexibleTarget) hostileAmount += amount;
  }
  return rememberRuleAnalysis(mightReductionDirectionCache, text, {
    hostileAmount,
    friendlyAmount
  });
}
var tokenDirectionCache = /* @__PURE__ */ new Map();
function tokenDirection(text) {
  const cached = tokenDirectionCache.get(text);
  if (cached) return cached;
  const controllerClauses = controllerInstructionClauses(
    text,
    "play|create",
    true
  ).filter(
    (clause) => /\btokens?\b/.test(clause) && !/\bnon-token\b/.test(clause)
  );
  const opponentClauses = [
    ...text.matchAll(
      /\b(?:an? opponent|each opponent|opponents?|they)\b[^.!?]{0,48}\b(?:may\s+)?plays?\b[^.!?]{0,80}\btokens?\b[^.!?]*/g
    )
  ].map((match) => (match[0] ?? "").replace(/\bplays\b/g, "play"));
  const opponentText = opponentClauses.join(". ");
  const opponentBoard = opponentText ? tokenBoardValue(opponentText).value : 0;
  return rememberRuleAnalysis(tokenDirectionCache, text, {
    controllerText: controllerClauses.join(". "),
    controllerProduces: controllerClauses.length > 0,
    opponentValue: opponentClauses.length > 0 ? Math.max(0.2, opponentBoard) : 0,
    matters: /\bwhen you play (?:a|one or more) tokens?\b|\btokens? you control\b|\bfor each tokens?\b|\bif you control (?:a|one or more) tokens?\b/.test(
      text
    )
  });
}
var burnDirectionCache = /* @__PURE__ */ new Map();
function burnDirection(text) {
  const cached = burnDirectionCache.get(text);
  if (cached) return cached;
  const opponentPattern = /\b(?:an? opponent|each opponent|opponents?|they|chosen player)\b[^.!?]{0,32}(?:\[burn (\d+)\]|\bburns?\s+(\d+)\b)/g;
  let opponentAmount = 0;
  for (const match of text.matchAll(opponentPattern)) {
    opponentAmount += Number(match[1] ?? match[2] ?? 0);
  }
  const selfText = text.replaceAll(opponentPattern, " ");
  let selfAmount = 0;
  for (const match of selfText.matchAll(/\[burn (\d+)\]|\bburn (\d+)\b/g)) {
    selfAmount += Number(match[1] ?? match[2] ?? 0);
  }
  const symmetric = text.match(
    /\beach player\b[^.!?]{0,24}(?:\[burn (\d+)\]|\bburns?\s+(\d+)\b)/
  );
  if (symmetric) {
    const amount = Number(symmetric[1] ?? symmetric[2] ?? 0);
    selfAmount = Math.max(selfAmount, amount);
    opponentAmount = Math.max(opponentAmount, amount);
  }
  return rememberRuleAnalysis(burnDirectionCache, text, {
    selfAmount,
    opponentAmount,
    payoff: /\bwhen you burn\b|\bwhen (?:a|one or more) cards? (?:is|are) burned\b|\bcards? burned this turn\b|\bfor each burned\b/.test(
      text
    )
  });
}
var scoringDirectionCache = /* @__PURE__ */ new Map();
function scoringDirection(text) {
  const cached = scoringDirectionCache.get(text);
  if (cached) return cached;
  let ownPoints = controllerInstructionClauses(text, "score").reduce(
    (total, clause) => total + instructionAmount(clause, "score", 0),
    0
  );
  for (const match of text.matchAll(/\band score (\d+)\b/g)) {
    const before = text.slice(0, match.index ?? 0);
    const localClause = before.slice(
      Math.max(
        before.lastIndexOf("."),
        before.lastIndexOf("!"),
        before.lastIndexOf("?"),
        before.lastIndexOf(";"),
        before.lastIndexOf(":"),
        before.lastIndexOf(",")
      ) + 1
    );
    if (!/\b(?:opponents?|they|chosen player|each player)\b/.test(localClause)) {
      ownPoints += Number(match[1] ?? 0);
    }
  }
  for (const match of text.matchAll(
    /\b(?:pay|kill|exhaust)\b[^.!?]{0,48}\bto score (\d+)\b/g
  )) {
    ownPoints += Number(match[1] ?? 0);
  }
  let opponentPoints = 0;
  for (const match of text.matchAll(
    /\b(?:each opponent|opponents?|they)\s+(?:may\s+)?scores?\s+(\d+)\b/g
  )) {
    opponentPoints += Number(match[1] ?? 0);
  }
  return rememberRuleAnalysis(scoringDirectionCache, text, {
    ownPoints,
    opponentPoints,
    denial: /\bopponents? can'?t score\b|\bopponents? cannot score\b/.test(
      text
    ),
    symmetricLock: /\bplayers? can'?t score\b|\bplayers? cannot score\b/.test(
      text
    )
  });
}
var movementDirectionCache = /* @__PURE__ */ new Map();
function movementDirection(text) {
  const cached = movementDirectionCache.get(text);
  if (cached) return cached;
  let friendlyCount = 0;
  let enemyCount = 0;
  for (const clause of controllerInstructionClauses(text, "move")) {
    const amount = instructionAmount(
      clause,
      "move",
      /\bany number\b/.test(clause) ? 2 : 1
    );
    if (/\b(?:enemy|opponent'?s|attacking)\b/.test(clause)) {
      enemyCount += amount;
    } else {
      friendlyCount += amount;
    }
  }
  for (const match of text.matchAll(
    /\b(?:you may )?pay\b[^.!?]{0,32}\bto move\b([^.!?]*)/g
  )) {
    const clause = `move${match[1] ?? ""}`;
    const amount = instructionAmount(clause, "move", 1);
    if (/\b(?:enemy|opponent'?s|attacking)\b/.test(clause)) {
      enemyCount += amount;
    } else {
      friendlyCount += amount;
    }
  }
  return rememberRuleAnalysis(movementDirectionCache, text, {
    friendlyCount,
    enemyCount,
    payoff: /\b(?:when|whenever|after) [^,.!?]{0,48}\bmov(?:e|es|ed|ing)\b|\b(?:first|second|third|next) time [^,.!?]{0,40}\bmove\b|\bif [^,.!?]{0,40}\bmoved\b/.test(
      text
    ),
    lock: /\b(?:enemy )?units? can'?t move\b|\b(?:enemy )?units? cannot move\b/.test(
      text
    ),
    tax: /\bopponents? must pay\b[^.!?]{0,64}\bto move\b/.test(text),
    symmetricOption: /\b(?:a|each) player\b[^.!?]{0,64}\bmay move\b|\bthey may move another unit they control\b/.test(
      text
    ),
    selfRestriction: /\b(?:i|this unit) can'?t move\b|\b(?:i|this unit) cannot move\b/.test(
      text
    )
  });
}
function deriveTraits(card) {
  const text = rulesForScoring(card);
  const traits = /* @__PURE__ */ new Set();
  const has = (pattern) => pattern.test(text);
  const discard = discardDirection(text);
  const removal = removalDirection(text);
  const damage = damageDirection(text);
  const returns = returnDirection(text);
  const mightReduction = mightReductionDirection(text);
  const tokens = tokenDirection(text);
  const burn = burnDirection(text);
  const scoring = scoringDirection(text);
  const movement = movementDirection(text);
  const ready = readyInteractionDirection(text);
  const gearInteraction = gearInteractionDirection(text);
  if (card.type === "unit") traits.add("unit");
  if (card.type === "spell") traits.add("spell");
  if (card.type === "gear") traits.add("gear");
  if (isEquipmentCard(card)) traits.add("equipment");
  if (card.type.includes("unit") && card.type.includes("gear") || card.superTypes?.some((type) => type.toLocaleLowerCase() === "gear") || card.accessibilityText?.toLocaleLowerCase().startsWith("riftbound unit, gear:")) {
    traits.add("unit");
    traits.add("gear");
    traits.add("unit-gear");
  }
  if (has(/\[action\]/)) traits.add("action");
  if (has(/\[reaction\]/)) traits.add("reaction");
  if (has(/\[accelerate\]/)) traits.add("accelerate");
  if (has(/\[ambush\]/)) traits.add("ambush");
  if (has(/\[assault(?: \d+)?\]/)) traits.add("assault");
  if (has(/\[backline\]/)) traits.add("backline");
  if (has(/\[deflect(?: \d+)?\]/)) traits.add("deflect");
  if (has(/\[equip\]/)) traits.add("equip");
  if (has(/\[ganking\]|\bganking\b/)) traits.add("ganking");
  if (has(/\[hidden\]/)) traits.add("hidden");
  if (has(/\[legion\]/)) traits.add("legion");
  if (has(/\[mighty\]/)) traits.add("mighty");
  if (has(/\[quick-draw\]/)) {
    traits.add("quick-draw");
    traits.add("reaction");
    traits.add("equip");
  }
  if (has(/\[repeat\]/)) traits.add("repeat");
  if (has(/\[shield(?: \d+)?\]/)) traits.add("shield");
  if (has(/\[stun\]|\bstun(?:ned)?\b/)) traits.add("stun");
  if (has(/\[tank\]/)) traits.add("tank");
  if (has(/\[temporary\]/)) traits.add("temporary");
  if (has(/\[unique\]/)) traits.add("unique");
  if (has(/\[vision\]/)) traits.add("vision");
  if (has(/\[weaponmaster\]/)) {
    traits.add("weaponmaster");
    traits.add("equip");
    traits.add("equipment-matters");
  }
  if (has(/\[empower\]|\bempower (?:a|an|another|up to|me|this|something)/)) {
    traits.add("empower");
  }
  if (has(/\[empowered\]|if (?:i|'?m|it|'?s|they|'?re).*empowered/)) {
    traits.add("empowered-payoff");
  }
  if (has(/\bdisempower\b/)) traits.add("disempower");
  if (has(/\[flow\]|play (?:this|cards?) from (?:your )?trash/)) {
    traits.add("flow");
    traits.add("trash-payoff");
  }
  if (has(/\[hunt(?: \d+)?\]|\bgain \d+ xp\b/)) traits.add("hunt");
  if (has(/\[level \d+\]/)) traits.add("level");
  if (has(/\bspend \d+ xp\b|\bpay \d+ xp\b|\byour xp\b/)) {
    traits.add("xp-spend");
  }
  if (burn.selfAmount > 0) {
    traits.add("burn-self");
    traits.add("trash-filler");
  }
  if (burn.opponentAmount > 0) {
    traits.add("burn-opponent");
  }
  if (burn.payoff) {
    traits.add("burn-payoff");
  }
  if (has(
    /from (?:your|the) trash|in (?:your|the) trash|cards? in (?:your|the) trash|trash has/
  )) {
    traits.add("trash-payoff");
  }
  if (has(
    /(?:return|put|choose|play) (?:a|an|up to \d+|target)? ?cards?.{0,30}from (?:your|the) trash/
  )) {
    traits.add("trash-retrieval");
  }
  if (removal.trashBanish) {
    traits.add("trash-banish");
  }
  if (removal.banishPayoff) {
    traits.add("banish-payoff");
  }
  if (removal.banishEnabler) traits.add("banish-enabler");
  const buffProductionText = text.replaceAll(/\bwhen you buff\b[^,.]*/g, "").replaceAll(/\bwhen (?:a|one or more|the) buffed\b[^,.]*/g, "").replaceAll(/\bwhile [^,.]*buffed\b/g, "");
  if (/\b(?:buff|\[buff\]) (?:me|a|an|another|all|each|friendly|up to|one|this)\b/.test(
    buffProductionText
  )) {
    traits.add("buff-producer");
  }
  if (has(
    /spend.{0,28}buff|for each.{0,20}buff|if [^,.]*buff|while [^,.]*buffed|buffed friendly|when you buff/
  )) {
    traits.add("buff-consumer");
  }
  if (removal.killCount > 0 || removal.friendlyKillCount > 0 || removal.deathPayoff || has(/\bdies?\b|deathknell/)) {
    traits.add("death");
  }
  if (removal.friendlyKillCount > 0 || has(/\bsacrifice\b/)) {
    traits.add("death-enabler");
  }
  if (removal.deathPayoff) {
    traits.add("death-payoff");
  }
  if (discard.selfAmount > 0 || discard.symmetric) {
    traits.add("discard");
    if (has(
      /(?:^|[.!?;:—]\s*|\]\s*|,\s*|\bthen\s+)(?:you\s+(?:may\s+)?)?discard (?:the top|this|from your main deck)/
    )) {
      traits.add("trash-filler");
    }
  }
  if (discard.payoff) {
    traits.add("discard-payoff");
  }
  const drawText = text.replaceAll(/\[quick-draw\]/g, " ");
  if (/\bdraw\b|put .* into your hand/.test(drawText)) traits.add("draw");
  if (gearInteraction.friendlySupport) {
    traits.add(
      requiresFriendlyEquipment(card, text) ? "equipment-matters" : "gear-matters"
    );
  }
  if (requiresFriendlyEquipment(card, text)) {
    traits.add("equipment-matters");
  }
  if (has(/\bcounter\b/) || discard.opponentAmount > 0 || removal.killCount > 0 || removal.banishCount > 0 || removal.handDisruptionCount > 0 || damage.hostileAmount > 0 || mightReduction.hostileAmount > 0 || returns.enemyCount > 0 || returns.flexibleCount > 0 || returns.symmetric || movement.enemyCount > 0 || scoring.denial || movement.lock || movement.tax || ready.denial || gearInteraction.hostileOrSymmetric) {
    traits.add("interaction");
  }
  if (removal.killCount > 0 || removal.banishCount > 0 || returns.enemyCount > 0 || returns.flexibleCount > 0) {
    traits.add("removal");
  }
  if (damage.hostileAmount > 0 || has(
    /\bdeal damage equal to (?:its|their|that unit'?s|my) might\b|\bpay any amount of \[c\] to deal that much damage\b/
  )) {
    traits.add("damage-provider");
  }
  if (has(
    /\bany amount of (?:your|friendly) damage is enough to kill (?:an? |any |all )?enemy units?\b/
  )) {
    traits.add("lethal-damage-conversion");
  }
  if (has(/\bcounter\b/)) traits.add("counter");
  if (movement.friendlyCount > 0 || movement.enemyCount > 0 || has(
    /\[ganking\]|\bganking\b|\bgive [^.!?]{0,32}\[ganking\]\b|open battlefield/
  )) {
    traits.add("movement");
  }
  if (movement.payoff) {
    traits.add("movement-payoff");
  }
  if (has(/\bpredict\b|look at the top \d+|top \d+ cards?/)) {
    traits.add("predict");
  }
  if (has(/if the top card|revealed card|card on top|put .* on top/)) {
    traits.add("topdeck-payoff");
  }
  if (ready.self || ready.external || ready.payoff) traits.add("ready");
  if (has(/\bexhaust\b|\[t\]/)) traits.add("exhaust");
  if (has(/\brecycle\b/)) traits.add("recycle");
  if (has(/\bchannel \d+ rune/)) traits.add("channel-rune");
  if (has(/\[add\]|add \d+ energy/)) traits.add("energy-ramp");
  if (has(/runes? you control|control \d+ or (?:more|fewer) runes/)) {
    traits.add("rune-count-payoff");
  }
  if ((card.power ?? 0) >= 2) traits.add("power-demand");
  if (scoring.ownPoints > 0 || has(
    /\bconquer\b|\bhold\b|\bwhen (?:you|i) (?:conquer|hold)\b|\bif you (?:conquer|hold)\b/
  )) {
    traits.add("scoring");
  }
  if (has(
    /\b(?:when|whenever|after|if|while) [^,.!?]{0,56}\bconquer\b|\bconquer a battlefield\b/
  )) {
    traits.add("conquer");
  }
  if (has(
    /\b(?:when|whenever|after|if|while) [^,.!?]{0,56}\bhold\b|\bhold a battlefield\b/
  )) {
    traits.add("hold");
    traits.add("hold-payoff");
  }
  if (has(
    /\b(?:your|friendly|all) hold (?:effects?|abilities)\b[^.!?]{0,64}\b(?:trigger|triggers|activate|activates|happen|resolve)(?:s)?\b[^.!?]{0,32}\b(?:again|additional|extra|twice|time)\b|\bhold (?:effects?|abilities)\b[^.!?]{0,48}\btrigger an additional time\b/
  )) {
    traits.add("hold-enabler");
  }
  if (has(/when you play a spell|your spells|spell you|for each spell/)) {
    traits.add("spell-matters");
  }
  if (tokens.controllerProduces) traits.add("token");
  if (tokens.matters) {
    traits.add("token-matters");
  }
  if (has(/other friendly units|each friendly unit|two .*units|three .*units/)) {
    traits.add("wide");
  }
  if (has(/costs? (?:\[[^\]]*\])+\s*less|costs? \d+ less|reduce .* cost|discount/)) {
    traits.add("cost-reduction");
  }
  if (has(/\bcopy of\b|\bcopy (?:a|the|this)/)) traits.add("card-copy");
  if (has(/\bname a card\b|\bname a tag\b|cards? with (?:the|that) name/)) {
    traits.add("card-naming");
  }
  if (has(/\bheal\b|remove .* damage/)) traits.add("heal");
  if (has(/\bprevent .* damage|can'?t be dealt damage/)) {
    traits.add("damage-prevention");
  }
  if (has(/\bskip\b|additional turn|\bturn after this\b/)) {
    traits.add("skip");
  }
  if (has(/while .*stunned|for each stunned|if .*stunned/)) {
    traits.add("stun-payoff");
  }
  return traits;
}
var baseCardRatingBreakdownCache = /* @__PURE__ */ new WeakMap();
var TYPE_BASELINES = {
  unit: 5,
  spell: 5,
  gear: 5,
  legend: 5,
  battlefield: 5
};
var DECK_CURVE_TARGETS = {
  "standard-1v1": {
    targetDeckSize: 40,
    bands: [
      { id: "early", label: "1\u20132 Energy", minimum: 5, ideal: 8, maximum: 11 },
      { id: "setup", label: "3 Energy", minimum: 5, ideal: 8, maximum: 11 },
      { id: "mid", label: "4\u20135 Energy", minimum: 10, ideal: 14, maximum: 18 },
      { id: "top", label: "6+ Energy", minimum: 2, ideal: 5, maximum: 8 }
    ]
  },
  "vendetta-prerift": {
    targetDeckSize: 25,
    bands: [
      { id: "early", label: "1\u20132 Energy", minimum: 3, ideal: 5, maximum: 7 },
      { id: "setup", label: "3 Energy", minimum: 3, ideal: 5, maximum: 7 },
      { id: "mid", label: "4\u20135 Energy", minimum: 6, ideal: 9, maximum: 12 },
      { id: "top", label: "6+ Energy", minimum: 1, ideal: 3, maximum: 5 }
    ]
  }
};
function curveBandFor(card) {
  if (!["unit", "spell", "gear"].includes(card.type)) return null;
  const energy = finiteOr(card.energy, 0);
  if (energy <= 2) return "early";
  if (energy === 3) return "setup";
  if (energy <= 5) return "mid";
  return "top";
}
function clamp2(value, minimum, maximum) {
  if (!Number.isFinite(value)) return minimum;
  return Math.max(minimum, Math.min(maximum, value));
}
function finiteOr(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}
var normalizedRulesTextCache = /* @__PURE__ */ new Map();
function rulesForScoring(card) {
  const cached = normalizedRulesTextCache.get(card.rulesText);
  if (cached !== void 0) return cached;
  const normalized = card.rulesText.toLocaleLowerCase().replaceAll(/\([^)]*\)/g, " ").replaceAll(/\s+/g, " ").trim();
  return rememberRuleAnalysis(
    normalizedRulesTextCache,
    card.rulesText,
    normalized
  );
}
function isEquipmentCard(card) {
  if (card.type !== "gear") return false;
  return card.tags.some((tag) => tag.toLocaleLowerCase() === "equipment") || /\[(?:equip|quick-draw)\]/.test(rulesForScoring(card));
}
function requiresFriendlyEquipment(card, text) {
  if (isEquipmentCard(card)) return false;
  return /\[weaponmaster\]/.test(text) || /\bchoose a unit and an equipment with the same controller\b/.test(text) || /\bequipped friendly unit\b|\bif (?:it|that unit|the unit|i|this unit) (?:is |'?s )?equipped\b/.test(
    text
  ) || /\b(?:each|an?|one|its|that|the|your) equipment attached to (?:me|it|that unit|the unit|a friendly unit)\b/.test(
    text
  ) || /\bwhen you attach an equipment to me\b/.test(text) || /\b(?:you may )?play an equipment\b/.test(text) || /\b(?:each|for each) equipment (?:in your hand|you control)\b/.test(text) || /\byour equipment(?:s)?\b/.test(text) || /\b(?:kill|sacrifice) (?:an?|one|the) equipment you control\b/.test(text) || /\battach that equipment to that unit\b|\battach one of its equipment to me\b/.test(
    text
  ) || /\battach (?:an?|one of your|a detached|an attached) equipment (?:you control|with the same controller)?\b/.test(
    text
  );
}
var readyProviderTargetsCache = /* @__PURE__ */ new Map();
var readyInteractionDirectionCache = /* @__PURE__ */ new Map();
function readyProviderTargets(text) {
  const cached = readyProviderTargetsCache.get(text);
  if (cached) return cached;
  const targets = {
    unit: false,
    gear: false,
    legend: false
  };
  for (const clause of controllerInstructionClauses(text, "ready", true)) {
    if (/\b(?:me|myself|itself|this card)\b/.test(clause) && !/\b(?:another|besides me)\b/.test(clause)) {
      continue;
    }
    if (/\bsomething (?:else|besides me)\b/.test(clause)) {
      targets.unit = true;
      targets.gear = true;
      targets.legend = true;
      continue;
    }
    if (/\b(?:unit|units)\b/.test(clause)) targets.unit = true;
    if (/\b(?:gear|equipment)\b/.test(clause)) targets.gear = true;
    if (/\blegend\b/.test(clause)) targets.legend = true;
  }
  return rememberRuleAnalysis(readyProviderTargetsCache, text, targets);
}
function readyInteractionDirection(text) {
  const cached = readyInteractionDirectionCache.get(text);
  if (cached) return cached;
  const readyInstructions = controllerInstructionClauses(text, "ready", true);
  const controllerReadyInstructions = readyInstructions.filter(
    (clause) => !/\b(?:enemy|opponent'?s)\b/.test(clause) && !/\b(?:each|every|all) players?\b/.test(clause) && !/\b(?:can'?t|cannot|prevent(?:s|ed|ing)?)\b[^.!?]{0,32}\bready\b/.test(
      clause
    )
  );
  const self = /\[accelerate\]|\bready (?:me|myself|this card)\b|\b(?:i|this (?:unit|gear|legend|card)) enters? ready\b/.test(
    text
  ) || controllerReadyInstructions.some(
    (clause) => /\bready (?:me|myself|this card)\b/.test(clause)
  );
  const external = controllerReadyInstructions.some(
    (clause) => !/\bready (?:me|myself|this card)\b/.test(clause)
  ) || /\b(?:friendly units?|your (?:units?|tokens?)|(?:the next |other )?units? you play) enters? ready\b/.test(
    text
  );
  const payoff = /\b(?:when|whenever|after) [^,.!?]{0,48}\b(?:becomes? ready|is readied)\b|\bwhen you ready\b/.test(
    text
  );
  const denial = /\bcan'?t ready\b|\bcannot ready\b|\bprevent(?:s|ed|ing)?\b[^.!?]{0,32}\bready\b/.test(
    text
  );
  return rememberRuleAnalysis(readyInteractionDirectionCache, text, {
    self,
    external,
    payoff,
    denial
  });
}
function canReadyCard(targets, card, traits) {
  return targets.unit && traits.has("unit") || targets.gear && traits.has("gear") || targets.legend && card.type === "legend";
}
function hasIntrinsicAssault(card, text) {
  if (card.type !== "unit") return false;
  return /(?:^|\]\s*)\[assault(?: \d+)?\]/.test(text) || /\b(?:i|this unit) (?:gain|gains|have|has|get|gets) \[assault(?: \d+)?\]/.test(
    text
  );
}
function hasReusableSelfTrigger(text) {
  for (const match of text.matchAll(
    /\b(?:when|whenever|after) (?:i|this (?:unit|gear|legend)) (?:attack|move|conquer|score)\b[^,.!?]*,\s*([^.!?]*)/g
  )) {
    const effect = match[1] ?? "";
    if (/\b(?:draw|deal|give|gain|play|score|burn|discard|stun|kill|banish|channel|recycle|return|move)\b/.test(
      effect.replaceAll(/\bready (?:me|this card)\b/g, "")
    )) {
      return true;
    }
  }
  return false;
}
function isRepeatableReadyRecipient(card, text) {
  return hasIntrinsicAssault(card, text) || /\[t\]\s*:/.test(text) || hasReusableSelfTrigger(text);
}
function hasTargetedReadyPackage(provider, recipient, recipientTraits) {
  const recipientText = rulesForScoring(recipient);
  return canReadyCard(
    readyProviderTargets(rulesForScoring(provider)),
    recipient,
    recipientTraits
  ) && isRepeatableReadyRecipient(recipient, recipientText);
}
function grantsAssaultToEquipment(text) {
  return /\byour equipment(?:s)? (?:each )?(?:give|gain|have) \[assault(?: \d+)?\]/.test(
    text
  ) || /\bequipment(?:s)? you control (?:each )?(?:give|gain|have) \[assault(?: \d+)?\]/.test(
    text
  );
}
function isEquipmentBeneficiary(card, traits) {
  return traits.has("equipment") && card.type !== "legend";
}
function hasEquipmentAssaultPackage(provider, beneficiary, beneficiaryTraits) {
  return grantsAssaultToEquipment(rulesForScoring(provider)) && isEquipmentBeneficiary(beneficiary, beneficiaryTraits);
}
function sumCapturedNumbers(text, pattern) {
  let total = 0;
  for (const match of text.matchAll(pattern)) {
    const value = Number(match[1]);
    if (Number.isFinite(value)) total += value;
  }
  return total;
}
function keywordMagnitude(text, keyword) {
  let total = 0;
  const pattern = new RegExp(
    `\\[${keyword}(?: (\\d+))?\\](?=\\s|[.!?,;:]|$)`,
    "g"
  );
  for (const match of text.matchAll(pattern)) {
    const printed = Number(match[1]);
    total += Number.isFinite(printed) ? printed : 1;
  }
  return total;
}
function writtenNumber(value) {
  if (!value) return 1;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const written = {
    a: 1,
    an: 1,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5
  };
  return written[value] ?? 1;
}
function tokenBoardValue(text) {
  let value = 0;
  let temporary = false;
  for (const match of text.matchAll(
    /\bplay (?:(a|an|one|two|three|four|five|\d+)\s+)?(?:ready\s+|exhausted\s+)?(\d+) \[[ms]\] [^.!?]{0,42}\bunit tokens?\b[^.!?]{0,32}/g
  )) {
    const quantity = clamp2(writtenNumber(match[1]), 1, 12);
    const might = clamp2(Number(match[2] ?? 0), 0, 20);
    const clause = match[0] ?? "";
    temporary = temporary || /\[temporary\]/.test(clause);
    value += quantity * (might * (temporary ? 0.45 : 0.85) + (temporary ? 0.15 : 0.35)) * 0.55;
  }
  return { value, temporary };
}
var ruleClauseActivationCache = /* @__PURE__ */ new Map();
var payoffClausePattern = /\b(?:counter|draw|discard|kill|banish|recall|stun|deal|score|play|ready|channel|move|return|prevent|copy|gain|give|might|take control|costs? less|reduce|add \d+ energy|buff)\b|\[(?:add|buff|flow|repeat|hunt|vision|deflect|ganking|backline|tank)\b/;
function requirementPrefixForClause(clause) {
  const firstPayoff = clause.search(payoffClausePattern);
  return firstPayoff > 0 ? clause.slice(0, firstPayoff) : clause;
}
function ordinalTriggerNumber(clause) {
  const match = clause.match(
    /\b(?:the\s+)?(first|second|third|fourth|fifth|\d+(?:st|nd|rd|th))\s+time\b/
  );
  if (!match) return null;
  const written = {
    first: 1,
    second: 2,
    third: 3,
    fourth: 4,
    fifth: 5
  };
  return written[match[1] ?? ""] ?? Number.parseInt((match[1] ?? "").replaceAll(/\D/g, ""), 10) ?? null;
}
function ordinalActivationMultiplier(ordinal) {
  if (ordinal === null || ordinal <= 0) return 1;
  if (ordinal === 1) return 0.85;
  if (ordinal === 2) return 0.65;
  if (ordinal === 3) return 0.45;
  if (ordinal === 4) return 0.32;
  return 0.22;
}
function accumulatedStateRequirementCount(clause) {
  const match = clause.match(
    /\bif there (?:is|are) (?:exactly )?(a|an|one|two|three|four|five|\d+) (?:[^,.!?]{0,32}\s)?(?:cards?|spells?|units?|gear|runes?|tokens?)\b[^,.!?]{0,56}\b(?:with|under|on) (?:me|this(?: card| unit| gear| legend)?)\b/
  );
  if (!match) return 1;
  return clamp2(writtenNumber(match[1]), 1, 12);
}
function requiredSacrificeCountForPayoff(clause) {
  const match = clause.match(
    /\b(?:kill|sacrifice) (a|an|one|two|three|four|five|\d+) (?:other )?(?:friendly )?(?:units?|gear|cards?|tokens?)(?: and\/or (?:friendly )?(?:units?|gear|cards?|tokens?))?\b[^.!?]{0,32}\bto (?:score|draw|play|ready|channel|deal|give|gain)\b/
  );
  if (!match) return 0;
  return clamp2(writtenNumber(match[1]), 1, 12);
}
function isActivatedAbilityClause(clause) {
  return /\[(?:t|e)\]\s*(?::|—|-)|\bexhaust (?:me|this|a|an|one|chosen)\b[^.!?]{0,32}(?::|—|-|\bto\b)|\b(?:you\s+)?(?:may\s+|can\s+|must\s+)?pay\b[^.!?]{0,56}(?::|\bto\b)|(?:^|[\n])\s*(?:\[(?:\d+|[a-z])\]\s*,?\s*)+:/i.test(
    clause
  );
}
function requiredAllTagNames(text) {
  const serialized = text.match(
    /\ball of the following tags\b[^—:\n]*(?:—|:)\s*([^.\n]+)/i
  )?.[1];
  if (!serialized) return [];
  return [
    ...new Set(
      serialized.split(/\s*,\s*|\s+(?:and|or)\s+/i).map(
        (tag) => tag.replaceAll(/[^\p{L}\p{N}' -]/gu, "").replace(/^(?:and|or)\s+/i, "").replaceAll(/\s+/g, " ").trim().toLocaleLowerCase()
      ).filter(Boolean)
    )
  ];
}
function independentRequirementCount(clause) {
  const requirementText = requirementPrefixForClause(clause);
  const explicitConditions = countMatches(
    requirementText,
    /\bif\b|\bunless\b|\bprovided that\b|\bonly if\b|\bwhile\b/g
  );
  const taggedRequirements = requiredAllTagNames(clause).length;
  const conditionStart = requirementText.search(
    /\b(?:if|unless|provided that|only if|while)\b/
  );
  const conditionText = conditionStart >= 0 ? requirementText.slice(conditionStart).replace(
    /,\s*(?:you|your|i|they|it|this|that|opponents?|players?|chosen player|each player)\b[\s\S]*$/i,
    ""
  ).replace(/,\s*$/, "") : "";
  const listCommas = countMatches(conditionText, /,/g);
  const listConjunctions = countMatches(
    conditionText.replaceAll(/\band\/or\b|\bor\b/g, " "),
    /\band\b|\bas well as\b/g
  );
  const oxfordConjunctions = countMatches(
    conditionText,
    /,\s*(?:and|as well as)\b/g
  );
  const serializedRequirementCount = conditionStart >= 0 ? Math.max(1, 1 + listCommas + listConjunctions - oxfordConjunctions) : 0;
  const stateQualifiedTarget = /\b(?:stunned|damaged|buffed|exhausted|ready) (?:enemy |friendly |opponent'?s )?(?:units?|gear)\b[^.!?]{0,48}\b(?:have|has|gets?|can'?t|cannot|costs?)\b/.test(
    requirementText
  );
  const implicitStateRequirements = stateQualifiedTarget ? 1 + (/\bhere\b|\bat (?:a|the|this) battlefield\b/.test(requirementText) ? 1 : 0) : 0;
  if (explicitConditions === 0 && taggedRequirements === 0 && implicitStateRequirements === 0) {
    return 1;
  }
  const conjuncts = countMatches(
    requirementText.replaceAll(/\band\/or\b|\bor\b/g, " "),
    /\band\b|\bas well as\b/g
  );
  return Math.max(
    1,
    explicitConditions,
    explicitConditions > 0 ? 1 + conjuncts : 1,
    serializedRequirementCount,
    taggedRequirements,
    implicitStateRequirements
  );
}
function paymentBurdenForClause(clause) {
  const burdens = [];
  for (const match of clause.matchAll(
    /\bpay\s+((?:\[[^\]]+\]\s*)+)(?=\bto\b|:|\bfor\b)/g
  )) {
    const matchIndex = match.index ?? 0;
    const prefix = clause.slice(Math.max(0, matchIndex - 32), matchIndex);
    if (/\b(?:opponent|controller|enemy|each player|any player)\b/.test(prefix)) {
      continue;
    }
    const mechanicPrefix = clause.slice(
      Math.max(0, matchIndex - 80),
      matchIndex
    );
    if (/\[(?:accelerate|empower)\b/.test(mechanicPrefix)) continue;
    burdens.push(printedActivationBurden(match[1] ?? ""));
  }
  for (const match of clause.matchAll(
    /(?:^|[.!?;\n])\s*((?:\[(?:\d+|[a-z])\]\s*,?\s*)+)(?:\[(?:t|exhaust)\]\s*,?\s*)?:/g
  )) {
    const surrounding = match[0] ?? "";
    if (/\[(?:accelerate|empower)\b/.test(surrounding)) continue;
    burdens.push(printedActivationBurden(match[1] ?? ""));
  }
  return round(Math.max(0, ...burdens), 3);
}
function analyzeRuleClause(clause, reactionCard) {
  const playTrigger = /\b(?:as|when|whenever) you play (?:me|this)\b|\bwhen (?:i|this card) enters\b/.test(
    clause
  );
  const counterClause = /\bcounter\b/.test(clause);
  const counterReaction = reactionCard && counterClause;
  const ordinal = ordinalTriggerNumber(clause);
  const requirementCount = independentRequirementCount(clause);
  const triggerText = requirementPrefixForClause(clause);
  const triggerLead = /\b(?:when|whenever|after|if|while)\b|\b(?:first|second|third|fourth|fifth|\d+(?:st|nd|rd|th)) time\b/;
  const hasTriggerLead = triggerLead.test(clause) || ordinal !== null;
  const triggerPriors = [];
  if (hasTriggerLead && /\b(?:when|whenever|after) you play\b/.test(clause)) {
    triggerPriors.push({ gate: "event:play", trigger: "play", value: 0.75 });
  }
  if (hasTriggerLead && /\battack(?:s|ed|ing)?\b|\bafter an attack\b/.test(clause)) {
    triggerPriors.push({
      gate: "event:attack",
      trigger: "attack",
      value: 0.55
    });
  }
  if (hasTriggerLead && /\bdefend(?:s|ed|ing)?\b/.test(clause)) {
    triggerPriors.push({
      gate: "event:defend",
      trigger: "defend",
      value: 0.45
    });
  }
  if (hasTriggerLead && /\bconquer(?:s|ed|ing)?\b/.test(clause)) {
    triggerPriors.push({
      gate: "event:conquer",
      trigger: "conquer",
      value: 0.35
    });
  }
  if (hasTriggerLead && /\bhold(?:s|ing)?\b/.test(clause)) {
    triggerPriors.push({ gate: "event:hold", trigger: "hold", value: 0.3 });
  }
  if (hasTriggerLead && /\bmov(?:e|es|ed|ing)\b/.test(clause)) {
    triggerPriors.push({ gate: "event:move", trigger: "move", value: 0.55 });
  }
  if (/\bdeathknell\b/.test(clause) || hasTriggerLead && /\b(?:die|dies|died|death)\b/.test(clause)) {
    triggerPriors.push({
      gate: "event:death",
      trigger: "death",
      value: 0.55
    });
  }
  if (/\b(?:each|every|once (?:each|per)) turn\b|\bat (?:the )?(?:start|end) of\b|\bstart of your next\b/.test(
    clause
  )) {
    triggerPriors.push({ gate: "event:turn", trigger: "turn", value: 0.68 });
  }
  if (/^\s*\[level \d+\](?:\[>\])?/.test(clause)) {
    triggerPriors.push({
      gate: "state:level",
      trigger: "conditional",
      value: 0.48
    });
  }
  if (/^\s*\[empowered\](?:\[>\])?/.test(clause)) {
    triggerPriors.push({
      gate: "state:empowered",
      trigger: "conditional",
      value: 0.55
    });
  }
  if (/^\s*\[legion\](?:\[>\])?/.test(clause)) {
    triggerPriors.push({
      gate: "state:legion",
      trigger: "conditional",
      value: 0.65
    });
  }
  if (/\b(?:stunned|damaged|buffed|exhausted|ready) (?:enemy |friendly |opponent'?s )?(?:units?|gear)\b[^.!?]{0,48}\b(?:have|has|gets?|can'?t|cannot|costs?)\b/.test(
    clause
  )) {
    triggerPriors.push({
      gate: "state:qualified-target",
      trigger: "conditional",
      value: 0.48
    });
  }
  const activated = isActivatedAbilityClause(clause);
  if (activated) {
    triggerPriors.push({
      gate: "activation:payment",
      trigger: "activated",
      value: 0.62
    });
  }
  const sacrificeCount = requiredSacrificeCountForPayoff(clause);
  if (sacrificeCount > 0) {
    triggerPriors.push({
      gate: "activation:sacrifice",
      trigger: "conditional",
      value: round(clamp2(0.62 / Math.sqrt(sacrificeCount), 0.22, 0.62), 3)
    });
  }
  const independentPriors = [
    ...new Map(triggerPriors.map((prior) => [prior.gate, prior])).values()
  ];
  const hasSpecificEventPrior = independentPriors.some(
    ({ trigger: trigger2 }) => [
      "play",
      "attack",
      "defend",
      "conquer",
      "hold",
      "move",
      "death",
      "turn"
    ].includes(trigger2)
  );
  const primaryEventIntroducedByCondition = hasSpecificEventPrior && /^\s*(?:\[[^\]]+\]\s*)*(?:if|unless|only if|provided that)\b/.test(
    triggerText
  );
  const explicitConditionGateCount = Math.max(
    0,
    countMatches(
      triggerText,
      /\bif\b|\bunless\b|\bonly if\b|\bprovided that\b/g
    ) - (primaryEventIntroducedByCondition ? 1 : 0)
  );
  const hasGateBeyondActivation = independentPriors.some(({ gate }) => gate !== "activation:payment") || explicitConditionGateCount > 0;
  const composablePriors = independentPriors.filter(
    ({ gate }) => gate !== "activation:payment" || !hasGateBeyondActivation
  );
  const productOf = (priors) => priors.reduce((product, prior) => product * prior.value, 1);
  let trigger = "unconditional";
  let activation = 1;
  if (counterReaction) {
    trigger = "reaction";
  } else if (playTrigger) {
    trigger = "play";
    const additionalPriors = composablePriors.filter(
      ({ gate }) => gate !== "event:play"
    );
    if (additionalPriors.length > 0) {
      activation = productOf(additionalPriors);
      trigger = [...additionalPriors].sort(
        (left, right) => left.value - right.value
      )[0].trigger;
    }
  } else if (composablePriors.length > 0) {
    const conquerOrHold = composablePriors.some(
      ({ trigger: candidate }) => candidate === "conquer"
    ) && composablePriors.some(({ trigger: candidate }) => candidate === "hold") && /\bconquer\b[^.!?]{0,16}\bor hold\b/.test(triggerText);
    if (conquerOrHold) {
      activation = 0.325 * productOf(
        composablePriors.filter(
          ({ trigger: candidate }) => candidate !== "conquer" && candidate !== "hold"
        )
      );
      trigger = "hold";
    } else {
      const mostRestrictive = [...composablePriors].sort(
        (left, right) => left.value - right.value
      )[0];
      activation = productOf(composablePriors);
      trigger = mostRestrictive.trigger;
    }
  } else if (explicitConditionGateCount === 0 && /\b(?:if|unless|while|when|whenever|once|provided that|only if)\b|(?:^|[,;]\s*)after\b/.test(
    triggerText
  )) {
    activation = 0.68;
    trigger = "conditional";
  } else if (reactionCard) {
    activation = counterClause ? 1 : 0.9;
    trigger = "reaction";
  }
  if (!counterReaction && explicitConditionGateCount > 0) {
    activation *= Math.pow(0.68, explicitConditionGateCount);
    if (trigger === "unconditional") trigger = "conditional";
  }
  if (!counterReaction && /\b(?:counter|draw|discard|kill|banish|stun|deal|score|play|ready|channel|move|return|prevent|copy)\b[^.!?]{0,96}\b(?:if|unless|only if|provided that)\b/.test(
    clause
  )) {
    activation *= 0.78;
    if (trigger === "unconditional") trigger = "conditional";
  }
  if (!counterReaction) {
    activation *= Math.pow(0.78, Math.max(0, requirementCount - 1));
  }
  activation /= accumulatedStateRequirementCount(clause);
  activation *= ordinalActivationMultiplier(ordinal);
  return {
    text: clause,
    activation: round(clamp2(activation, 0.12, 1), 3),
    trigger,
    ordinal,
    requirementCount,
    choiceGroup: null,
    choiceKind: null,
    valueShare: 1,
    paymentBurden: paymentBurdenForClause(clause)
  };
}
function modalChoiceKindForHeader(clause) {
  if (!/[—–:-]\s*$/.test(clause)) return null;
  const opensModal = /\bchoose one\b/.test(clause) || /\b(?:choose|do) one of the following\b/.test(clause) || /\bdo the following based on\b/.test(clause);
  if (!opensModal) return null;
  return /\bbased on\b/.test(clause) ? "contingent" : "elective";
}
function clausesForScoring(card) {
  const cached = ruleClauseActivationCache.get(card.rulesText);
  if (cached) return cached;
  const normalized = card.rulesText.toLocaleLowerCase().replaceAll(/\([^)]*\)/g, " ").replaceAll(/\r/g, "\n").replaceAll(/[ \t]+/g, " ");
  const reactionCard = /\[reaction\]/.test(normalized);
  const rawClauses = normalized.split(/(?:\n+|[.!?;]+\s*)/).map((clause) => clause.replaceAll(/\s+/g, " ").trim()).filter(Boolean).filter((clause) => !/^\[(?:reaction|action)\]$/.test(clause));
  let inheritedGroupTrigger = null;
  let previousClause = null;
  let activeChoiceGroup = null;
  let activeChoiceKind = null;
  let nextChoiceGroup = 1;
  const analyzedClauses = rawClauses.map((clause) => {
    const analyzed = analyzeRuleClause(clause, reactionCard);
    const continuation = /^(?:[*•]\s*|[-–—]\s+|\[[^\]]+\]\s*(?:—|-))/.test(
      clause
    );
    const modalChoiceKind = modalChoiceKindForHeader(clause);
    const continuationHeader = modalChoiceKind !== null;
    let resolved = analyzed;
    if (continuation && inheritedGroupTrigger) {
      const parent = inheritedGroupTrigger;
      resolved = {
        ...analyzed,
        ...parent.activation < analyzed.activation ? {
          activation: parent.activation,
          trigger: parent.trigger
        } : {},
        requirementCount: Math.max(
          analyzed.requirementCount,
          parent.requirementCount
        ),
        choiceGroup: activeChoiceGroup,
        choiceKind: activeChoiceKind,
        // A cost printed on a continuation header is paid once to activate
        // the group. Child effects carry only costs printed on that child.
        paymentBurden: analyzed.paymentBurden
      };
    }
    if (continuationHeader && previousClause && previousClause.activation < resolved.activation) {
      resolved = {
        ...resolved,
        activation: previousClause.activation,
        trigger: previousClause.trigger
      };
    }
    const opensContinuationGroup = /:\s*$/.test(clause) || modalChoiceKind !== null || /\bbased on (?:its|their|the) [^:]+$/.test(clause);
    const opensChoiceGroup = modalChoiceKind !== null;
    if (opensContinuationGroup) {
      inheritedGroupTrigger = resolved;
      if (opensChoiceGroup) {
        activeChoiceGroup = nextChoiceGroup;
        activeChoiceKind = modalChoiceKind;
        nextChoiceGroup += 1;
      }
    } else if (!continuation) {
      inheritedGroupTrigger = null;
      activeChoiceGroup = null;
      activeChoiceKind = null;
    }
    previousClause = resolved;
    return resolved;
  });
  const battlefieldRestrictedAbilityIndices = /* @__PURE__ */ new Set();
  rawClauses.forEach((clause, index) => {
    const allAbilities = /^use (?:my|this (?:card|unit|gear)'?s|its) abilities only while (?:i'?m|this (?:card|unit|gear) is) at a battlefield$/.test(
      clause
    );
    const previousAbility = /^use this ability only while (?:i'?m|this (?:card|unit|gear) is) at a battlefield$/.test(
      clause
    );
    if (allAbilities) {
      for (let candidate = 0; candidate < index; candidate += 1) {
        if (isActivatedAbilityClause(rawClauses[candidate] ?? "")) {
          battlefieldRestrictedAbilityIndices.add(candidate);
        }
      }
    } else if (previousAbility) {
      for (let candidate = index - 1; candidate >= 0; candidate -= 1) {
        if (!isActivatedAbilityClause(rawClauses[candidate] ?? "")) continue;
        battlefieldRestrictedAbilityIndices.add(candidate);
        break;
      }
    }
  });
  const globallyRestrictedClauses = analyzedClauses.map(
    (clause, index) => battlefieldRestrictedAbilityIndices.has(index) ? {
      ...clause,
      activation: round(clamp2(clause.activation * 0.62, 0.12, 1), 3),
      requirementCount: clause.requirementCount + 1
    } : clause
  );
  const choiceCounts = /* @__PURE__ */ new Map();
  for (const clause of globallyRestrictedClauses) {
    if (clause.choiceGroup === null) continue;
    choiceCounts.set(
      clause.choiceGroup,
      (choiceCounts.get(clause.choiceGroup) ?? 0) + 1
    );
  }
  const clauses = globallyRestrictedClauses.map((clause) => {
    if (clause.choiceGroup === null) return clause;
    const optionCount = choiceCounts.get(clause.choiceGroup) ?? 1;
    const choiceShare = clause.choiceKind === "contingent" ? 1 / optionCount : (1 + 0.25 * Math.max(0, optionCount - 1)) / optionCount;
    return {
      ...clause,
      valueShare: round(clamp2(choiceShare, 0.2, 1), 3)
    };
  });
  return rememberRuleAnalysis(
    ruleClauseActivationCache,
    card.rulesText,
    clauses
  );
}
function activationForEffects(clauses, pattern) {
  const tester = new RegExp(pattern.source, pattern.flags.replaceAll("g", ""));
  const matches = clauses.filter(({ text }) => tester.test(text));
  if (matches.length === 0) return 1;
  return round(
    matches.reduce(
      (sum, clause) => sum + clause.activation * clause.valueShare,
      0
    ) / matches.length,
    3
  );
}
function rulesActivationFactor(clauses) {
  const payoffClauses = clauses.filter(
    ({ text }) => payoffClausePattern.test(text)
  );
  if (payoffClauses.length === 0) return 1;
  return round(
    Math.min(...payoffClauses.map(({ activation }) => activation)),
    3
  );
}
function printedActivationBurden(payment) {
  let energy = 0;
  let power = 0;
  for (const token of payment.matchAll(/\[([^\]]+)\]/g)) {
    const symbol = token[1]?.trim() ?? "";
    if (/^\d+$/.test(symbol)) {
      energy += Number(symbol);
    } else if (!["t", "e", "exhaust"].includes(symbol)) {
      power += 1;
    }
  }
  return round(
    energy + power * 1.15 + 0.25 * power * Math.max(0, power - 1),
    3
  );
}
function paymentTaxForBurden(paymentBurden) {
  return Math.min(
    1.4,
    paymentBurden * 0.16 + Math.max(0, paymentBurden - 2) * 0.04
  );
}
function activatedPaymentSummary(clauses) {
  const paymentClauses = clauses.filter(
    ({ paymentBurden }) => paymentBurden > 0
  );
  if (paymentClauses.length === 0) {
    return { maximumBurden: 0, expectedTax: 0, activation: 1 };
  }
  return {
    maximumBurden: round(
      Math.max(...paymentClauses.map(({ paymentBurden }) => paymentBurden)),
      3
    ),
    expectedTax: round(
      clamp2(
        paymentClauses.reduce(
          (sum, clause) => sum + paymentTaxForBurden(clause.paymentBurden) * clause.activation * clause.valueShare,
          0
        ),
        0,
        1.4
      ),
      3
    ),
    activation: round(
      paymentClauses.reduce(
        (sum, clause) => sum + clause.activation * clause.valueShare,
        0
      ) / paymentClauses.length,
      3
    )
  };
}
function readyTargetCount(clause, target) {
  const targetPattern = target === "unit" ? "units?" : target === "gear" ? "(?:gear|equipment)" : target === "legend" ? "legends?" : "runes?";
  const match = clause.match(
    new RegExp(
      `\\bready(?:\\s+or\\s+exhaust)?\\s+(?:up to\\s+)?(?:(a|an|one|two|three|four|five|\\d+)\\s+)?(?:another\\s+)?(?:chosen\\s+|friendly\\s+|your\\s+|this\\s+)?${targetPattern}\\b`
    )
  );
  if (!match) return null;
  if (match[1]) return clamp2(writtenNumber(match[1]), 1, 12);
  if (/\banother\b|\b(?:a|an|chosen|this)\b/.test(match[0])) return 1;
  if (target === "rune") return 4;
  if (target === "unit") return /\bunits\b/.test(match[0]) ? 3 : 1;
  if (target === "gear") return /\bgear\b/.test(match[0]) ? 2 : 1;
  return 1;
}
function readyActionEconomyValuation(card, clauses, text) {
  const contributions = [];
  const might = clamp2(finiteOr(card.might, 0), 0, 30);
  const add = (clause, label, component, rawValue, detail) => {
    if (rawValue <= 0) return;
    const markerFactor = /\[legion\]/.test(clause.text) && clause.trigger !== "conditional" ? 0.65 : 1;
    const activation = clamp2(
      clause.activation * clause.valueShare * markerFactor,
      0.12,
      1
    );
    contributions.push({
      activation,
      component,
      detail,
      label,
      rawValue,
      value: rawValue * activation
    });
  };
  for (const clause of clauses) {
    if (!/\bready\b|\breadies\b/.test(clause.text)) continue;
    const denial = /\b(?:can'?t|cannot|prevent(?:s|ed|ing)?)\b[^.!?]{0,40}\bready\b/.test(
      clause.text
    );
    const helpsOpponent = /\bready(?:\s+or\s+exhaust)?\s+(?:an?\s+|the\s+|chosen\s+)?(?:enemy|opponent'?s)\b/.test(
      clause.text
    );
    const symmetric = /\b(?:each|every|all) players?\b[^.!?]{0,48}\bread(?:y|ies)\b|\bready all (?:units?|gear|legends?|runes?)\b/.test(
      clause.text
    );
    if (denial || helpsOpponent || symmetric) continue;
    const mixedMatch = clause.text.match(
      /\bready (?:up to )?(a|an|one|two|three|four|five|\d+) (?:friendly )?(?=[^.!?]*(?:units?|gear|equipment|runes?))([^.!?]*(?:and\/or|or)[^.!?]*)/
    );
    if (mixedMatch && new Set(
      (mixedMatch[0].match(/\b(?:units?|gear|equipment|runes?)\b/g) ?? []).map(
        (target) => target === "gear" || target === "equipment" ? "gear" : target.replace(/s$/, "")
      )
    ).size >= 2) {
      const count2 = clamp2(writtenNumber(mixedMatch[1]), 1, 4);
      const total = Math.min(1.42, count2 * 0.34);
      add(
        clause,
        "Mixed ready action economy",
        "effectValue",
        total * 0.62,
        "A bounded share of the ready allocation converts units or Gear into another action."
      );
      add(
        clause,
        "Mixed rune readying",
        "resourceValue",
        total * 0.38,
        "A bounded share of the flexible ready allocation recovers Rune economy."
      );
      continue;
    }
    const readyToken = clause.text.match(
      /\bplay (?:(a|an|one|two|three|four|five|\d+)\s+)?(?:a\s+)?ready(?:\s+(\d+) \[[ms]\])? [^.!?]{0,48}\bunit tokens?\b/
    );
    if (readyToken) {
      const quantity = clamp2(writtenNumber(readyToken[1]), 1, 5);
      const tokenMight = clamp2(Number(readyToken[2] ?? 0), 0, 12);
      const temporaryFactor = /\[temporary\]/.test(clause.text) ? 0.75 : 1;
      const copyBonus = /\bbecomes? a copy\b/.test(text) ? 0.1 : 0;
      add(
        clause,
        "Ready token entry tempo",
        "effectValue",
        Math.min(
          1.35,
          quantity * (0.42 + tokenMight * 0.035 + copyBonus) * temporaryFactor
        ),
        "Ready tokens can act immediately; copied bodies receive only a small bounded conversion bonus."
      );
      continue;
    }
    const selfEntry = /\b(?:i|this (?:unit|gear|legend|card)) enters? ready\b/.test(
      clause.text
    );
    if (selfEntry) {
      add(
        clause,
        "Ready entry tempo",
        "effectValue",
        clamp2(0.3 + might * 0.015, 0.3, 0.44),
        "Entering ready converts this body's printed Might into a bounded immediate action window."
      );
      continue;
    }
    const externalEntry = /\b(?:the next |other )?(?:friendly )?(?:units?|tokens?) (?:you play )?(?:this turn )?enters? ready\b|\byour (?:units?|tokens?) enters? ready\b/.test(
      clause.text
    );
    if (externalEntry) {
      const single = /\bthe next unit\b|\bnext time\b/.test(clause.text) || /\b(?:a|one) (?:friendly )?unit\b/.test(clause.text);
      const tokenScope = /\btokens?\b/.test(clause.text);
      add(
        clause,
        tokenScope ? "Ready token entry tempo" : "Ready entry support",
        "effectValue",
        single ? 0.46 : tokenScope ? 0.5 : 0.58,
        "A future friendly body gains a bounded immediate action window instead of entering exhausted."
      );
      continue;
    }
    if (/\bready (?:me|myself|this card)\b/.test(clause.text)) {
      add(
        clause,
        "Self-ready action",
        "effectValue",
        clamp2(0.3 + might * 0.015, 0.3, 0.48),
        "Self-readying can reuse this card's action, with the larger repeat ceiling left to supported deck packages."
      );
      continue;
    }
    const runeCount = readyTargetCount(clause.text, "rune");
    const unitCount = readyTargetCount(clause.text, "unit");
    const gearCount = readyTargetCount(clause.text, "gear");
    const legendCount = readyTargetCount(clause.text, "legend");
    if (runeCount !== null) {
      add(
        clause,
        "Rune readying",
        "resourceValue",
        Math.min(1.2, runeCount * 0.3),
        `${runeCount} Rune${runeCount === 1 ? "" : "s"} recover bounded action economy.`
      );
    }
    if (unitCount !== null) {
      add(
        clause,
        "Unit readying",
        "effectValue",
        Math.min(1.2, 0.45 + Math.max(0, unitCount - 1) * 0.22),
        `${unitCount} unit action window${unitCount === 1 ? "" : "s"} can be recovered.`
      );
    }
    if (gearCount !== null) {
      add(
        clause,
        "Gear readying",
        "effectValue",
        Math.min(0.82, 0.35 + Math.max(0, gearCount - 1) * 0.23),
        `${gearCount} Gear action window${gearCount === 1 ? "" : "s"} can be recovered.`
      );
    }
    if (legendCount !== null) {
      add(
        clause,
        "Legend readying",
        "effectValue",
        0.35,
        "Legend readying recovers a bounded activated-ability window."
      );
    }
    const hasTypedTarget = runeCount !== null || unitCount !== null || gearCount !== null || legendCount !== null;
    if (!hasTypedTarget && /\bready (?:another (?:friendly )?[a-z][a-z'-]*|something (?:else|besides me)|it|them|two of them)\b/.test(
      clause.text
    )) {
      const count2 = /\btwo of them\b/.test(clause.text) ? 2 : 1;
      add(
        clause,
        "Unit readying",
        "effectValue",
        Math.min(0.75, 0.45 + Math.max(0, count2 - 1) * 0.22),
        "A non-self friendly target receives another bounded action window."
      );
    }
  }
  if (contributions.length === 0) return null;
  const aggregate = /* @__PURE__ */ new Map();
  for (const contribution of contributions) {
    const key = `${contribution.component}:${contribution.label}`;
    const current = aggregate.get(key);
    if (!current) {
      aggregate.set(key, contribution);
      continue;
    }
    const rawValue = current.rawValue + contribution.rawValue;
    const value = current.value + contribution.value;
    aggregate.set(key, {
      ...current,
      activation: rawValue > 0 ? value / rawValue : 0,
      rawValue,
      value
    });
  }
  const aggregated = [...aggregate.values()];
  const effectTotal = aggregated.filter(({ component }) => component === "effectValue").reduce((total, contribution) => total + contribution.value, 0);
  const resourceTotal = aggregated.filter(({ component }) => component === "resourceValue").reduce((total, contribution) => total + contribution.value, 0);
  const effectScale = effectTotal > 2.2 && effectTotal > 0 ? 2.2 / effectTotal : 1;
  const resourceScale = resourceTotal > 1.5 && resourceTotal > 0 ? 1.5 / resourceTotal : 1;
  const scaled = aggregated.map((contribution) => {
    const scale = contribution.component === "effectValue" ? effectScale : resourceScale;
    return {
      ...contribution,
      rawValue: round(contribution.rawValue * scale, 3),
      value: round(contribution.value * scale, 3)
    };
  });
  return {
    contributions: scaled,
    effectValue: round(
      scaled.filter(({ component }) => component === "effectValue").reduce((total, contribution) => total + contribution.value, 0),
      3
    ),
    resourceValue: round(
      scaled.filter(({ component }) => component === "resourceValue").reduce((total, contribution) => total + contribution.value, 0),
      3
    )
  };
}
function structuredSemanticValuation(clauses, text) {
  const contributions = [];
  const add = (label, component, rawValue, pattern, detail, activationOverride) => {
    if (!Number.isFinite(rawValue) || Math.abs(rawValue) < 5e-3) return;
    const activation = round(
      clamp2(
        activationOverride ?? activationForEffects(clauses, pattern),
        0.12,
        1
      ),
      3
    );
    contributions.push({
      activation,
      component,
      detail,
      label,
      value: round(rawValue * activation, 3)
    });
  };
  const temporaryTargetPattern = /\bgive (?:a|an|the|chosen|target) (?:unit|gear)\b[^.!?]{0,48}\[temporary\]/;
  if (temporaryTargetPattern.test(text) && !/\bgive (?:me|this (?:unit|gear|card))\b[^.!?]{0,32}\[temporary\]/.test(
    text
  )) {
    add(
      "Temporary removal",
      "boardControl",
      0.96,
      temporaryTargetPattern,
      "A chosen opposing permanent receives delayed hard removal; friendly use remains optional rather than assumed."
    );
  }
  const negativeMightPattern = /\bgive (?:a|an|the|chosen|target) unit\b[^.!?]{0,32}-(\d+) (?:\[[ms]\](?=\s|[.!?,;:]|$)|might\b)/;
  const negativeMightAmount = Number(
    text.match(negativeMightPattern)?.[1] ?? 0
  );
  if (negativeMightAmount > 0) {
    add(
      "Chosen Might debuff",
      "boardControl",
      Math.min(1.45, negativeMightAmount * 0.36),
      negativeMightPattern,
      "A freely chosen unit can be weakened; the value is capped below removal and does not assume a friendly target."
    );
  }
  const symmetricKillPattern = /\beach player chooses? (?:a|one) unit they control\b[\s\S]{0,48}\bkill the rest\b/;
  if (symmetricKillPattern.test(text)) {
    add(
      "Symmetric board purge",
      "boardControl",
      2.15,
      symmetricKillPattern,
      "A mass unit purge creates a large but symmetric reset; controller value assumes only modest timing advantage."
    );
    add(
      "Symmetric board purge liability",
      "costsAndDrawbacks",
      -1.05,
      symmetricKillPattern,
      "The controller must also lose all but one chosen unit."
    );
  }
  const symmetricRecyclePattern = /\beach player chooses? \d+ units?, \d+ gear, \d+ runes?, and \d+ cards? in their hands?\b[\s\S]{0,48}\brecycle the rest\b/;
  if (symmetricRecyclePattern.test(text)) {
    add(
      "Mass recycle reset",
      "boardControl",
      1.9,
      symmetricRecyclePattern,
      "A multi-zone reset can dismantle developed boards while preserving only a bounded controller timing edge."
    );
    add(
      "Symmetric recycle liability",
      "costsAndDrawbacks",
      -0.92,
      symmetricRecyclePattern,
      "The same board, Rune, and hand compression applies to the controller."
    );
  }
  const burnBuffPattern = /\bwhen you burn (?:a|the) unit this way\b[^.!?]{0,80}\bgive a friendly unit \+\[[ms]\] equal to the burned card'?s might\b/;
  if (burnBuffPattern.test(text)) {
    add(
      "Burn-derived Might conversion",
      "expectedStrength",
      1.05,
      burnBuffPattern,
      "A burned unit's variable Might becomes a bounded temporary friendly buff; the Burn cost is itemized separately."
    );
  }
  const transferredHazardPattern = /\bgain control of this and recall it\b[\s\S]{0,160}\bat the end of your turn, kill this and deal (\d+) to all units you control\b/;
  if (transferredHazardPattern.test(text)) {
    const hazardDamage = Number(text.match(transferredHazardPattern)?.[1] ?? 0);
    add(
      "Transferred delayed hazard",
      "boardControl",
      Math.min(2.15, 0.55 + hazardDamage * 0.2),
      /\bgain control of this and recall it\b/,
      "Control transfer makes the delayed self-destruct a hostile board hazard; activation and delay keep it below an immediate wipe."
    );
  }
  const discardedEnergyDamagePattern = /\bdiscard 1\b[\s\S]{0,64}\bdeal its energy cost as damage to (?:a|an|the|chosen) unit\b/;
  if (discardedEnergyDamagePattern.test(text)) {
    add(
      "Discarded-Energy damage",
      "boardControl",
      1.28,
      discardedEnergyDamagePattern,
      "A discarded card converts variable Energy cost into targeted damage; the discarded card is charged separately."
    );
  }
  const deploymentLockPattern = /\bopponents can only play units to their base\b/;
  if (deploymentLockPattern.test(text)) {
    add(
      "Battlefield play restriction",
      "effectValue",
      0.82,
      deploymentLockPattern,
      "Opposing units are denied direct battlefield deployment while the source remains in position."
    );
  }
  const readyLockPattern = /\bspells and abilities can'?t ready enemy units and gear\b/;
  if (readyLockPattern.test(text)) {
    add(
      "Ready prevention",
      "boardControl",
      0.68,
      readyLockPattern,
      "Enemy unit and Gear action-economy recovery is disabled without being treated as friendly readying."
    );
  }
  const spellControlPattern = /\bgain control of a spell\b[\s\S]{0,72}\bmake new choices for it\b/;
  if (spellControlPattern.test(text)) {
    add(
      "Spell control",
      "effectValue",
      1.42,
      spellControlPattern,
      "Taking control of a live spell and redirecting its choices converts opposing investment into bounded interaction value."
    );
  }
  const handRecyclePattern = /\bopponent\b[\s\S]{0,96}\breveal(?:s)? their hand\b[\s\S]{0,120}\bchoose a non-unit card\b[\s\S]{0,72}\brecycle that card\b/;
  if (handRecyclePattern.test(text)) {
    add(
      "Opponent hand recycle",
      "cardAdvantage",
      0.78,
      handRecyclePattern,
      "Targeted hand information plus forced recycle denies one selected non-unit card."
    );
  }
  const bilateralStunPattern = /\bstun a friendly unit and an enemy unit\b/;
  if (bilateralStunPattern.test(text)) {
    add(
      "Bilateral stun",
      "boardControl",
      0.76,
      bilateralStunPattern,
      "The enemy loses a combat window; the paired friendly stun is charged as a separate liability."
    );
    add(
      "Friendly stun liability",
      "costsAndDrawbacks",
      -0.42,
      bilateralStunPattern,
      "Resolving the effect also stuns a friendly unit."
    );
  }
  const damageDoomPattern = /\bwhen any unit takes damage this turn, kill it\b/;
  if (damageDoomPattern.test(text)) {
    add(
      "Lethal damage conversion",
      "boardControl",
      1.9,
      damageDoomPattern,
      "Any damage becomes lethal for the turn, turning small hostile damage sources into removal."
    );
    add(
      "Symmetric damage-doom liability",
      "costsAndDrawbacks",
      -0.48,
      damageDoomPattern,
      "The lethal conversion is bilateral and can also expose friendly units."
    );
  }
  const delayedKillPattern = /\bchoose a unit\b[\s\S]{0,48}\bkill it the next time it takes damage this turn\b/;
  if (delayedKillPattern.test(text)) {
    const legionUpgrade = /\[legion\]\s*(?:—|-)\s*kill it now instead\b/.test(
      text
    );
    add(
      legionUpgrade ? "Delayed kill / hard removal" : "Delayed kill",
      "boardControl",
      legionUpgrade ? 1.48 : 1.08,
      delayedKillPattern,
      "A damage-gated kill receives one bounded value; a conditional immediate replacement raises reliability without being summed as another kill."
    );
  }
  const deckDisplacementPattern = /\bchoose an enemy unit\b[\s\S]{0,96}\bowner places it on the top or bottom of their main deck\b/;
  if (deckDisplacementPattern.test(text)) {
    add(
      "Deck displacement removal",
      "boardControl",
      1.38,
      deckDisplacementPattern,
      "An enemy battlefield unit is removed into its owner's deck, denying both tempo and immediate graveyard recursion."
    );
  }
  const activatedAbilityAccessPattern = /\bhave all \[t\] abilities of all friendly legends, units, and gear\b/;
  if (activatedAbilityAccessPattern.test(text)) {
    add(
      "Activated ability access",
      "effectValue",
      1.08,
      activatedAbilityAccessPattern,
      "Friendly activated abilities become reusable options, with their supported ceiling left to actual deck composition."
    );
  }
  const trashToHandPattern = /\breturn (?:(?:up to )?(one|two|three|\d+) )?[^.!?]{1,80}\bfrom your trash to your hand\b/;
  const trashToHandMatch = text.match(trashToHandPattern);
  if (trashToHandMatch) {
    const count2 = clamp2(writtenNumber(trashToHandMatch[1]), 1, 3);
    add(
      "Trash retrieval",
      "cardAdvantage",
      Math.min(2.1, 0.78 * count2),
      trashToHandPattern,
      `${count2} printed trash-to-hand access window${count2 === 1 ? "" : "s"} receive bounded card-advantage value.`
    );
  }
  const deathknellMultiplierPattern = /\byour \[deathknell\] effects trigger an additional time\b/;
  if (deathknellMultiplierPattern.test(text)) {
    add(
      "Deathknell multiplier",
      "effectValue",
      1.02,
      deathknellMultiplierPattern,
      "Deathknell output can repeat once; the standalone prior is bounded until a deck supplies actual Deathknell effects."
    );
  }
  const attachPattern = /\battach (?:(?:a|an|the)\s+)?(?:detached |attached )?equipment you control to a unit you control\b/;
  if (attachPattern.test(text)) {
    const attachClauses = clauses.filter(
      ({ text: clause }) => attachPattern.test(clause)
    );
    const bestActivation = Math.max(
      0.12,
      ...attachClauses.map((clause) => clause.activation * clause.valueShare)
    );
    add(
      "Equipment attachment access",
      "effectValue",
      0.52,
      attachPattern,
      "A detached or already attached Equipment can be reassigned; multiple alternative attachment modes are valued by their best bounded window, not summed.",
      bestActivation
    );
  }
  const grantedAttachPattern = /\bfriendly legends have\b[^.!?]{0,48}\[t\]\s*:\s*attach an equipment you control\b/;
  if (grantedAttachPattern.test(text)) {
    add(
      "Granted Equipment attachment",
      "effectValue",
      0.48,
      grantedAttachPattern,
      "Friendly legends gain a reusable Equipment attachment action while the battlefield is controlled."
    );
  }
  const banishedZoneAccessPattern = /\bplay a unit banished with this\b/;
  if (banishedZoneAccessPattern.test(text)) {
    add(
      "Banished-card access",
      "cardAdvantage",
      0.68,
      banishedZoneAccessPattern,
      "A card stored by this permanent remains playable instead of becoming lost zone value."
    );
  }
  const topToHandPattern = /\blook at the top (\d+) cards? of your main deck\b[\s\S]{0,120}\bput 1 into your hand\b/;
  const topToHandCount = Number(text.match(topToHandPattern)?.[1] ?? 0);
  if (topToHandCount > 0) {
    add(
      "Top-deck card access",
      "cardAdvantage",
      Math.min(0.92, 0.48 + topToHandCount * 0.07),
      topToHandPattern,
      "Top-N selection converts one chosen card into hand value while the rest are recycled."
    );
  }
  const topPlayPattern = /\blook at the top (\d+) cards? of your main deck\b[\s\S]{0,180}\bbanish a unit from among them\b[\s\S]{0,96}\bplay it\b/;
  const topPlayCount = Number(text.match(topPlayPattern)?.[1] ?? 0);
  if (topPlayCount > 0) {
    add(
      "Top-deck play access",
      "cardAdvantage",
      Math.min(0.96, 0.58 + topPlayCount * 0.055),
      topPlayPattern,
      "Top-N selection finds and plays one unit; miss risk keeps the standalone access value bounded."
    );
  }
  const playFromTrashPattern = /\bplay a unit from your trash\b/;
  if (playFromTrashPattern.test(text)) {
    add(
      "Play-from-trash recursion",
      "cardAdvantage",
      0.82,
      playFromTrashPattern,
      "A unit in trash becomes a playable card again, before any separate cost bypass is counted."
    );
  }
  const symmetricTopPlayPattern = /\beach player looks at the top (\d+) cards? of their main deck\b[\s\S]{0,240}\beach player plays those cards, ignoring energy costs\b/;
  if (symmetricTopPlayPattern.test(text)) {
    add(
      "Symmetric top-deck play access",
      "cardAdvantage",
      0.42,
      symmetricTopPlayPattern,
      "The controller receives one selected top-N card, discounted for granting the same access to opponents."
    );
    add(
      "Symmetric cost bypass",
      "resourceValue",
      0.58,
      symmetricTopPlayPattern,
      "One selected card ignores Energy cost, with only the controller's bounded timing edge credited."
    );
    add(
      "Opponent top-deck access liability",
      "costsAndDrawbacks",
      -0.46,
      symmetricTopPlayPattern,
      "Every opponent receives the same selected-card access and Energy bypass."
    );
  }
  const hiddenCostBypassPattern = /\bhide cards ignoring costs this turn\b/;
  if (hiddenCostBypassPattern.test(text)) {
    add(
      "Hidden cost bypass",
      "resourceValue",
      0.46,
      hiddenCostBypassPattern,
      "Retrieved Hidden cards can be set without paying their normal hide costs for the turn."
    );
  }
  const nextSpellBonusDamagePattern = /\bthe next spell you play this turn deals (\d+) bonus damage\b/;
  const bonusDamage = Number(text.match(nextSpellBonusDamagePattern)?.[1] ?? 0);
  if (bonusDamage > 0) {
    add(
      "Next-spell bonus damage",
      "effectValue",
      Math.min(1.05, bonusDamage * 0.58),
      nextSpellBonusDamagePattern,
      "The next spell's damage instances are amplified; an activation gate and the need for a follow-up spell bound the floor."
    );
  }
  const grantedXpActionPattern = /\bunits here have\b[^.!?]{0,32}\[t\]\s*:\s*gain (\d+) xp\b/;
  const grantedXp = Number(text.match(grantedXpActionPattern)?.[1] ?? 0);
  if (grantedXp > 0) {
    add(
      "Granted XP action",
      "effectValue",
      Math.min(0.9, 0.38 + grantedXp * 0.14),
      grantedXpActionPattern,
      "Units may trade an action for XP; repeated progression is possible but competes with attacking and movement."
    );
  }
  const nextSpellDiscountPattern = /\bthe next spell you play this turn costs \[(\d+)\] less\b/;
  const nextSpellDiscount = Number(
    text.match(nextSpellDiscountPattern)?.[1] ?? 0
  );
  if (nextSpellDiscount > 0) {
    add(
      "Next-spell cost reduction",
      "resourceValue",
      Math.min(1.45, 0.28 + nextSpellDiscount * 0.18),
      nextSpellDiscountPattern,
      "A one-turn spell discount converts a bounded share of its printed ceiling because it requires a timely follow-up."
    );
  }
  const opponentSpellTaxPattern = /\bopponents'? spells cost \[1\] more\b[\s\S]{0,96}\bif this is \[empowered\], they cost \[1\]\[a\] more instead\b/;
  if (opponentSpellTaxPattern.test(text)) {
    add(
      "Spell cost tax",
      "effectValue",
      0.92,
      opponentSpellTaxPattern,
      "The base spell tax is always useful; the Empowered replacement adds only a reliability-weighted increment rather than a second stacked tax."
    );
  }
  const empowerOtherGearPattern = /\bempower another gear\b/;
  if (empowerOtherGearPattern.test(text)) {
    add(
      "Empower-other-Gear access",
      "effectValue",
      0.46,
      empowerOtherGearPattern,
      "A separate Gear can be Empowered through this activated effect; payoff beyond access depends on supported Gear."
    );
  }
  const empowerDiscountPattern = /\[empower\] costs of your units here cost \[1\] or \[[a-z]\] less\b/;
  if (empowerDiscountPattern.test(text)) {
    add(
      "Empower cost reduction",
      "resourceValue",
      0.62,
      empowerDiscountPattern,
      "Friendly units at this battlefield receive one flexible Energy-or-Power Empower discount."
    );
  }
  const componentCaps = {
    expectedStrength: 2.5,
    effectValue: 3.2,
    cardAdvantage: 3,
    boardControl: 5,
    resourceValue: 3,
    costsAndDrawbacks: 2
  };
  const scaled = [...contributions];
  for (const component of Object.keys(
    componentCaps
  )) {
    const matching = scaled.map((contribution, index) => ({ contribution, index })).filter(({ contribution }) => contribution.component === component);
    const magnitude = matching.reduce(
      (sum, { contribution }) => sum + Math.abs(contribution.value),
      0
    );
    const cap = componentCaps[component];
    if (magnitude <= cap || magnitude === 0) continue;
    const scale = cap / magnitude;
    for (const { contribution, index } of matching) {
      scaled[index] = {
        ...contribution,
        value: round(contribution.value * scale, 3)
      };
    }
  }
  const totalFor = (component) => round(
    scaled.filter((contribution) => contribution.component === component).reduce((sum, contribution) => sum + contribution.value, 0),
    3
  );
  return {
    contributions: scaled,
    expectedStrength: totalFor("expectedStrength"),
    effectValue: totalFor("effectValue"),
    cardAdvantage: totalFor("cardAdvantage"),
    boardControl: totalFor("boardControl"),
    resourceValue: totalFor("resourceValue"),
    costsAndDrawbacks: totalFor("costsAndDrawbacks")
  };
}
function isImmediatePlayEffect(text) {
  return /\bwhen you play me\b|\bas you play me\b|\bwhen you play this\b/.test(
    text
  ) || !/\bif\b|\bwhile\b|\bwhenever\b/.test(text) && /\bdeal\b|\bdraw\b|\bkill\b|\bstun\b|\bmove\b|\bscore\b/.test(text);
}
function conditionalClauseCount(text) {
  const withoutPlayTriggers = text.replaceAll(
    /\bwhen you play (?:me|this)\b|\bas you play me\b/g,
    ""
  );
  const explicit = countMatches(
    withoutPlayTriggers,
    /\bif\b|\bwhile\b|\bwhenever\b|\bwhen\b|\bunless\b|\bonce\b/g
  );
  const levelGates = countMatches(withoutPlayTriggers, /\[level \d+\]/g);
  const implicitStateTargets = countMatches(
    withoutPlayTriggers,
    /\b(?:stunned|damaged|buffed|exhausted|ready) (?:enemy |friendly |opponent'?s )?(?:units?|gear)\b[^.!?]{0,48}\b(?:have|has|gets?|can'?t|cannot|costs?)\b/g
  );
  return explicit + levelGates + implicitStateTargets;
}
function accelerateOptionValuation(card, text) {
  if (!/\[accelerate\]/.test(text) || card.type !== "unit") return null;
  const rawText = card.rulesText.toLocaleLowerCase().replaceAll(/\s+/g, " ").trim();
  const printedCost = rawText.match(
    /\[accelerate\][\s\S]{0,120}?\byou may pay\s+((?:\[[^\]]+\]\s*)+)/
  )?.[1];
  let energyInvestment = 1;
  let powerInvestment = 1;
  if (printedCost) {
    energyInvestment = 0;
    powerInvestment = 0;
    for (const token of printedCost.matchAll(/\[([^\]]+)\]/g)) {
      const symbol = token[1]?.trim() ?? "";
      if (/^\d+$/.test(symbol)) {
        energyInvestment += Number(symbol);
      } else {
        powerInvestment += 1;
      }
    }
  }
  const nonlinearPowerBurden = powerInvestment * 1.15 + 0.25 * powerInvestment * Math.max(0, powerInvestment - 1);
  const totalBurden = energyInvestment + nonlinearPowerBurden;
  const coloredDomains = card.domains.filter(
    (domain) => domain !== "colorless"
  );
  const domainAccess = coloredDomains.length === 1 ? 0.86 : 1;
  const might = clamp2(finiteOr(card.might, 0), 0, 30);
  let conversionValue = 0;
  if (/\battack\b|\[assault(?: \d+)?\]/.test(text)) conversionValue += 0.11;
  if (/\bmov(?:e|ed|es|ing)\b|\[ganking\]/.test(text)) {
    conversionValue += 0.14;
  }
  if (/\bconquer\b|\bhold\b|\bscore\b/.test(text)) conversionValue += 0.16;
  if (/\bxp\b|\[hunt(?: \d+)?\]|\[level \d+\]/.test(text)) {
    conversionValue += 0.14;
  }
  conversionValue = clamp2(conversionValue, 0, 0.48);
  const availability = clamp2(1 - totalBurden * 0.075, 0.42, 0.88);
  const effectValue = clamp2(
    (0.24 + might * 0.05 + conversionValue) * domainAccess * availability,
    0.12,
    1.15
  );
  const investment = clamp2(
    Math.min(
      Math.max(0, effectValue - 0.04),
      totalBurden * 0.065 * availability
    ),
    0,
    0.72
  );
  return {
    effectValue: round(effectValue, 3),
    investment: round(investment, 3)
  };
}
function counterEffectValuation(text) {
  const namesCounterTarget = /\bcounter (?:an? |the |that |target |enemy )*(?:spell|ability)\b/.test(
    text
  );
  const refersToChosenCounterTarget = /\b(?:choose|chosen|target) (?:an? |the )?(?:spell|ability)\b[\s\S]{0,220}\bcounter it\b/.test(
    text
  );
  if (!namesCounterTarget && !refersToChosenCounterTarget) {
    return null;
  }
  const affectsAbilities = /\bspell or ability\b|\bspells? and abilities?\b/.test(text);
  let targetReliability = affectsAbilities ? 1 : 0.92;
  const energyCeiling = Number(
    text.match(/\bcosts? no more than \[(\d+)\]/)?.[1] ?? Number.NaN
  );
  if (Number.isFinite(energyCeiling)) {
    targetReliability *= clamp2(0.48 + energyCeiling * 0.08, 0.48, 0.88);
  }
  const hasPowerCeiling = /\band no more than \[[a-z]\](?:\s|[.,;:]|$)/.test(
    text
  );
  if (hasPowerCeiling) {
    targetReliability *= 0.9;
  }
  const hasFriendlyTargetRestriction = /\bthat chooses? (?:a|one|it|a friendly|friendly)\b|\band no other friendly unit\b/.test(
    text
  );
  if (hasFriendlyTargetRestriction) {
    targetReliability *= 0.58;
  }
  const hasTimingRestriction = /\bif an opponent has played another spell\b/.test(text);
  if (hasTimingRestriction) {
    targetReliability *= 0.62;
  }
  const hasPaymentEscape = /\bunless (?:its|the) controller pays?\b/.test(text);
  if (hasPaymentEscape) {
    targetReliability *= 0.72;
  }
  const explicitConditionalRestrictions = countMatches(
    text,
    /\bif\b|\bunless\b|\bprovided that\b|\bonly if\b/g
  );
  const specificallyPricedRestrictions = Number(hasTimingRestriction) + Number(hasPaymentEscape);
  const additionalConditionalRestrictions = Math.max(
    0,
    explicitConditionalRestrictions - specificallyPricedRestrictions
  );
  if (additionalConditionalRestrictions > 0) {
    targetReliability *= 0.68 * Math.pow(0.78, Math.max(0, additionalConditionalRestrictions - 1));
  }
  targetReliability = clamp2(targetReliability, 0.24, 1);
  let protectedTargets = null;
  const directFriendlyTarget = text.match(
    /\bthat chooses? (?:a |an |one )?friendly ([^.!?;]+)/
  )?.[1];
  if (directFriendlyTarget) {
    protectedTargets = {
      unit: /\bunits?\b/.test(directFriendlyTarget),
      gear: /\bgear\b|\bequipment\b/.test(directFriendlyTarget),
      spell: /\bspells?\b/.test(directFriendlyTarget)
    };
  } else if (/\bchoose a friendly unit\b[^.!?]*[.!?]\s*counter\b[^.!?]*\bthat chooses it\b|\band no other friendly unit\b/.test(
    text
  )) {
    protectedTargets = { unit: true, gear: false, spell: false };
  }
  const targetBreadth = affectsAbilities ? 1.12 : 1;
  const softCounter = /\breturn (?:it|that spell) to its owner'?s hand instead\b/.test(text);
  const oneForOneDenial = softCounter ? 0 : 0.68;
  const midFlightTempo = 1.04 * targetBreadth;
  const preventedSwing = 0.63 * targetBreadth;
  const effectValue = clamp2(
    (oneForOneDenial + midFlightTempo + preventedSwing) * targetReliability,
    0.22,
    2.9
  );
  return {
    effectValue: round(effectValue, 3),
    reliabilityPenalty: round((1 - targetReliability) * 0.18, 3),
    contextValue: round(clamp2(0.18 + targetReliability * 0.2, 0.2, 0.42), 3),
    targetReliability: round(targetReliability, 3),
    targetBreadth: affectsAbilities ? "spell-or-ability" : "spell",
    protectedTargets
  };
}
function directPointFoundationValue(points, activation) {
  if (points <= 0) return 0;
  const boundedActivation = clamp2(activation, 0, 1);
  const reliabilityGate = boundedActivation >= 0.999 ? 1 : Math.pow(boundedActivation, 1.5);
  return round(points * 4.5 * 0.55 * reliabilityGate, 3);
}
function directPointClauseLedger(clauses) {
  return clauses.flatMap((clause) => {
    const points = scoringDirection(clause.text).ownPoints;
    if (points <= 0) return [];
    const activation = round(
      clamp2(clause.activation * clause.valueShare, 0, 1),
      3
    );
    return [
      {
        points,
        activation,
        paymentBurden: clause.paymentBurden,
        value: directPointFoundationValue(points, activation)
      }
    ];
  });
}
function baseCardRatingBreakdown(card) {
  if (!isScoredCard(card)) {
    throw new RangeError(
      card.type === "rune" ? "Rune cards do not have foundation scores; evaluate them through the rune plan and colored-Power compatibility." : `${card.type} cards do not have foundation scores.`
    );
  }
  const cachedBreakdown = baseCardRatingBreakdownCache.get(card);
  if (cachedBreakdown) return cachedBreakdown;
  const text = rulesForScoring(card);
  const typeBaseline = TYPE_BASELINES[card.type] ?? 4.35;
  const energy = clamp2(finiteOr(card.energy, 3), 0, 20);
  const might = clamp2(finiteOr(card.might, 0), 0, 30);
  const mightBonus = clamp2(finiteOr(card.mightBonus, 0), 0, 20);
  const power = clamp2(finiteOr(card.power, 0), 0, 12);
  const recognizedEffects = /* @__PURE__ */ new Set();
  const playable = ["unit", "spell", "gear"].includes(card.type);
  const clauses = clausesForScoring(card);
  const accumulatedRequirement = Math.max(
    1,
    ...clauses.map(
      ({ text: clause }) => accumulatedStateRequirementCount(clause)
    )
  );
  const battlefieldAbilityRestrictions = countMatches(
    text,
    /\buse (?:my|this (?:card|unit|gear)'?s|its) abilities only while (?:i'?m|this (?:card|unit|gear) is) at a battlefield\b|\buse this ability only while (?:i'?m|this (?:card|unit|gear) is) at a battlefield\b/g
  );
  const conditions = conditionalClauseCount(text);
  const activationFactor = rulesActivationFactor(clauses);
  const immediate = isImmediatePlayEffect(text) && activationFactor === 1;
  const strengthActivation = activationForEffects(
    clauses,
    /\[assault|\[shield|\bbuff\b|\bmight\b|\bunit tokens?\b/
  );
  const cardAdvantageActivation = activationForEffects(
    clauses,
    /\bdraw\b|\bdiscard\b|\binto your hand\b|\bplay\b[^.!?]{0,48}\bfrom (?:your )?(?:trash|main deck)\b/
  );
  const boardControlActivation = activationForEffects(
    clauses,
    /\bkill\b|\bbanish\b|\brecall\b|\bstun\b|\bdeal\b[^.!?]{0,40}\bdamage\b|\btake control\b|-\d+ (?:\[[ms]\]|might\b)/
  );
  const controllerBattlefieldClauses = clauses.filter(({ text: clause }) => {
    const opponentScores = /\b(?:opponents?|they|chosen player)\b[^.!?]{0,48}\bscores?\b/.test(
      clause
    );
    const scoreDenial = /\b(?:can'?t|cannot|prevent(?:s|ed|ing)?)\b[^.!?]{0,28}\bscore\b/.test(
      clause
    );
    return !opponentScores || scoreDenial;
  });
  const battlefieldControlActivation = activationForEffects(
    controllerBattlefieldClauses,
    /\bscore\b|\bpoints?\b|\bconquer\b|\bhold\b|\bmov(?:e|es|ed|ing)\b|\badditional turn\b|\bturn after this\b/
  );
  const opponentScoreActivation = activationForEffects(
    clauses,
    /\b(?:opponents?|they|chosen player)\b[^.!?]{0,48}\bscores?\b/
  );
  const resourceActivation = activationForEffects(
    clauses,
    /\badd \d+ energy\b|\[add\]|\bchannel\b|\bcost\b[^.!?]{0,32}\bless\b|\bignoring\b[^.!?]{0,24}\bcost\b/
  );
  const effectActivation = activationForEffects(
    clauses,
    /\bcounter\b|\bcopy\b|\breturn\b|\bprevent\b|\bcan'?t be dealt damage\b|\benough to kill\b|\[vision\]|\[deflect|\[ganking\]|\[backline\]|\[tank\]|\[hunt|\bturn lock\b|\bcan'?t play cards\b/
  );
  const accelerateOption = accelerateOptionValuation(card, text);
  const readyEconomy = readyActionEconomyValuation(card, clauses, text);
  const structuredSemantics = structuredSemanticValuation(clauses, text);
  for (const contribution of structuredSemantics.contributions) {
    recognizedEffects.add(contribution.label);
  }
  const weaponmasterActivation = activationForEffects(
    clauses,
    /\[weaponmaster\]/
  );
  const weaponmasterValue = /\[weaponmaster\]/.test(text) ? round(0.32 * weaponmasterActivation, 3) : 0;
  const counterEffect = counterEffectValuation(text);
  const discard = discardDirection(text);
  const removal = removalDirection(text);
  const damage = damageDirection(text);
  const returns = returnDirection(text);
  const mightReduction = mightReductionDirection(text);
  const tokens = tokenDirection(text);
  const burn = burnDirection(text);
  const scoring = scoringDirection(text);
  const movement = movementDirection(text);
  const paymentSummary = activatedPaymentSummary(clauses);
  const paymentBurden = paymentSummary.maximumBurden;
  const activatedPaymentTax = paymentSummary.expectedTax;
  const colossusPresence = card.type === "unit" && might > 8 ? Math.min(0.6, (might - 8) * 0.15) : 0;
  const printedStrength = clamp2(
    (card.type === "unit" ? might * 0.55 : 0) + colossusPresence + (card.type === "gear" || mightBonus > 0 ? mightBonus * 0.55 : 0),
    0,
    16.5
  );
  let expectedStrength = 0;
  const assault = keywordMagnitude(text, "assault");
  const shield = keywordMagnitude(text, "shield");
  const explicitMight = sumCapturedNumbers(
    text,
    /\b(?:give|gets?|have) [^.!?]{0,42}\+(\d+) (?:\[?[ms]\]?|might)\b/g
  );
  const buffCount = countMatches(
    text,
    /\bbuff (?:me|a|an|another|all|each|friendly|up to|one|this)\b/g
  );
  const tokenBoard = tokenBoardValue(tokens.controllerText);
  if (assault > 0) {
    expectedStrength += assault * 0.55 * 0.55;
    recognizedEffects.add("attacking Might");
  }
  if (shield > 0) {
    expectedStrength += shield * 0.45 * 0.55;
    recognizedEffects.add("defending Might");
  }
  if (explicitMight > 0) {
    expectedStrength += explicitMight * (/\[reaction\]/.test(text) ? 0.85 : 0.65) * 0.55;
    recognizedEffects.add("Might modification");
  }
  if (buffCount > 0) {
    expectedStrength += buffCount * 0.85 * 0.55;
    recognizedEffects.add("persistent buffs");
  }
  if (tokenBoard.value > 0) {
    expectedStrength += tokenBoard.value;
    recognizedEffects.add("token strength");
  }
  if (/\bmy might is increased by your points\b/.test(text)) {
    expectedStrength += 3 * 0.55 * 0.65;
    recognizedEffects.add("point-scaled Might");
  }
  if (/\bincrease its might to the might of another friendly unit\b/.test(text)) {
    expectedStrength += 1.05;
    recognizedEffects.add("Might equalization");
  }
  if (/\bdouble my might\b|\bdouble (?:a|the|its) (?:friendly )?unit'?s might\b/.test(
    text
  )) {
    expectedStrength += Math.max(0.8, might * 0.55 * 0.55);
    recognizedEffects.add("Might doubling");
  }
  expectedStrength = clamp2(expectedStrength * strengthActivation, 0, 6.5);
  const generalExpectedStrength = expectedStrength;
  expectedStrength = clamp2(
    generalExpectedStrength + structuredSemantics.expectedStrength,
    0,
    6.5
  );
  let effectValue = 0;
  if (accelerateOption) {
    effectValue += accelerateOption.effectValue;
    recognizedEffects.add("Accelerate ready-tempo option");
  }
  if (counterEffect) {
    effectValue += counterEffect.effectValue + counterEffect.reliabilityPenalty;
    recognizedEffects.add("Counterspell tempo denial");
  }
  const drawText = text.replaceAll(/\[quick-draw\]/g, " ");
  const drawAmount = sumCapturedNumbers(drawText, /\bdraw (\d+)\b/g);
  const drawClauses = countMatches(drawText, /\bdraw\b/g);
  const damageAmount = damage.hostileAmount;
  const scoreAmount = scoring.ownPoints;
  const symmetricHandReset = /\beach player discards their hand, then draws? \d+\b/.test(text);
  let cardAdvantage = 0;
  if (!symmetricHandReset && (drawAmount > 0 || drawClauses > 0)) {
    cardAdvantage += drawAmount * 1.25 * 0.55 + Math.max(0, drawClauses - drawAmount) * 0.4;
    recognizedEffects.add("card draw");
  }
  const opponentDiscard = discard.opponentAmount;
  if (opponentDiscard > 0) {
    cardAdvantage += opponentDiscard * 1.2 * 0.55;
    recognizedEffects.add("opponent discard");
  }
  if (removal.handDisruptionCount > 0) {
    cardAdvantage += removal.handDisruptionCount * 0.65;
    recognizedEffects.add("opponent hand banish");
  }
  if (/\bplay (?:it|that card|a card|the card) from (?:your )?(?:trash|main deck)\b/.test(
    text
  )) {
    cardAdvantage += 0.65;
    recognizedEffects.add("virtual card access");
  }
  if (/\bdiscard (?:a|1|one) cards?, then draw (?:a|1|one) cards?\b|\bdiscard \d+, then draw \d+\b/.test(
    text
  )) {
    cardAdvantage += 0.19;
    recognizedEffects.add("card filtering");
  }
  if (symmetricHandReset) {
    cardAdvantage += 0.48;
    recognizedEffects.add("symmetric hand reset");
  }
  cardAdvantage = clamp2(cardAdvantage * cardAdvantageActivation, 0, 4.5);
  const generalCardAdvantage = cardAdvantage;
  cardAdvantage = clamp2(
    generalCardAdvantage + structuredSemantics.cardAdvantage,
    0,
    4.5
  );
  let boardControl = 0;
  const kills = removal.killCount;
  const banishes = removal.banishCount;
  const stuns = countMatches(
    text,
    /\bstun (?:an? |chosen )?(?:enemy )?units?\b/g
  );
  if (kills > 0 || banishes > 0) {
    boardControl += kills * 1.65 + banishes * 1.82;
    recognizedEffects.add("hard removal");
  }
  if (returns.enemyCount > 0) {
    boardControl += returns.enemyCount * 0.9;
    recognizedEffects.add("recall tempo");
  }
  if (returns.flexibleCount > 0) {
    boardControl += returns.flexibleCount * 0.84;
    recognizedEffects.add("flexible recall tempo");
  }
  if (returns.symmetric) {
    boardControl += 0.45;
    recognizedEffects.add("symmetric recall replacement");
  }
  if (stuns > 0) {
    boardControl += stuns * 0.78;
    recognizedEffects.add("stun tempo");
  }
  if (damageAmount > 0) {
    const lethalProbability = Math.min(1, damageAmount / 4);
    boardControl += (damageAmount * 0.65 + lethalProbability * 0.6) * 0.55;
    recognizedEffects.add("damage");
  }
  if (/\b(?:deal|deals) damage equal to (?:its|their|that unit'?s|my) might\b|\bthey deal damage equal to their mights\b/.test(
    text
  )) {
    boardControl += 1.05;
    recognizedEffects.add("Might-based interaction");
  }
  if (/\bpay any amount of \[c\] to deal that much damage\b/.test(text)) {
    boardControl += 1.85;
    recognizedEffects.add("scalable damage");
  }
  if (mightReduction.hostileAmount > 0) {
    boardControl += mightReduction.hostileAmount * 0.65 * 0.55;
    recognizedEffects.add("Might reduction");
  }
  if (/\bkill all units\b|\bkill each unit\b/.test(text)) {
    boardControl += 2.4;
    recognizedEffects.add("board reset");
  }
  if (/\b(?:opponent|enemy|defender|they) [^.!?]{0,28}\bkill (?:one|a|an) (?:of )?(?:their )?units?\b/.test(
    text
  )) {
    boardControl += 1.2;
    recognizedEffects.add("opponent sacrifice");
  }
  if (/\beach player kills one of their units\b/.test(text)) {
    boardControl += 0.52;
    recognizedEffects.add("symmetric sacrifice");
  }
  if (/\btake control of\b/.test(text)) {
    boardControl += 2.15;
    recognizedEffects.add("control change");
  }
  boardControl = clamp2(boardControl * boardControlActivation, 0, 6.8);
  const generalBoardControl = boardControl;
  boardControl = clamp2(
    generalBoardControl + structuredSemantics.boardControl,
    0,
    6.8
  );
  const directPointLedger = directPointClauseLedger(
    controllerBattlefieldClauses
  );
  const directScoringActivation = directPointLedger.length > 0 ? round(
    directPointLedger.reduce(
      (sum, clause) => sum + clause.activation * clause.points,
      0
    ) / directPointLedger.reduce((sum, clause) => sum + clause.points, 0),
    3
  ) : activationForEffects(controllerBattlefieldClauses, /\bscore\b/);
  const directScoringValue = directPointLedger.length > 0 ? round(
    directPointLedger.reduce((sum, clause) => sum + clause.value, 0),
    3
  ) : directPointFoundationValue(scoreAmount, directScoringActivation);
  const directScoringPaymentBurden = round(
    Math.max(0, ...directPointLedger.map((clause) => clause.paymentBurden)),
    3
  );
  let battlefieldControl = directScoringValue;
  let contextualBattlefieldControl = 0;
  if (scoreAmount > 0) {
    recognizedEffects.add("direct scoring");
  }
  if (scoring.denial) {
    contextualBattlefieldControl += 3.5;
    recognizedEffects.add("opponent score denial");
  }
  if (scoring.symmetricLock) {
    contextualBattlefieldControl += 0.1;
    recognizedEffects.add("symmetric score lock");
  }
  const moves = movement.friendlyCount + movement.enemyCount;
  if (moves > 0) {
    contextualBattlefieldControl += Math.min(
      2.2,
      movement.enemyCount * 0.95 + movement.friendlyCount * 0.55
    );
    recognizedEffects.add("battlefield movement");
  }
  if (movement.symmetricOption) {
    contextualBattlefieldControl += 0.12;
    recognizedEffects.add("symmetric movement option");
  }
  const unsupportedHoldClause = clauses.some(
    ({ text: clause }) => /\bwhen you hold\b|\bwhile you hold\b|\bhold a battlefield\b/.test(
      clause
    ) && !/\bscore\b/.test(clause)
  );
  if (unsupportedHoldClause) {
    contextualBattlefieldControl += 0.42;
    recognizedEffects.add("Hold value");
  }
  const unsupportedConquerClause = clauses.some(
    ({ text: clause }) => /\bwhen you conquer\b|\bif you conquer\b/.test(clause) && !/\bscore\b/.test(clause)
  );
  if (unsupportedConquerClause) {
    contextualBattlefieldControl += 0.34;
    recognizedEffects.add("conquer payoff");
  }
  if (/\btake (?:a|an) (?:additional |extra )?turn\b|\bturn after this\b/.test(
    text
  )) {
    contextualBattlefieldControl += 9.25;
    recognizedEffects.add("additional turn");
  }
  battlefieldControl = clamp2(
    battlefieldControl + contextualBattlefieldControl * battlefieldControlActivation,
    0,
    9.5
  );
  let resourceValue = 0;
  const energyGain = sumCapturedNumbers(text, /\badd (\d+) energy\b/g);
  const runeChannels = sumCapturedNumbers(text, /\bchannel (\d+) runes?\b/g);
  const symbolEnergyAdds = countMatches(text, /\[add\]\s*(?:\[1\])?\s*\[a\]/g);
  if (energyGain > 0) {
    resourceValue += energyGain * 0.55 * 0.55;
    recognizedEffects.add("Energy acceleration");
  }
  if (symbolEnergyAdds > 0) {
    resourceValue += symbolEnergyAdds * 0.55 * 0.55;
    recognizedEffects.add("Energy acceleration");
  }
  if (runeChannels > 0) {
    const exhausted = /\bchannel \d+ runes? exhausted\b/.test(text);
    resourceValue += runeChannels * (exhausted ? 1.3 : 1.8) * 0.55;
    recognizedEffects.add("Rune acceleration");
  }
  if (/\bplay (?:it|a|an|the|that|this|up to)\b[^.!?]{0,56}ignoring (?:its|the) (?:energy )?cost\b/.test(
    text
  )) {
    resourceValue += 1.05;
    recognizedEffects.add("cost bypass");
  }
  if (/\bcost (?:\[[^\]]+\])+\s*less\b|\breduce (?:my|its|this|the) cost\b|\b(?:energy )?costs? [^.!?]{0,32}\breduced by \[\d+\]/.test(
    text
  )) {
    resourceValue += 0.55;
    if (/\bless for each\b/.test(text)) resourceValue += 0.28;
    recognizedEffects.add("cost reduction");
  }
  const nonReadyResourceValue = clamp2(
    resourceValue * resourceActivation,
    0,
    4.2
  );
  resourceValue = clamp2(
    nonReadyResourceValue + (readyEconomy?.resourceValue ?? 0),
    0,
    4.2
  );
  if ((readyEconomy?.resourceValue ?? 0) > 0) {
    recognizedEffects.add("Rune readying");
  }
  const readyResourceContributions = readyEconomy?.contributions.filter(
    ({ component }) => component === "resourceValue"
  ) ?? [];
  const readyResourceRawValue = readyResourceContributions.reduce(
    (total2, contribution) => total2 + contribution.rawValue,
    0
  );
  const nonReadyResourceRawValue = resourceActivation > 0 ? nonReadyResourceValue / resourceActivation : nonReadyResourceValue;
  const totalResourceRawValue = nonReadyResourceRawValue + readyResourceRawValue;
  const resourceMechanicActivation = totalResourceRawValue > 0 ? round(clamp2(resourceValue / totalResourceRawValue, 0.12, 1), 3) : resourceActivation;
  const generalResourceValue = resourceValue;
  resourceValue = clamp2(
    generalResourceValue + structuredSemantics.resourceValue,
    0,
    4.2
  );
  if (/\bcopy (?:a|the|this)\b|\bcopy of\b/.test(text)) {
    effectValue += 0.72;
    recognizedEffects.add("copy effect");
  }
  if (/\bprevent\b|\bcan'?t be dealt damage\b/.test(text)) {
    effectValue += 0.48;
    recognizedEffects.add("damage prevention");
  }
  if (/\[vision\]/.test(text)) {
    effectValue += 0.14;
    recognizedEffects.add("Vision filtering");
  }
  if (/\bequip (?:\[[^\]]+\])+|\[equip\]/.test(text)) {
    effectValue += 0.08;
    recognizedEffects.add("Equip access");
  }
  if (/\[deflect(?: \d+)?\]/.test(text)) {
    effectValue += 0.34;
    recognizedEffects.add("Deflect protection");
  }
  if (/\[ganking\]/.test(text)) {
    effectValue += 0.33;
    recognizedEffects.add("Ganking mobility");
  }
  if (/\[backline\]/.test(text)) {
    effectValue += 0.22;
    recognizedEffects.add("Backline protection");
  }
  if (/\[tank\]/.test(text)) {
    effectValue += 0.12;
    recognizedEffects.add("Tank protection");
  }
  if (returns.friendlyCount > 0) {
    effectValue += Math.min(0.54, returns.friendlyCount * 0.32);
    recognizedEffects.add("friendly return protection");
  }
  if (/\bany amount of (?:your|friendly) damage is enough to kill (?:an? |any |all )?enemy units?\b/.test(
    text
  )) {
    effectValue += 2.2;
    recognizedEffects.add("lethal damage conversion");
  }
  if (/\[hunt(?: (\d+))?\]/.test(text)) {
    const huntAmount = Number(text.match(/\[hunt(?: (\d+))?\]/)?.[1] ?? 1);
    effectValue += clamp2(huntAmount, 1, 5) * 0.18;
    recognizedEffects.add("XP progression");
  }
  if (/\bopponents? can'?t play cards this turn\b/.test(text)) {
    effectValue += 1.9;
    recognizedEffects.add("turn lock");
  }
  if (/\b(?:i|this|friendly units?) can'?t be chosen by enemy spells and abilities\b/.test(
    text
  )) {
    effectValue += 0.46;
    recognizedEffects.add("targeting protection");
  }
  if (/\bname a spell\b[^]*\bopponents? can'?t play spells with that name\b/.test(
    text
  )) {
    effectValue += 0.74;
    recognizedEffects.add("named-spell lock");
  }
  if (/\bplay me to an occupied enemy battlefield\b/.test(text)) {
    effectValue += 0.32;
    recognizedEffects.add("enemy-field deployment");
  }
  if (/\bincrease the points needed to win the game\b/.test(text)) {
    effectValue += 0.12;
    recognizedEffects.add("game-length modifier");
  }
  if (/\bhide an additional card here\b/.test(text)) {
    effectValue += 0.22;
    recognizedEffects.add("Hidden capacity");
  }
  if (/\bat the start of each player'?s first beginning phase\b[^.!?]*\bchannels? 1 rune\b/.test(
    text
  )) {
    effectValue += 0.14;
    recognizedEffects.add("symmetric rune acceleration");
  }
  if (/\bat the start of each player'?s first beginning phase\b[^.!?]*\bgains? 1 point\b/.test(
    text
  )) {
    effectValue += 0.12;
    recognizedEffects.add("symmetric point acceleration");
  }
  if (/\bunits can'?t be played here\b/.test(text)) {
    effectValue += 0.12;
    recognizedEffects.add("battlefield deployment lock");
  }
  if (/\bany player may pay\b[^.!?]*\bplay a dragon\b/.test(text)) {
    effectValue += 0.12;
    recognizedEffects.add("symmetric Dragon deployment");
  }
  if (/\bcards with \[reaction\] cost \[a\] more\b/.test(text)) {
    effectValue += 0.16;
    recognizedEffects.add("Reaction tax");
  }
  if (/\bwhen a player plays a unit here\b[^.!?]*\bmay pay \[1\] to \[buff\]/.test(
    text
  )) {
    effectValue += 0.14;
    recognizedEffects.add("symmetric buff option");
  }
  if (/\bdeal \d+ bonus damage\b|\beach deal \d+ bonus damage\b/.test(text)) {
    effectValue += 0.22;
    recognizedEffects.add("damage amplification");
  }
  if (movement.tax) {
    effectValue += 0.22;
    recognizedEffects.add("movement tax");
  }
  if (/\bwhile a unit\b[^.!?]{0,48}\bdefending alone\b[^.!?]{0,32}\bhas -\d+ \[[ms]\]/.test(
    text
  )) {
    effectValue += 0.1;
    recognizedEffects.add("symmetric defending Might modifier");
  }
  const repeatOrFlowBase = expectedStrength + cardAdvantage + boardControl + battlefieldControl + resourceValue + effectValue + (readyEconomy?.effectValue ?? 0) + weaponmasterValue;
  if (/\[repeat\]/.test(text)) {
    effectValue += clamp2(repeatOrFlowBase * 0.22, 0.14, 1.35);
    recognizedEffects.add("Repeat value");
  }
  if (/\[flow\]/.test(text)) {
    effectValue += clamp2(repeatOrFlowBase * 0.28, 0.18, 1.45);
    recognizedEffects.add("Flow reuse");
  }
  const generalRulesTextEffectValue = clamp2(
    effectValue * effectActivation,
    0,
    5.4
  );
  effectValue = clamp2(
    generalRulesTextEffectValue + (readyEconomy?.effectValue ?? 0) + weaponmasterValue + structuredSemantics.effectValue,
    0,
    5.4
  );
  if ((readyEconomy?.effectValue ?? 0) > 0) {
    recognizedEffects.add("Ready action economy");
  }
  if (weaponmasterValue > 0) {
    recognizedEffects.add("Weaponmaster Equipment access");
  }
  let flexibility = 0;
  if (/\[reaction\]/.test(text)) flexibility += counterEffect ? 0.08 : 0.1;
  if (/\[action\]/.test(text)) flexibility += 0.08;
  if (/\[hidden\]/.test(text)) flexibility += 0.14;
  if (/\bchoose (?:one|two)\b/.test(text)) flexibility += 0.28;
  if (/\byou may\b|\bmay pay\b/.test(text)) flexibility += 0.08;
  if (/\bup to\b|\bany battlefield\b/.test(text)) flexibility += 0.08;
  if (/\[quick-draw\]/.test(text)) flexibility += 0.22;
  if (/\[ambush\]/.test(text)) flexibility += 0.38;
  flexibility = clamp2(flexibility, 0, 0.6);
  const traits = deriveTraits(card);
  const roleFlags = [
    traits.has("interaction") || traits.has("removal"),
    traits.has("draw") || traits.has("predict") || traits.has("recycle"),
    traits.has("scoring") || traits.has("movement"),
    traits.has("shield") || traits.has("tank") || traits.has("deflect") || traits.has("damage-prevention"),
    traits.has("energy-ramp") || traits.has("cost-reduction"),
    traits.has("token") || traits.has("wide")
  ].filter(Boolean).length;
  const roleUtility = clamp2(roleFlags * 0.08, 0, 0.4);
  let reliability = text.length === 0 ? 0 : 0.08;
  if (immediate) reliability += 0.16;
  if (counterEffect) {
    reliability -= counterEffect.reliabilityPenalty;
  } else {
    reliability -= Math.min(0.38, conditions * 0.065);
  }
  if (/\beach turn\b|\bat (?:the )?start\b|\[t\]:/.test(text)) {
    reliability += 0.1;
  }
  if (card.copyLimit <= 1 && conditions > 0) reliability -= 0.12;
  else if (card.copyLimit === 2 && conditions > 0) reliability -= 0.05;
  if (/\brandom\b|\breveal the top\b/.test(text)) reliability -= 0.07;
  reliability = clamp2(reliability, -0.55, 0.38);
  let costsAndDrawbacks = 0;
  costsAndDrawbacks -= Math.min(0.6, discard.selfAmount * 0.16);
  costsAndDrawbacks -= Math.min(0.52, burn.selfAmount * 0.1);
  if (removal.friendlyKillCount > 0 || /\bsacrifice\b/.test(text)) {
    costsAndDrawbacks -= Math.min(
      0.76,
      Math.max(1, removal.friendlyKillCount) * 0.38
    );
  }
  if (damage.friendlyAmount > 0) {
    costsAndDrawbacks -= Math.min(0.9, damage.friendlyAmount * 0.12);
    recognizedEffects.add("friendly damage drawback");
  }
  if (returns.friendlyCount > 0) {
    costsAndDrawbacks -= Math.min(0.46, returns.friendlyCount * 0.22);
    recognizedEffects.add("friendly return opportunity cost");
  }
  if (mightReduction.friendlyAmount > 0) {
    costsAndDrawbacks -= Math.min(0.9, mightReduction.friendlyAmount * 0.12);
    recognizedEffects.add("friendly Might reduction drawback");
  }
  if (tokens.opponentValue > 0) {
    costsAndDrawbacks -= Math.min(1.15, tokens.opponentValue * 0.65);
    recognizedEffects.add("opponent token liability");
  }
  if (movement.selfRestriction) {
    costsAndDrawbacks -= 0.24;
    recognizedEffects.add("self movement restriction");
  }
  if (/\benters? exhausted\b/.test(text)) costsAndDrawbacks -= 0.24;
  if (/\bas an additional cost\b/.test(text)) costsAndDrawbacks -= 0.16;
  if (accumulatedRequirement > 1) {
    costsAndDrawbacks -= Math.min(1.35, (accumulatedRequirement - 1) * 0.27);
    recognizedEffects.add("multi-event setup burden");
  }
  if (battlefieldAbilityRestrictions > 0) {
    costsAndDrawbacks -= Math.min(1.1, battlefieldAbilityRestrictions * 0.55);
    recognizedEffects.add("battlefield-only ability burden");
  }
  if (/\bopponent draws?\b|\bthey draw \d+\b/.test(text)) {
    costsAndDrawbacks -= 0.46;
  }
  if (scoring.opponentPoints > 0) {
    costsAndDrawbacks -= Math.min(
      2.2,
      scoring.opponentPoints * 4.5 * 0.55 * opponentScoreActivation
    );
    recognizedEffects.add("opponent scoring drawback");
  }
  if (/\bexhaust me\b|\bexhaust this\b/.test(text)) {
    costsAndDrawbacks -= 0.08;
  }
  if (paymentBurden > 0) {
    costsAndDrawbacks -= activatedPaymentTax;
    recognizedEffects.add("activated payment");
  }
  if (card.type === "unit" && /\[temporary\]/.test(text)) {
    costsAndDrawbacks -= 0.38;
  }
  if (accelerateOption) {
    costsAndDrawbacks -= accelerateOption.investment;
    recognizedEffects.add("Accelerate optional investment");
  }
  if (/\bplay me only to\b/.test(text)) {
    costsAndDrawbacks -= 0.72;
    recognizedEffects.add("deployment restriction");
  }
  if (/\bcan'?t be played on your first\b/.test(text)) {
    costsAndDrawbacks -= 1.18;
    recognizedEffects.add("early-turn restriction");
  }
  if (/\bi don'?t deal combat damage unless\b/.test(text)) {
    costsAndDrawbacks -= 1.42;
    recognizedEffects.add("combat restriction");
  }
  if (/\bdetach an equipment from it\b/.test(text)) {
    costsAndDrawbacks -= 0.34;
    recognizedEffects.add("Equipment re-equip tempo");
  }
  const empowerCostMatch = text.match(
    /\[empower\]\s*(?:—\s*[^.\n]+|\[(\d+)\]((?:\[[^\]]+\])*))/
  );
  if (empowerCostMatch) {
    const empowerEnergy = Number(empowerCostMatch[1] ?? 0);
    const empowerPower = countMatches(empowerCostMatch[2] ?? "", /\[c\]/g);
    const empowerBurden = empowerEnergy + empowerPower * 1.15 + 0.25 * empowerPower * Math.max(0, empowerPower - 1);
    costsAndDrawbacks -= Math.min(1.25, empowerBurden * 0.16);
    recognizedEffects.add("Empower investment");
  }
  costsAndDrawbacks = clamp2(costsAndDrawbacks, -2.2, 0);
  const generalCostsAndDrawbacks = costsAndDrawbacks;
  costsAndDrawbacks = clamp2(
    generalCostsAndDrawbacks + structuredSemantics.costsAndDrawbacks,
    -2.2,
    0
  );
  const finisherPayload = card.type === "unit" && energy >= 7 && might >= energy - 3;
  const energyCost = playable ? -clamp2(
    finisherPayload ? 6 * 0.55 + (energy - 6) * 0.34 : energy * 0.55,
    0,
    11
  ) : 0;
  const powerQuadraticFactor = finisherPayload ? 0.14 : 0.25;
  const powerCost = playable && power > 0 ? -clamp2(
    (power * 1.15 + powerQuadraticFactor * power * Math.max(0, power - 1)) * 0.55,
    0,
    8
  ) : 0;
  const resourceCost = -(energyCost + powerCost);
  const powerStrain = powerCost;
  const highCostRisk = playable ? -Math.min(0.7, 0.08 * Math.max(0, energy - 4) ** 1.25) : 0;
  const statEfficiency = card.type === "unit" ? clamp2((might - energy) * 0.08, -0.48, 0.48) : 0;
  if (text && recognizedEffects.size === 0) {
    const fallbackTraits = [...traits].filter(
      (trait) => !["unit", "spell", "gear", "action", "reaction"].includes(trait)
    );
    if (fallbackTraits.length > 0) {
      recognizedEffects.add(
        TRAIT_LABELS[fallbackTraits[0]] ?? fallbackTraits[0]
      );
    } else {
      recognizedEffects.add("situational rules-text utility");
    }
  }
  const immediateValue = clamp2(
    cardAdvantage + boardControl + battlefieldControl + resourceValue + effectValue + expectedStrength,
    0,
    18
  );
  const total = round(
    clamp2(
      typeBaseline + printedStrength + expectedStrength + effectValue + cardAdvantage + boardControl + battlefieldControl + resourceValue + flexibility + roleUtility + reliability + energyCost + powerCost + highCostRisk + costsAndDrawbacks,
      1.5,
      9.8
    ),
    2
  );
  const mechanics = [];
  const addMechanic = (label, component, value, detail, activation) => {
    if (!Number.isFinite(value) || Math.abs(value) < 5e-3) return;
    mechanics.push({
      id: `${component}:${label.toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replaceAll(/^-|-$/g, "")}`,
      label,
      component,
      value: round(value, 2),
      detail,
      activation: round(clamp2(activation, 0, 1), 3)
    });
  };
  if (counterEffect) {
    addMechanic(
      "Counterspell tempo denial",
      "effectValue",
      (counterEffect.effectValue + counterEffect.reliabilityPenalty) * effectActivation,
      `One-for-one ${counterEffect.targetBreadth} interaction with its target-eligibility prior decomposed into the separately itemized reliability adjustment.`,
      effectActivation
    );
    addMechanic(
      "Counter target eligibility",
      "reliability",
      -counterEffect.reliabilityPenalty,
      `${round(counterEffect.targetReliability * 100)}% target eligibility after timing, payment-escape, and printed target restrictions; this adjustment is applied once.`,
      counterEffect.targetReliability
    );
  } else {
    addMechanic(
      "Rules-text utility",
      "effectValue",
      generalRulesTextEffectValue,
      "Deterministic value from non-card, non-board rules-text effects.",
      effectActivation
    );
  }
  for (const contribution of readyEconomy?.contributions.filter(
    ({ component }) => component === "effectValue"
  ) ?? []) {
    addMechanic(
      contribution.label,
      contribution.component,
      contribution.value,
      contribution.detail,
      contribution.activation
    );
  }
  addMechanic(
    "Weaponmaster Equipment access",
    "effectValue",
    weaponmasterValue,
    "Weaponmaster supplies one bounded on-play Equipment attachment and Energy discount; Equipment support determines the higher deck-context ceiling.",
    weaponmasterActivation
  );
  for (const contribution of structuredSemantics.contributions) {
    addMechanic(
      contribution.label,
      contribution.component,
      contribution.value,
      contribution.detail,
      contribution.activation
    );
  }
  if (scoreAmount > 0) {
    addMechanic(
      directScoringPaymentBurden > 0 ? "Activated scoring" : "Direct scoring",
      "battlefieldControl",
      directScoringValue,
      directScoringPaymentBurden > 0 ? `Direct points require up to a ${round(directScoringPaymentBurden, 2)}-resource clause payment; both payoff and cost are activation-gated.` : "Conditional point text earns only reliability-gated standalone credit; supported upside is represented by deck synergies.",
      directScoringActivation
    );
  }
  addMechanic(
    "Printed Might",
    "printedStrength",
    printedStrength,
    "Printed unit or Gear Might before conditional rules text.",
    1
  );
  addMechanic(
    "Conditional Might",
    "expectedStrength",
    generalExpectedStrength,
    "Expected attacking, defending, buff, or token strength.",
    strengthActivation
  );
  addMechanic(
    "Card advantage",
    "cardAdvantage",
    generalCardAdvantage,
    "Expected cards gained or denied at this clause's activation rate.",
    cardAdvantageActivation
  );
  addMechanic(
    "Board control",
    "boardControl",
    generalBoardControl,
    "Removal, damage, stun, recall, or hostile Might pressure.",
    boardControlActivation
  );
  if (scoreAmount === 0) {
    addMechanic(
      "Battlefield control",
      "battlefieldControl",
      battlefieldControl,
      "Movement, Hold, conquer, denial, or extra-turn pressure.",
      battlefieldControlActivation
    );
  }
  addMechanic(
    "Resource conversion",
    "resourceValue",
    generalResourceValue,
    "Energy, Rune channeling or readying, and bounded cost-conversion value.",
    resourceMechanicActivation
  );
  addMechanic(
    "Activated payment",
    "costsAndDrawbacks",
    -activatedPaymentTax,
    "Each optional payment is charged only to its own clause and activation window.",
    paymentSummary.activation
  );
  addMechanic(
    "Other costs and drawbacks",
    "costsAndDrawbacks",
    generalCostsAndDrawbacks + activatedPaymentTax,
    "Rules-text costs, liabilities, and play restrictions.",
    1
  );
  const tagRequirements = requiredAllTagNames(text).length;
  const conditionality = 1 - activationFactor;
  const additionalClauseRequirements = Math.max(
    0,
    ...clauses.map(({ requirementCount }) => requirementCount - 1)
  );
  const deckBuildingTax = clamp2(
    conditionality * 3 + Math.min(1.1, conditions * 0.4) + Math.min(1.05, additionalClauseRequirements * 0.35) + Math.max(0, tagRequirements - 1) * 0.35 + Math.min(1, paymentBurden * 0.12) + Math.min(0.6, power * 0.1),
    0,
    5
  );
  const standaloneFloor = clamp2(
    (total - 1.5) / 1.66 * (0.55 + activationFactor * 0.45),
    0,
    5
  );
  const synergyCeiling = clamp2(
    standaloneFloor + conditionality * 2.45 + (traits.has("hold-payoff") || traits.has("movement-payoff") || traits.has("death-payoff") ? 0.35 : 0) + (traits.has("skip") ? 1.15 : 0),
    0,
    5
  );
  const axes = {
    standaloneFloor: round(standaloneFloor, 2),
    synergyCeiling: round(synergyCeiling, 2),
    interactionFlexibility: round(
      clamp2(
        (traits.has("interaction") ? 2.4 : 0) + flexibility * 3.2 + roleUtility * 1.5 + (/\[reaction\]/.test(text) ? 0.35 : 0),
        0,
        5
      ),
      2
    ),
    deckBuildingTax: round(deckBuildingTax, 2),
    activationReliability: round(clamp2(activationFactor * 5, 0, 5), 2)
  };
  const breakdown = {
    total,
    typeBaseline: round(typeBaseline, 2),
    printedStrength: round(printedStrength, 2),
    expectedStrength: round(expectedStrength, 2),
    effectValue: round(effectValue, 2),
    cardAdvantage: round(cardAdvantage, 2),
    boardControl: round(boardControl, 2),
    battlefieldControl: round(battlefieldControl, 2),
    resourceValue: round(resourceValue, 2),
    statEfficiency: round(statEfficiency, 2),
    immediateValue: round(immediateValue, 2),
    flexibility: round(flexibility, 2),
    roleUtility: round(roleUtility, 2),
    reliability: round(reliability, 2),
    activationFactor: round(activationFactor, 3),
    resourceCost: round(resourceCost, 2),
    energyCost: round(energyCost, 2),
    powerCost: round(powerCost, 2),
    highCostRisk: round(highCostRisk, 2),
    costsAndDrawbacks: round(costsAndDrawbacks, 2),
    powerStrain: round(powerStrain, 2),
    recognizedEffects: [...recognizedEffects].sort(
      (left, right) => left.localeCompare(right)
    )
  };
  Object.defineProperties(breakdown, {
    mechanics: {
      value: mechanics,
      enumerable: false,
      configurable: false,
      writable: false
    },
    axes: {
      value: axes,
      enumerable: false,
      configurable: false,
      writable: false
    }
  });
  const resolvedBreakdown = breakdown;
  baseCardRatingBreakdownCache.set(card, resolvedBreakdown);
  return resolvedBreakdown;
}
function baseCardRating(card) {
  return baseCardRatingBreakdown(card).total;
}
function safeQuantity(quantity) {
  return Number.isFinite(quantity) ? Math.max(0, Math.min(250, Math.floor(quantity))) : 0;
}
function normalizeDeckEntries(entries) {
  const entriesById = /* @__PURE__ */ new Map();
  for (const entry of entries) {
    const existing = entriesById.get(entry.card.id);
    const quantity = Number.isFinite(entry.quantity) ? entry.quantity : 0;
    entriesById.set(entry.card.id, {
      card: existing?.card ?? entry.card,
      quantity: (existing?.quantity ?? 0) + quantity
    });
  }
  return [...entriesById.values()].map((entry) => ({ ...entry, quantity: safeQuantity(entry.quantity) })).filter(({ quantity }) => quantity > 0).sort((left, right) => left.card.id.localeCompare(right.card.id));
}
function normalizeMainDeckEntries(entries) {
  return normalizeDeckEntries(entries).filter(
    ({ card }) => isMainDeckScoreCard(card)
  );
}
function weightedCards(entries) {
  return entries.flatMap(
    ({ card, quantity }) => Array.from({ length: safeQuantity(quantity) }, () => card)
  );
}
function allocateRunes(entries, fallbackDomains = [], targetTotal = 12) {
  const demand = /* @__PURE__ */ new Map();
  for (const { card, quantity } of entries) {
    const copies = safeQuantity(quantity);
    if (copies === 0) continue;
    const power = Math.max(0, card.power ?? 0);
    const coloredDomains = card.domains.filter(
      (domain) => domain !== "colorless"
    );
    if (coloredDomains.length === 0) continue;
    const energy = Math.max(1, card.energy ?? 6);
    const curveUrgency = 1 + Math.max(0, 6 - energy) * 0.12;
    const coloredDemand = power > 0 ? power : 0.18;
    const perDomain = coloredDemand * curveUrgency * copies / coloredDomains.length;
    for (const domain of coloredDomains) {
      demand.set(domain, (demand.get(domain) ?? 0) + perDomain);
    }
  }
  if (demand.size === 0) {
    for (const domain of new Set(fallbackDomains)) {
      if (domain !== "colorless") demand.set(domain, 1);
    }
  }
  if (demand.size === 0) return [];
  const totalDemand = [...demand.values()].reduce(
    (sum, value) => sum + value,
    0
  );
  const preliminary = [...demand.entries()].map(([domain, value]) => ({
    domain,
    demand: round(value),
    exact: value / totalDemand * targetTotal,
    count: Math.floor(value / totalDemand * targetTotal)
  }));
  let remaining = targetTotal - preliminary.reduce((sum, item) => sum + item.count, 0);
  for (const item of [...preliminary].sort((a, b) => {
    const remainderDifference = b.exact - b.count - (a.exact - a.count);
    return remainderDifference || a.domain.localeCompare(b.domain);
  })) {
    if (remaining <= 0) break;
    item.count += 1;
    remaining -= 1;
  }
  if (preliminary.length === 2 && targetTotal >= 6) {
    const minimumSide = Math.max(1, Math.floor(targetTotal / 3));
    const maximumSide = targetTotal - minimumSide;
    const low = preliminary.find((item) => item.count < minimumSide);
    if (low) {
      const high2 = preliminary.find((item) => item !== low);
      const transfer = Math.min(
        minimumSide - low.count,
        Math.max(0, high2.count - minimumSide)
      );
      low.count += transfer;
      high2.count -= transfer;
    }
    const high = preliminary.find((item) => item.count > maximumSide);
    if (high) {
      const lowSide = preliminary.find((item) => item !== high);
      const transfer = high.count - maximumSide;
      high.count -= transfer;
      lowSide.count += transfer;
    }
  }
  return preliminary.map(({ domain, count: count2, demand: domainDemand }) => ({
    domain,
    count: count2,
    demand: domainDemand
  })).sort((a, b) => b.count - a.count || a.domain.localeCompare(b.domain));
}
function probabilityOfNoHits(population, successes, draws) {
  const safePopulation = Math.max(0, Math.floor(population));
  const safeSuccesses = clamp2(Math.floor(successes), 0, safePopulation);
  const safeDraws = clamp2(Math.floor(draws), 0, safePopulation);
  if (safeSuccesses === 0 || safeDraws === 0) return 1;
  if (safeDraws > safePopulation - safeSuccesses) return 0;
  let probability = 1;
  for (let draw = 0; draw < safeDraws; draw += 1) {
    probability *= (safePopulation - safeSuccesses - draw) / (safePopulation - draw);
  }
  return clamp2(probability, 0, 1);
}
function combinationCount(population, selections) {
  if (selections < 0 || selections > population) return 0;
  const k = Math.min(selections, population - selections);
  let value = 1;
  for (let index = 1; index <= k; index += 1) {
    value *= (population - k + index) / index;
  }
  return value;
}
function hypergeometricAtLeast(population, successes, draws, required) {
  const safePopulation = Math.max(0, Math.floor(population));
  const safeSuccesses = clamp2(Math.floor(successes), 0, safePopulation);
  const safeDraws = clamp2(Math.floor(draws), 0, safePopulation);
  const safeRequired = Math.max(0, Math.floor(required));
  if (safeRequired === 0) return 1;
  if (safeRequired > safeSuccesses || safeRequired > safeDraws || safePopulation === 0) {
    return 0;
  }
  const denominator = combinationCount(safePopulation, safeDraws);
  if (denominator === 0) return 0;
  let probability = 0;
  const maximum = Math.min(safeSuccesses, safeDraws);
  for (let hits = safeRequired; hits <= maximum; hits += 1) {
    probability += combinationCount(safeSuccesses, hits) * combinationCount(safePopulation - safeSuccesses, safeDraws - hits) / denominator;
  }
  return round(clamp2(probability, 0, 1), 4);
}
function cardRuneReliability(card, runes) {
  const power = Math.max(0, Math.floor(finiteOr(card.power, 0)));
  if (power === 0) return 1;
  const coloredDomains = card.domains.filter(
    (domain) => domain !== "colorless"
  );
  if (coloredDomains.length === 0) return 1;
  const totalRunes = runes.reduce((sum, rune) => sum + rune.count, 0);
  if (totalRunes === 0) return 0;
  const available = coloredDomains.reduce(
    (sum, domain) => sum + (runes.find((rune) => rune.domain === domain)?.count ?? 0),
    0
  );
  const channels = Math.min(
    totalRunes,
    Math.max(2, Math.ceil(finiteOr(card.energy, 2)))
  );
  return hypergeometricAtLeast(totalRunes, available, channels, power);
}
function earlyPackageReliability(deckSize, enablerCopies, payoffCopies, overlapCopies = 0, openingHand = STANDARD_OPENING_HAND, earlyDraws = DEFAULT_EARLY_DRAWS) {
  const population = Math.max(0, Math.floor(deckSize));
  if (population === 0) return 0;
  const enablers = clamp2(Math.floor(enablerCopies), 0, population);
  const payoffs = clamp2(Math.floor(payoffCopies), 0, population);
  const overlap = clamp2(
    Math.floor(overlapCopies),
    0,
    Math.min(enablers, payoffs)
  );
  if (enablers === 0 || payoffs === 0) return 0;
  const draws = clamp2(
    Math.floor(openingHand) + Math.floor(earlyDraws),
    0,
    population
  );
  const union = clamp2(enablers + payoffs - overlap, 0, population);
  const probability = 1 - probabilityOfNoHits(population, enablers, draws) - probabilityOfNoHits(population, payoffs, draws) + probabilityOfNoHits(population, union, draws);
  return round(clamp2(probability, 0, 1), 4);
}
function earlyCombinationReliability(deckSize, groups, openingHand, earlyDraws) {
  const population = Math.max(0, Math.floor(deckSize));
  if (population === 0) return 0;
  const draws = clamp2(
    Math.floor(openingHand) + Math.floor(earlyDraws),
    0,
    population
  );
  const normalized = groups.map(({ copies, required }) => ({
    copies: clamp2(Math.floor(copies), 0, population),
    required: Math.max(0, Math.floor(required))
  }));
  if (normalized.length === 0 || normalized.some(
    ({ copies, required }) => required > copies || required > draws
  )) {
    return 0;
  }
  const selectedCopies = normalized.reduce(
    (sum, group) => sum + group.copies,
    0
  );
  if (selectedCopies > population) return 0;
  const otherCopies = population - selectedCopies;
  const denominator = combinationCount(population, draws);
  if (denominator === 0) return 0;
  let successfulHands = 0;
  const visit = (index, selected, combinations) => {
    if (index === normalized.length) {
      const otherDraws = draws - selected;
      if (otherDraws < 0 || otherDraws > otherCopies) return;
      successfulHands += combinations * combinationCount(otherCopies, otherDraws);
      return;
    }
    const group = normalized[index];
    const maximum = Math.min(group.copies, draws - selected);
    for (let hits = group.required; hits <= maximum; hits += 1) {
      visit(
        index + 1,
        selected + hits,
        combinations * combinationCount(group.copies, hits)
      );
    }
  };
  visit(0, 0, 1);
  return round(clamp2(successfulHands / denominator, 0, 1), 4);
}
function equipmentInstructionPerUse(text, verbs) {
  return clamp2(
    controllerInstructionClauses(text, verbs.join("|"), true).reduce(
      (total, clause) => {
        if (!/\bequipment\b/.test(clause)) return total;
        const verb = verbs.find(
          (candidate) => new RegExp(`\\b${candidate}\\b`).test(clause)
        );
        return verb ? total + instructionAmount(clause, verb, 1) : total;
      },
      0
    ),
    0,
    12
  );
}
function equipmentConditionalFoundationValue(card) {
  const profile = baseCardRatingBreakdown(card);
  const text = rulesForScoring(card);
  const equipmentSpecificLabels = /* @__PURE__ */ new Set([
    "Weaponmaster Equipment access",
    "Equipment attachment access",
    "Granted Equipment attachment"
  ]);
  if (isEquipmentCard(card)) {
    const conditional2 = profile.mechanics.reduce((total, mechanic) => {
      if (mechanic.value <= 0) return total;
      if (mechanic.label === "Printed Might") return total + mechanic.value;
      if (mechanic.label === "Rules-text utility") {
        return total + Math.min(0.18, mechanic.value);
      }
      return total;
    }, 0);
    return round(clamp2(conditional2, 0, Math.max(0, profile.total - 1.5)), 3);
  }
  const dependentClauses = clausesForScoring(card).filter(
    ({ text: clause }) => /\bequipment\b|\bequipped\b|\[weaponmaster\]/.test(clause)
  );
  const dependentText = dependentClauses.map(({ text: clause }) => clause).join(" ");
  const equipmentResolutionText = /\bchoose an equipped friendly unit\b|\bchoose a unit and an equipment with the same controller\b|\bfor each equipment\b/.test(
    text
  ) ? text : dependentText;
  const dependentComponents = /* @__PURE__ */ new Set();
  if (/\bdraw\b|\binto your hand\b/.test(equipmentResolutionText)) {
    dependentComponents.add("cardAdvantage");
  }
  if (/\bkill\b|\bbanish\b|\bstun\b|\bdeals?\b[^.!?]{0,48}\bdamage\b|[-+]\d+ (?:\[[ms]\]|might\b)/.test(
    equipmentResolutionText
  )) {
    dependentComponents.add("boardControl");
  }
  if (/\bbuff\b|\bmight\b|\[assault/.test(equipmentResolutionText)) {
    dependentComponents.add("expectedStrength");
  }
  if (/\bplay\b|\bignoring\b[^.!?]{0,32}\bcost\b/.test(equipmentResolutionText)) {
    dependentComponents.add("resourceValue");
  }
  if (/\bscore\b|\bhold\b|\bconquer\b|\bmov(?:e|es|ed|ing)\b/.test(dependentText)) {
    dependentComponents.add("battlefieldControl");
  }
  const conditional = profile.mechanics.reduce((total, mechanic) => {
    if (mechanic.value <= 0) return total;
    if (equipmentSpecificLabels.has(mechanic.label)) {
      return total + mechanic.value;
    }
    return dependentComponents.has(mechanic.component) ? total + mechanic.value : total;
  }, 0);
  const explicitAttachmentWithoutMechanic = /\battach that equipment to that unit\b|\battach one of its equipment to me\b|\battach it to me\b/.test(
    text
  ) && !profile.mechanics.some(
    ({ label }) => label === "Equipment attachment access"
  );
  const attachmentFlexibilitySlice = explicitAttachmentWithoutMechanic ? Math.min(0.08, Math.max(0, profile.flexibility)) : 0;
  return round(
    clamp2(
      conditional + attachmentFlexibilitySlice,
      0,
      Math.max(0, profile.total - 1.5)
    ),
    3
  );
}
function equipmentRequirementFor(card) {
  const text = rulesForScoring(card);
  const equipment = isEquipmentCard(card);
  const needsEquipment = requiresFriendlyEquipment(card, text);
  if (!equipment && !needsEquipment) return null;
  const maximumEquipmentEnergyMatch = text.match(
    /\bequipment with energy cost no more than \[(\d+)\]/
  );
  const maximumEquipmentEnergy = maximumEquipmentEnergyMatch ? clamp2(Number(maximumEquipmentEnergyMatch[1]), 0, 20) : null;
  const attachedStateRequired = equipment || /\bequipped friendly unit\b|\bequipment attached to\b|\battach (?:an?|one of your|a detached|an attached|that) equipment\b|\battach one of its equipment\b|\battach it to (?:me|a|the|that|another|friendly)\b/.test(
    text
  );
  const needsExternalCarrier = /\bequipped friendly unit\b|\bchoose (?:a|an) unit and an equipment\b|\bone of its equipment\b/.test(
    text
  );
  const needsCarrier = equipment || needsExternalCarrier || card.type !== "unit" && /\bequipped friendly unit\b|\bchoose (?:a|an) unit and an equipment\b|\battach [^.!?]{0,48}\bto (?:a|the|that|another|friendly) unit\b/.test(
    text
  );
  return {
    needsEquipment,
    needsCarrier,
    maximumEquipmentEnergy,
    attachedStateRequired,
    detachTempoPerUse: equipmentInstructionPerUse(text, ["detach"]),
    destructiveConsumptionPerUse: equipmentInstructionPerUse(text, [
      "kill",
      "sacrifice"
    ])
  };
}
function equipmentContextForCard(card, quantity, entries, deckSize, openingHand, earlyDraws) {
  const requirement = equipmentRequirementFor(card);
  if (!requirement) return null;
  const compatibleEquipment = entries.filter(({ card: card2 }) => {
    if (!requirement.needsEquipment) return false;
    if (!isEquipmentCard(card2)) return false;
    return !(requirement.maximumEquipmentEnergy !== null && finiteOr(card2.energy, Number.POSITIVE_INFINITY) > requirement.maximumEquipmentEnergy);
  });
  const compatibleEquipmentCopies = compatibleEquipment.reduce(
    (total, entry) => total + safeQuantity(entry.quantity),
    0
  );
  const equipmentProviderIds = [
    ...new Set(compatibleEquipment.map(({ card: card2 }) => card2.id))
  ].sort((left, right) => left.localeCompare(right));
  const carrierEntries = requirement.needsCarrier ? entries.filter(
    ({ card: candidate }) => candidate.type === "unit" && candidate.id !== card.id
  ) : [];
  const carrierCopies = carrierEntries.reduce(
    (total, entry) => total + safeQuantity(entry.quantity),
    0
  );
  const carrierProviderIds = [
    ...new Set(carrierEntries.map(({ card: candidate }) => candidate.id))
  ].sort((left, right) => left.localeCompare(right));
  const providerCardIds = [
    .../* @__PURE__ */ new Set([...equipmentProviderIds, ...carrierProviderIds])
  ].sort((left, right) => left.localeCompare(right));
  const draws = openingHand + earlyDraws;
  let supportReliability = 1;
  if (requirement.needsEquipment) {
    supportReliability = requirement.needsCarrier ? earlyCombinationReliability(
      deckSize,
      [
        { copies: compatibleEquipmentCopies, required: 1 },
        { copies: carrierCopies, required: 1 }
      ],
      openingHand,
      earlyDraws
    ) : hypergeometricAtLeast(deckSize, compatibleEquipmentCopies, draws, 1);
  } else if (requirement.needsCarrier) {
    supportReliability = hypergeometricAtLeast(
      deckSize,
      carrierCopies,
      draws,
      1
    );
  }
  const copies = safeQuantity(quantity);
  const detachTempoDemand = copies * requirement.detachTempoPerUse;
  const consumptionDemand = copies * requirement.destructiveConsumptionPerUse;
  if (consumptionDemand > 0) {
    const freshSupply = clamp2(
      compatibleEquipmentCopies / consumptionDemand,
      0,
      1
    );
    supportReliability *= 0.35 + freshSupply * 0.65;
  }
  supportReliability = round(clamp2(supportReliability, 0, 1), 3);
  const profile = baseCardRatingBreakdown(card);
  const conditionalFoundationValue = equipmentConditionalFoundationValue(card);
  const unconditionalFoundationValue = Math.max(
    0,
    profile.total - conditionalFoundationValue
  );
  const standaloneFloor = round(
    profile.total > 0 ? unconditionalFoundationValue / profile.total : 1,
    3
  );
  const activation = round(
    profile.total > 0 ? (unconditionalFoundationValue + conditionalFoundationValue * supportReliability) / profile.total : 1,
    3
  );
  const deckScale = FOUNDATION_DECK_SCALE / Math.max(1, deckSize);
  const unconditionalValue = round(
    unconditionalFoundationValue * copies * deckScale,
    3
  );
  const conditionalValue = round(
    conditionalFoundationValue * copies * deckScale,
    3
  );
  const realizedConditionalValue = round(
    conditionalValue * supportReliability,
    3
  );
  const reattachTempoTax = round(
    Math.max(0, detachTempoDemand - 1) * 0.22 * supportReliability * deckScale,
    3
  );
  const scoreAdjustment = round(
    realizedConditionalValue - conditionalValue - reattachTempoTax,
    3
  );
  const penalty = Math.max(0, -scoreAdjustment);
  const ceilingText = requirement.maximumEquipmentEnergy === null ? "any Energy cost" : `Energy ${requirement.maximumEquipmentEnergy} or less`;
  const detachText = detachTempoDemand > 0 ? ` ${detachTempoDemand} reusable detach window${detachTempoDemand === 1 ? "" : "s"} add ${reattachTempoTax} RDS of between-use re-equip tempo without consuming fresh Equipment.` : "";
  const consumptionText = consumptionDemand > 0 ? ` ${consumptionDemand} destructive kill/sacrifice window${consumptionDemand === 1 ? "" : "s"} require fresh Equipment supply.` : "";
  const carrierText = requirement.needsCarrier ? ` and ${carrierCopies} unit carrier cop${carrierCopies === 1 ? "y" : "ies"}` : "";
  const detail = `${compatibleEquipmentCopies} compatible Equipment ${compatibleEquipmentCopies === 1 ? "copy" : "copies"} (${ceilingText})${carrierText} produce ${round(supportReliability * 100)}% modeled support reliability.${detachText}${consumptionText}`;
  return {
    breakdown: {
      standaloneFloor,
      supportedCeiling: 1,
      activation,
      supportReliability,
      equipmentCopies: compatibleEquipmentCopies,
      providerRoles: {
        equipment: equipmentProviderIds,
        carriers: carrierProviderIds
      },
      providerCardIds,
      carrierCopies,
      maximumEquipmentEnergy: requirement.maximumEquipmentEnergy,
      attachedStateRequired: requirement.attachedStateRequired,
      detachTempoDemand,
      consumptionDemand,
      unconditionalValue,
      conditionalValue,
      realizedConditionalValue,
      reattachTempoTax,
      scoreAdjustment,
      detail
    },
    penalty
  };
}
function runeDemandStrain(entries, runes) {
  const allocated = new Map(runes.map((rune) => [rune.domain, rune.count]));
  let weightedStrain = 0;
  let weightedCopies = 0;
  for (const { card, quantity } of entries) {
    const copies = safeQuantity(quantity);
    const power = clamp2(finiteOr(card.power, 0), 0, 12);
    if (copies === 0 || power === 0) continue;
    const domains = card.domains.filter((domain) => domain !== "colorless");
    if (domains.length === 0) continue;
    const availableRunes = domains.reduce(
      (sum, domain) => sum + (allocated.get(domain) ?? 0),
      0
    );
    const energy = clamp2(finiteOr(card.energy, 6), 1, 20);
    const curveUrgency = 1 + Math.max(0, 5 - energy) * 0.12;
    const pressure = power ** 1.35 / Math.max(1, availableRunes) * curveUrgency;
    weightedStrain += pressure * copies;
    weightedCopies += copies;
  }
  if (weightedCopies === 0) return 0;
  const averagePressure = weightedStrain / weightedCopies;
  return round(clamp2((averagePressure - 0.22) * 4.2, 0, 5.5));
}
function cardNames(entries, predicate) {
  return entries.filter(({ card }) => predicate(card)).map(({ card }) => card.name).filter((name, index, names) => names.indexOf(name) === index).sort((left, right) => left.localeCompare(right)).slice(0, 6);
}
var REGION_TAGS = /* @__PURE__ */ new Set([
  "Bandle City",
  "Bilgewater",
  "Demacia",
  "Freljord",
  "Icathia",
  "Ionia",
  "Ixtal",
  "Mount Targon",
  "Noxus",
  "Piltover",
  "Shadow Isles",
  "Shurima",
  "The Void",
  "Zaun"
]);
var TRIBAL_TAGS = /* @__PURE__ */ new Set([
  "Bird",
  "Cat",
  "Demon",
  "Dog",
  "Dragon",
  "Elite",
  "Equipment",
  "Fae",
  "Mech",
  "Pirate",
  "Poro",
  "Recruit",
  "Sentinel",
  "Spider",
  "Spirit",
  "Trifarian",
  "Yordle"
]);
function escapeRegExp(value) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function textExplicitlyReferencesTag(card, tag) {
  if (REGION_TAGS.has(tag)) return false;
  const normalizedTag = tag.toLocaleLowerCase();
  if (normalizedTag.length < 3) return false;
  return new RegExp(`\\b${escapeRegExp(normalizedTag)}(?:s|es)?\\b`, "i").test(
    rulesForScoring(card)
  );
}
function cardNameStem(card) {
  return normalizedChampionIdentity(card.name.split(",")[0] ?? card.name);
}
function explicitlyReferencesCard(source, target) {
  const targetStem = cardNameStem(target);
  if (targetStem.length < 4) return false;
  return new RegExp(`\\b${escapeRegExp(targetStem)}\\b`, "i").test(
    rulesForScoring(source)
  );
}
function synergyAffinity(left, right) {
  const leftTraits = deriveTraits(left);
  const rightTraits = deriveTraits(right);
  let score = 0;
  const sharedTags = [...new Set(left.tags)].filter(
    (tag) => right.tags.includes(tag)
  );
  for (const tag of sharedTags) {
    if (REGION_TAGS.has(tag)) continue;
    const explicitReference = textExplicitlyReferencesTag(left, tag) || textExplicitlyReferencesTag(right, tag);
    if (explicitReference) {
      score += TRIBAL_TAGS.has(tag) ? 1.35 : 1.05;
    }
  }
  if (explicitlyReferencesCard(left, right) || explicitlyReferencesCard(right, left)) {
    score += 1.45;
  }
  for (const pair of PACKAGE_PAIRS) {
    if (leftTraits.has(pair.left) && rightTraits.has(pair.right) || leftTraits.has(pair.right) && rightTraits.has(pair.left)) {
      score += 1.42;
    }
  }
  if (hasTargetedReadyPackage(left, right, rightTraits) || hasTargetedReadyPackage(right, left, leftTraits)) {
    score += 0.52;
  }
  if (hasEquipmentAssaultPackage(left, right, rightTraits) || hasEquipmentAssaultPackage(right, left, leftTraits)) {
    score += 0.64;
  }
  return round(clamp2(score, 0, 8), 2);
}
function orderedCardPair(left, right) {
  return left.id.localeCompare(right.id) <= 0 ? [left, right] : [right, left];
}
function hasAnyTrait(traits, candidates) {
  return candidates.some((trait) => traits.has(trait));
}
function analyzeCardPair(first, second) {
  const [left, right] = orderedCardPair(first, second);
  const leftTraits = deriveTraits(left);
  const rightTraits = deriveTraits(right);
  const reasons = [];
  let synergy = synergyAffinity(left, right);
  let antisynergy = 0;
  const sharedTags = [...new Set(left.tags)].filter(
    (tag) => right.tags.includes(tag)
  );
  for (const tag of sharedTags) {
    if (REGION_TAGS.has(tag)) continue;
    if (!textExplicitlyReferencesTag(left, tag) && !textExplicitlyReferencesTag(right, tag)) {
      continue;
    }
    const value = TRIBAL_TAGS.has(tag) ? 1.35 : 1.05;
    reasons.push({
      id: `tag-reference:${tag}:${left.id}:${right.id}`,
      label: `${tag} rules-text package`,
      kind: "synergy",
      scope: "explicit-reference",
      value,
      detail: `A printed ${tag} reference connects the tagged cards instead of relying on identity-only overlap.`,
      cardIds: [left.id, right.id],
      traits: []
    });
  }
  if (explicitlyReferencesCard(left, right) || explicitlyReferencesCard(right, left)) {
    reasons.push({
      id: `reference:${left.id}:${right.id}`,
      label: "Explicit card reference",
      kind: "synergy",
      scope: "explicit-reference",
      value: 1.45,
      detail: "One card names the other card family in its official rules text.",
      cardIds: [left.id, right.id],
      traits: []
    });
  }
  for (const pair of PACKAGE_PAIRS) {
    if (leftTraits.has(pair.left) && rightTraits.has(pair.right) || leftTraits.has(pair.right) && rightTraits.has(pair.left)) {
      reasons.push({
        id: `package:${pair.left}:${pair.right}:${left.id}:${right.id}`,
        label: pair.label,
        kind: "synergy",
        scope: "mechanic-package",
        value: 1.42,
        detail: `${TRAIT_LABELS[pair.left]} connects to ${TRAIT_LABELS[pair.right]}.`,
        cardIds: [left.id, right.id],
        traits: [pair.left, pair.right]
      });
    }
  }
  if (hasEquipmentAssaultPackage(left, right, rightTraits) || hasEquipmentAssaultPackage(right, left, leftTraits)) {
    reasons.push({
      id: `equipment-assault:${left.id}:${right.id}`,
      label: "Equipment Assault grant",
      kind: "synergy",
      scope: "mechanic-package",
      value: 0.64,
      detail: "A printed Equipment-only Assault grant connects to a card that can actually be equipped.",
      cardIds: [left.id, right.id],
      traits: ["equip", "assault"]
    });
  }
  const leftCounter = counterEffectValuation(rulesForScoring(left));
  const rightCounter = counterEffectValuation(rulesForScoring(right));
  const isHighImpactLine = (card, traits) => {
    const text = rulesForScoring(card);
    return traits.has("skip") || /\btake (?:a|an) (?:additional |extra )?turn\b/.test(text) || /\bscore [2-9]\b/.test(text) || /\bopponents? can'?t play cards this turn\b/.test(text);
  };
  const canProtectLine = (counter, card, traits) => counter.protectedTargets === null || counter.protectedTargets.unit && traits.has("unit") || counter.protectedTargets.gear && traits.has("gear") || counter.protectedTargets.spell && card.type === "spell";
  const counterContext = leftCounter && isHighImpactLine(right, rightTraits) && canProtectLine(leftCounter, right, rightTraits) ? leftCounter : rightCounter && isHighImpactLine(left, leftTraits) && canProtectLine(rightCounter, left, leftTraits) ? rightCounter : null;
  if (counterContext) {
    const value = counterContext.contextValue;
    synergy += value;
    reasons.push({
      id: `counter-protection:${left.id}:${right.id}`,
      label: "Counter protection for a high-impact line",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail: "A legal Reaction window can protect a high-impact scoring or extra-turn line by denying an opposing spell or ability; ordinary units, gears, and movement are not treated as counterable.",
      cardIds: [left.id, right.id],
      traits: ["counter", "reaction"]
    });
  }
  const leftExtraTurn = leftTraits.has("skip");
  const rightExtraTurn = rightTraits.has("skip");
  const leftHoldEngine = hasAnyTrait(leftTraits, ["hold", "scoring", "ready"]);
  const rightHoldEngine = hasAnyTrait(rightTraits, [
    "hold",
    "scoring",
    "ready"
  ]);
  if (leftExtraTurn && rightHoldEngine || rightExtraTurn && leftHoldEngine) {
    const value = 1.65;
    synergy += value;
    reasons.push({
      id: `extra-turn-value:${left.id}:${right.id}`,
      label: "Extra-turn battlefield conversion",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail: "An additional turn can ready resources and convert Hold, scoring, or readying value a second time.",
      cardIds: [left.id, right.id],
      traits: ["skip", "hold"]
    });
  }
  const leftRamp = hasAnyTrait(leftTraits, ["energy-ramp", "cost-reduction"]);
  const rightRamp = hasAnyTrait(rightTraits, ["energy-ramp", "cost-reduction"]);
  if (leftExtraTurn && rightRamp || rightExtraTurn && leftRamp) {
    const value = 1.45;
    synergy += value;
    reasons.push({
      id: `extra-turn-ramp:${left.id}:${right.id}`,
      label: "Finisher acceleration",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail: "Energy acceleration or cost reduction improves access to the high-cost additional-turn effect.",
      cardIds: [left.id, right.id],
      traits: ["skip", "energy-ramp"]
    });
  }
  const leftEnergy = finiteOr(left.energy, 0);
  const rightEnergy = finiteOr(right.energy, 0);
  const leftTopEndSupport = hasAnyTrait(leftTraits, [
    "energy-ramp",
    "cost-reduction",
    "channel-rune"
  ]);
  const rightTopEndSupport = hasAnyTrait(rightTraits, [
    "energy-ramp",
    "cost-reduction",
    "channel-rune"
  ]);
  if (leftTopEndSupport && rightEnergy >= 6 && !rightExtraTurn || rightTopEndSupport && leftEnergy >= 6 && !leftExtraTurn) {
    const supportedEnergy = leftTopEndSupport ? rightEnergy : leftEnergy;
    const value = round(
      clamp2(0.38 + (supportedEnergy - 6) * 0.08, 0.38, 0.78),
      2
    );
    synergy += value;
    reasons.push({
      id: `top-end-support:${left.id}:${right.id}`,
      label: "Top-end acceleration",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail: "Resource acceleration or cost reduction makes the expensive payoff reachable without treating raw cost as upside.",
      cardIds: [left.id, right.id],
      traits: ["energy-ramp", "power-demand"]
    });
  }
  if (hasTargetedReadyPackage(left, right, rightTraits) || hasTargetedReadyPackage(right, left, leftTraits)) {
    reasons.push({
      id: `ready-trigger:${left.id}:${right.id}`,
      label: "Repeatable trigger",
      kind: "synergy",
      scope: "mechanic-package",
      value: 0.52,
      detail: "A printed ready effect can target the other card and reuse its intrinsic Assault, self trigger, or exhaust ability.",
      cardIds: [left.id, right.id],
      traits: ["ready"]
    });
  }
  const leftProtection = hasAnyTrait(leftTraits, [
    "tank",
    "deflect",
    "backline",
    "damage-prevention"
  ]);
  const rightProtection = hasAnyTrait(rightTraits, [
    "tank",
    "deflect",
    "backline",
    "damage-prevention"
  ]);
  const leftEngine = hasAnyTrait(leftTraits, [
    "hold",
    "draw",
    "energy-ramp",
    "spell-matters",
    "token-matters",
    "death-payoff",
    "trash-payoff"
  ]);
  const rightEngine = hasAnyTrait(rightTraits, [
    "hold",
    "draw",
    "energy-ramp",
    "spell-matters",
    "token-matters",
    "death-payoff",
    "trash-payoff"
  ]);
  if (leftProtection && rightEngine || rightProtection && leftEngine) {
    const value = 0.36;
    synergy += value;
    reasons.push({
      id: `protect-engine:${left.id}:${right.id}`,
      label: "Protected engine",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail: "Protection is worth more when it preserves a persistent draw, resource, Hold, or package payoff.",
      cardIds: [left.id, right.id],
      traits: ["deflect", "hold"]
    });
  }
  if (leftTraits.has("legion") && rightEnergy <= 2 || rightTraits.has("legion") && leftEnergy <= 2) {
    const value = 0.3;
    synergy += value;
    reasons.push({
      id: `legion-sequencing:${left.id}:${right.id}`,
      label: "Legion sequencing",
      kind: "synergy",
      scope: "mechanic-package",
      value,
      detail: "The cheap card can turn on Legion while leaving enough Energy to play the payoff in the same turn.",
      cardIds: [left.id, right.id],
      traits: ["legion"]
    });
  }
  if (leftEnergy >= 6 && rightEnergy >= 6) {
    const value = round(
      clamp2(0.18 + (leftEnergy + rightEnergy - 12) * 0.055, 0.18, 0.72),
      2
    );
    antisynergy += value;
    reasons.push({
      id: `curve-collision:${left.id}:${right.id}`,
      label: "Top-end curve collision",
      kind: "antisynergy",
      scope: "resource-conflict",
      value: -value,
      detail: "Two expensive cards increase dead-opening and same-turn sequencing risk unless the deck supplies acceleration.",
      cardIds: [left.id, right.id],
      traits: ["power-demand"]
    });
  }
  const leftPower = Math.max(0, finiteOr(left.power, 0));
  const rightPower = Math.max(0, finiteOr(right.power, 0));
  const sharedPowerDomains = left.domains.some(
    (domain) => domain !== "colorless" && right.domains.includes(domain)
  );
  if (leftPower >= 2 && rightPower >= 2 && leftEnergy <= 4 && rightEnergy <= 4 && sharedPowerDomains) {
    const value = round(
      clamp2(0.2 + (leftPower + rightPower - 4) * 0.09, 0.2, 0.65),
      2
    );
    antisynergy += value;
    reasons.push({
      id: `early-power-collision:${left.id}:${right.id}`,
      label: "Early colored-Power collision",
      kind: "antisynergy",
      scope: "resource-conflict",
      value: -value,
      detail: "Both early plays recycle multiple matching runes, competing for the same colored Power window and future Energy.",
      cardIds: [left.id, right.id],
      traits: ["power-demand"]
    });
  }
  const leftTrashConsumer = hasAnyTrait(leftTraits, [
    "flow",
    "trash-banish",
    "trash-retrieval"
  ]);
  const rightTrashConsumer = hasAnyTrait(rightTraits, [
    "flow",
    "trash-banish",
    "trash-retrieval"
  ]);
  const suppliesTrash = hasAnyTrait(leftTraits, ["trash-filler", "burn-self", "discard"]) || hasAnyTrait(rightTraits, ["trash-filler", "burn-self", "discard"]);
  if (leftTrashConsumer && rightTrashConsumer && !suppliesTrash) {
    const value = 0.42;
    antisynergy += value;
    reasons.push({
      id: `trash-contention:${left.id}:${right.id}`,
      label: "Shared trash demand",
      kind: "antisynergy",
      scope: "resource-conflict",
      value: -value,
      detail: "Both cards consume or depend on the trash without either card supplying fuel.",
      cardIds: [left.id, right.id],
      traits: ["trash-payoff"]
    });
  }
  synergy = round(clamp2(synergy, 0, 10), 2);
  antisynergy = round(clamp2(antisynergy, 0, 5), 2);
  return {
    cardIds: [left.id, right.id],
    synergy,
    antisynergy,
    net: round(synergy - antisynergy, 2),
    reasons: reasons.sort(
      (a, b) => Math.abs(b.value) - Math.abs(a.value) || a.id.localeCompare(b.id)
    )
  };
}
function cardTripleFeatures(cards, pairAnalyses, traitSets) {
  const hasAcross = (traits) => traits.every((trait) => traitSets.some((set) => set.has(trait)));
  const mechanicalEdges = pairAnalyses.filter(
    (analysis) => analysis.reasons.some(
      (reason) => reason.kind === "synergy" && (reason.scope === "mechanic-package" || reason.scope === "explicit-reference")
    )
  );
  const connectedCards = new Set(
    mechanicalEdges.flatMap((analysis) => analysis.cardIds)
  );
  const curveBands = cards.map(curveBandFor);
  return {
    closedMechanicalChain: mechanicalEdges.length >= 2 && connectedCards.size === 3,
    extraTurnEngine: traitSets.some((traits) => traits.has("skip")) && traitSets.some(
      (traits) => hasAnyTrait(traits, ["hold", "scoring", "ready"])
    ) && traitSets.some(
      (traits) => hasAnyTrait(traits, ["energy-ramp", "cost-reduction"])
    ),
    trashLoop: hasAcross(["trash-filler", "flow"]) && traitSets.some(
      (traits) => hasAnyTrait(traits, ["trash-payoff", "trash-retrieval"])
    ),
    wideScoring: hasAcross(["token", "wide", "scoring"]),
    slowCurvePenalty: curveBands.every(
      (band) => band === "mid" || band === "top"
    ) ? curveBands.every((band) => band === "top") ? 0.95 : 0.45 : 0
  };
}
function cardTripleScore(pairAnalyses, features) {
  let synergy = pairAnalyses.reduce((sum, analysis) => sum + analysis.synergy, 0) * 0.65;
  if (features.closedMechanicalChain) synergy += 0.72;
  if (features.extraTurnEngine) synergy += 1.85;
  if (features.trashLoop) synergy += 1.25;
  if (features.wideScoring) synergy += 1.1;
  synergy = round(clamp2(synergy, 0, 18), 2);
  const antisynergy = round(
    clamp2(
      pairAnalyses.reduce((sum, analysis) => sum + analysis.antisynergy, 0) * 0.65 + features.slowCurvePenalty,
      0,
      8
    ),
    2
  );
  return {
    synergy,
    antisynergy,
    net: round(synergy - antisynergy, 2)
  };
}
function resolveCardTriple(first, second, third, analyzePair, traitsFor) {
  const cards = [first, second, third].sort(
    (left, right) => left.id.localeCompare(right.id)
  );
  const cardIds = cards.map((card) => card.id);
  const pairAnalyses = [
    analyzePair(cards[0], cards[1]),
    analyzePair(cards[0], cards[2]),
    analyzePair(cards[1], cards[2])
  ];
  const traitSets = cards.map(traitsFor);
  const features = cardTripleFeatures(cards, pairAnalyses, traitSets);
  return {
    cards,
    cardIds,
    pairAnalyses,
    features,
    score: cardTripleScore(pairAnalyses, features)
  };
}
function analyzeCardTripleWithResolvers(first, second, third, analyzePair, traitsFor) {
  const { cardIds, pairAnalyses, features, score } = resolveCardTriple(
    first,
    second,
    third,
    analyzePair,
    traitsFor
  );
  const reasons = pairAnalyses.flatMap((analysis) => analysis.reasons);
  const addMotif = (id, label, value, detail, traits) => {
    reasons.push({
      id: `${id}:${cardIds.join(":")}`,
      label,
      kind: "synergy",
      scope: "triple-motif",
      value,
      detail,
      cardIds: [...cardIds],
      traits
    });
  };
  if (features.closedMechanicalChain) {
    addMotif(
      "closed-mechanical-chain",
      "Closed three-card engine",
      0.72,
      "At least two explicit mechanical edges connect all three cards, forming a real setup-to-payoff chain rather than three unrelated good cards.",
      []
    );
  }
  if (features.extraTurnEngine) {
    addMotif(
      "extra-turn-engine",
      "Accelerated extra-turn scoring engine",
      1.85,
      "Acceleration reaches the finisher while Hold/scoring converts the additional ready-and-score window.",
      ["skip", "hold", "energy-ramp"]
    );
  }
  if (features.trashLoop) {
    addMotif(
      "trash-loop",
      "Trash setup, cast, and recovery",
      1.25,
      "The package supplies trash, spends it through Flow, and recovers or rewards the consumed resource.",
      ["trash-filler", "flow", "trash-payoff"]
    );
  }
  if (features.wideScoring) {
    addMotif(
      "wide-scoring",
      "Token-wide battlefield conversion",
      1.1,
      "Token production supplies a wide board and the third card converts that board into battlefield pressure.",
      ["token", "wide", "scoring"]
    );
  }
  if (features.slowCurvePenalty > 0) {
    const value = features.slowCurvePenalty;
    reasons.push({
      id: `triple-curve-cluster:${cardIds.join(":")}`,
      label: "Slow three-card package",
      kind: "antisynergy",
      scope: "triple-motif",
      value: -value,
      detail: "All three cards occupy the 4+ Energy portion of the curve, reducing early sequencing and same-turn combination access.",
      cardIds: [...cardIds],
      traits: ["power-demand"]
    });
  }
  return {
    cardIds,
    ...score,
    reasons: reasons.sort(
      (a, b) => Math.abs(b.value) - Math.abs(a.value) || a.id.localeCompare(b.id)
    )
  };
}
function analyzeCardTriple(first, second, third) {
  return analyzeCardTripleWithResolvers(
    first,
    second,
    third,
    analyzeCardPair,
    deriveTraits
  );
}
var DEAD_PAYOFF_RULES = [
  {
    id: "dead-empower-payoff",
    payoffTraits: ["empowered-payoff", "disempower"],
    supportTraits: ["empower"],
    label: "Empower payoffs without enablers",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.38,
    cap: 4
  },
  {
    id: "dead-xp-payoff",
    payoffTraits: ["level", "xp-spend"],
    supportTraits: ["hunt"],
    label: "XP outlets without generation",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.38,
    cap: 4
  },
  {
    id: "dead-gear-payoff",
    payoffTraits: ["gear-matters"],
    supportTraits: ["gear"],
    label: "Gear payoffs without Gear",
    minimumPayoffs: 1,
    minimumSupport: 3,
    coefficient: 0.34,
    cap: 3.8
  },
  {
    id: "dead-spell-payoff",
    payoffTraits: ["spell-matters"],
    supportTraits: ["spell"],
    label: "Spell payoffs without spells",
    minimumPayoffs: 3,
    minimumSupport: 5,
    coefficient: 0.28,
    cap: 3.4
  },
  {
    id: "dead-token-payoff",
    payoffTraits: ["token-matters", "wide", "legion"],
    supportTraits: ["token"],
    label: "Token payoffs without production",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.3,
    cap: 3.5
  },
  {
    id: "dead-trash-payoff",
    payoffTraits: ["flow", "trash-retrieval", "trash-payoff"],
    supportTraits: ["trash-filler", "burn-self", "discard"],
    label: "Trash payoffs without setup",
    minimumPayoffs: 4,
    minimumSupport: 3,
    coefficient: 0.34,
    cap: 4.2
  },
  {
    id: "dead-movement-payoff",
    payoffTraits: ["movement-payoff"],
    supportTraits: ["movement"],
    label: "Move triggers without movement",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.3,
    cap: 3.2
  },
  {
    id: "dead-topdeck-payoff",
    payoffTraits: ["topdeck-payoff"],
    supportTraits: ["predict", "recycle"],
    label: "Top-deck payoffs without control",
    minimumPayoffs: 3,
    minimumSupport: 2,
    coefficient: 0.3,
    cap: 3.2
  }
];
function countCardsWithAnyTrait(cards, traits) {
  return cards.filter((card) => {
    const cardTraits = deriveTraits(card);
    return traits.some((trait) => cardTraits.has(trait));
  }).length;
}
function contextualAffinity(context, candidate) {
  let affinity = synergyAffinity(context, candidate);
  if (context.type === "legend" && candidate.type === "unit" && championMatchesLegend(context, candidate)) {
    affinity += 1.35;
  }
  return round(clamp2(affinity, 0, 8), 2);
}
function conditionalSupportCard(card) {
  const text = rulesForScoring(card);
  return conditionalClauseCount(text) > 0 && !isImmediatePlayEffect(text);
}
function validExternalLegend(legend) {
  return legend?.type === "legend" ? legend : null;
}
function scoreDeck(requestedEntries, options = {}) {
  const normalizedRequestedEntries = normalizeDeckEntries(requestedEntries);
  const invalidMainDeckEntries = normalizedRequestedEntries.filter(
    ({ card }) => !isMainDeckScoreCard(card)
  );
  const entries = normalizedRequestedEntries.filter(
    ({ card }) => isMainDeckScoreCard(card)
  );
  const legend = validExternalLegend(options.legend);
  const format = options.format ?? "standard-1v1";
  const isPreRift = format === "vendetta-prerift";
  const sealedMinimumMainDeck = Math.floor(
    clamp2(finiteOr(options.sealedRules?.minimumMainDeck, 25), 1, 200)
  );
  const requestedSealedMaximum = options.sealedRules?.maximumMainDeck;
  const sealedMaximumMainDeck = requestedSealedMaximum === null || requestedSealedMaximum === void 0 ? null : Math.floor(
    clamp2(
      finiteOr(requestedSealedMaximum, 200),
      sealedMinimumMainDeck,
      200
    )
  );
  const sealedMaximumDomains = Math.floor(
    clamp2(finiteOr(options.sealedRules?.maximumDomains, 3), 1, 6)
  );
  const sealedBattlefieldCount = Math.floor(
    clamp2(finiteOr(options.sealedRules?.battlefieldCount, 3), 0, 10)
  );
  const sealedBattlefieldLabel = sealedBattlefieldCount === 3 ? "three" : String(sealedBattlefieldCount);
  const sealedDomainLabel = sealedMaximumDomains === 3 ? "three" : String(sealedMaximumDomains);
  const sealedDomainNoun = sealedMaximumDomains === 1 ? "domain" : "domains";
  const championRules = {
    ...isPreRift ? {
      required: false,
      countsInMainDeck: false,
      mustMatchLegendChampion: false
    } : {
      required: true,
      countsInMainDeck: true,
      mustMatchLegendChampion: true
    },
    ...options.championRules
  };
  const targetDeckSize = Math.floor(
    clamp2(
      finiteOr(options.targetDeckSize, isPreRift ? sealedMinimumMainDeck : 40),
      1,
      200
    )
  );
  const openingHand = Math.floor(
    clamp2(
      finiteOr(options.openingHand, STANDARD_OPENING_HAND),
      0,
      targetDeckSize
    )
  );
  const earlyDraws = Math.floor(
    clamp2(finiteOr(options.earlyDraws, DEFAULT_EARLY_DRAWS), 0, targetDeckSize)
  );
  const runeDeckSize = Math.floor(
    clamp2(finiteOr(options.runeDeckSize, 12), 1, 40)
  );
  const cards = weightedCards(entries);
  const totalCards = cards.length;
  const contributions = [];
  const traitCounts = /* @__PURE__ */ new Map();
  const foundationSum = cards.reduce(
    (sum, card) => sum + Math.round(baseCardRating(card) * 100),
    0
  ) / 100;
  const selectedEntries = entries.map(({ card, quantity }) => ({
    card,
    quantity: safeQuantity(quantity)
  })).filter(({ quantity }) => quantity > 0).sort((left, right) => left.card.id.localeCompare(right.card.id));
  const equipmentContexts = new Map(
    selectedEntries.flatMap(({ card, quantity }) => {
      const context = equipmentContextForCard(
        card,
        quantity,
        selectedEntries,
        targetDeckSize,
        openingHand,
        earlyDraws
      );
      return context ? [[card.id, context]] : [];
    })
  );
  const pairAnalyses = selectedEntries.flatMap(
    (left, leftIndex) => selectedEntries.slice(leftIndex).flatMap(
      (right) => left.card.id === right.card.id && left.quantity < 2 ? [] : [
        {
          analysis: analyzeCardPair(left.card, right.card),
          leftQuantity: left.quantity,
          rightQuantity: right.quantity
        }
      ]
    )
  );
  for (const card of cards) {
    for (const trait of deriveTraits(card)) {
      traitCounts.set(trait, (traitCounts.get(trait) ?? 0) + 1);
    }
  }
  const base = totalCards === 0 ? 0 : round(foundationSum / targetDeckSize * FOUNDATION_DECK_SCALE);
  if (totalCards > 0) {
    contributions.push({
      id: "base-quality",
      label: "Base card quality",
      value: base,
      detail: `${totalCards}/${targetDeckSize} cards contribute ${round(
        base
      )} foundation RDS; selected cards average ${round(
        foundationSum / totalCards
      )}.`
    });
  }
  const packageCandidates = PACKAGE_PAIRS.map((pair) => {
    const leftCopies = traitCounts.get(pair.left) ?? 0;
    const rightCopies = traitCounts.get(pair.right) ?? 0;
    const overlap = cards.filter((card) => {
      const traits = deriveTraits(card);
      return traits.has(pair.left) && traits.has(pair.right);
    }).length;
    const reliability = earlyPackageReliability(
      targetDeckSize,
      leftCopies,
      rightCopies,
      overlap,
      openingHand,
      earlyDraws
    );
    const balance = leftCopies + rightCopies === 0 ? 0 : 2 * Math.min(leftCopies, rightCopies) / (leftCopies + rightCopies);
    const density = 1 - Math.exp(-(leftCopies + rightCopies) / 5);
    const rawValue = leftCopies === 0 || rightCopies === 0 ? 0 : clamp2(
      3.15 * reliability ** 0.72 * (0.48 + balance * 0.52) * density,
      0,
      2.8
    );
    return {
      ...pair,
      leftCopies,
      rightCopies,
      overlap,
      reliability,
      balance,
      rawValue
    };
  }).filter(({ rawValue }) => rawValue >= 0.08);
  const traitPackageDegrees = /* @__PURE__ */ new Map();
  for (const candidate of packageCandidates) {
    traitPackageDegrees.set(
      candidate.left,
      (traitPackageDegrees.get(candidate.left) ?? 0) + 1
    );
    traitPackageDegrees.set(
      candidate.right,
      (traitPackageDegrees.get(candidate.right) ?? 0) + 1
    );
  }
  let synergy = 0;
  for (const candidate of packageCandidates.sort(
    (left, right) => right.rawValue - left.rawValue || `${left.left}-${left.right}`.localeCompare(
      `${right.left}-${right.right}`
    )
  )) {
    const overlapDiscount = Math.sqrt(
      (traitPackageDegrees.get(candidate.left) ?? 1) * (traitPackageDegrees.get(candidate.right) ?? 1)
    );
    const value = round(candidate.rawValue / overlapDiscount);
    if (value < 0.1) continue;
    synergy += value;
    contributions.push({
      id: `package-${candidate.left}-${candidate.right}`,
      label: candidate.label,
      value,
      detail: `${candidate.leftCopies} ${candidate.leftCopies === 1 ? "copy" : "copies"} + ${candidate.rightCopies} ${candidate.rightCopies === 1 ? "copy" : "copies"} \xB7 ${round(candidate.reliability * 100)}% chance to see both roles in the modeled ${openingHand}-card opener plus ${earlyDraws} early draws \xB7 ${round(candidate.balance * 100)}% package balance.`,
      cards: cardNames(
        entries,
        (card) => deriveTraits(card).has(candidate.left) || deriveTraits(card).has(candidate.right)
      )
    });
  }
  const deckTags = [...new Set(cards.flatMap((card) => card.tags))].sort();
  for (const tag of deckTags) {
    if (REGION_TAGS.has(tag)) continue;
    const supporters = cards.filter((card) => card.tags.includes(tag));
    const payoffs = cards.filter(
      (card) => textExplicitlyReferencesTag(card, tag)
    );
    if (supporters.length < 2 || payoffs.length === 0) continue;
    const overlap = supporters.filter((card) => payoffs.includes(card)).length;
    const reliability = earlyPackageReliability(
      targetDeckSize,
      supporters.length,
      payoffs.length,
      overlap,
      openingHand,
      earlyDraws
    );
    const balance = 2 * Math.min(supporters.length, payoffs.length) / (supporters.length + payoffs.length);
    const tagCeiling = TRIBAL_TAGS.has(tag) ? 2.1 : 1.65;
    const value = round(
      clamp2(
        tagCeiling * reliability ** 0.75 * (0.5 + balance * 0.5) * (1 - Math.exp(-supporters.length / 4)),
        0,
        tagCeiling
      )
    );
    if (value < 0.1) continue;
    synergy += value;
    contributions.push({
      id: `tag-${tag}`,
      label: `${tag} package`,
      value,
      detail: `${supporters.length} tagged cards connect to ${payoffs.length} rules-text references; generic region density is never scored as a combo.`,
      cards: cardNames(
        entries,
        (card) => card.tags.includes(tag) || textExplicitlyReferencesTag(card, tag)
      )
    });
  }
  const detailedPairSignals = pairAnalyses.map(({ analysis, leftQuantity, rightQuantity }) => {
    const reliability = analysis.cardIds[0] === analysis.cardIds[1] ? earlyCombinationReliability(
      targetDeckSize,
      [{ copies: leftQuantity, required: 2 }],
      openingHand,
      earlyDraws
    ) : earlyPackageReliability(
      targetDeckSize,
      leftQuantity,
      rightQuantity,
      0,
      openingHand,
      earlyDraws
    );
    const synergyReasons = analysis.reasons.filter(
      (reason) => reason.kind === "synergy" && !reason.id.startsWith("package:")
    );
    const antisynergyReasons = analysis.reasons.filter(
      (reason) => reason.kind === "antisynergy"
    );
    return {
      analysis,
      synergyReasons,
      antisynergyReasons,
      synergy: round(
        synergyReasons.reduce(
          (sum, reason) => sum + Math.max(0, reason.value),
          0
        ) * reliability ** 0.72 * 0.48,
        2
      ),
      friction: round(
        antisynergyReasons.reduce(
          (sum, reason) => sum + Math.abs(reason.value),
          0
        ) * reliability ** 0.72 * 0.48,
        2
      ),
      reliability
    };
  }).filter((signal) => signal.synergy >= 0.04 || signal.friction >= 0.04);
  const detailedPairSynergy = Math.min(
    5,
    detailedPairSignals.reduce((sum, signal) => sum + signal.synergy, 0)
  );
  if (detailedPairSynergy > 0) {
    synergy += detailedPairSynergy;
    for (const signal of [...detailedPairSignals].filter(({ synergy: value }) => value >= 0.04).sort(
      (left, right) => right.synergy - left.synergy || left.analysis.cardIds.join(":").localeCompare(right.analysis.cardIds.join(":"))
    ).slice(0, 4)) {
      contributions.push({
        id: `pair-${signal.analysis.cardIds.join("-")}`,
        label: signal.synergyReasons[0]?.label ?? "Explicit two-card package",
        value: signal.synergy,
        detail: `${round(signal.reliability * 100)}% modeled early overlap. ${signal.synergyReasons.map((reason) => reason.detail).join(" ")}`,
        cards: signal.analysis.cardIds.map(
          (cardId) => selectedEntries.find(({ card }) => card.id === cardId)?.card.name
        ).filter((name) => Boolean(name))
      });
    }
  }
  let tripleSynergy = 0;
  let tripleAntisynergy = 0;
  if ((options.combinationDepth ?? "full") === "full" && selectedEntries.reduce((sum, entry) => sum + entry.quantity, 0) >= 3) {
    const pairByIds = new Map(
      pairAnalyses.map(({ analysis }) => [
        analysis.cardIds.join(":"),
        analysis
      ])
    );
    const traitsById = new Map(
      selectedEntries.map(({ card }) => [card.id, deriveTraits(card)])
    );
    const analyzeSelectedPair = (left, right) => {
      const [orderedLeft, orderedRight] = orderedCardPair(left, right);
      return pairByIds.get(`${orderedLeft.id}:${orderedRight.id}`) ?? analyzeCardPair(orderedLeft, orderedRight);
    };
    const selectedTraits = (card) => traitsById.get(card.id) ?? deriveTraits(card);
    const tripleSignals = [];
    for (let firstIndex = 0; firstIndex < selectedEntries.length; firstIndex += 1) {
      for (let secondIndex = firstIndex; secondIndex < selectedEntries.length; secondIndex += 1) {
        for (let thirdIndex = secondIndex; thirdIndex < selectedEntries.length; thirdIndex += 1) {
          const selected = [
            selectedEntries[firstIndex],
            selectedEntries[secondIndex],
            selectedEntries[thirdIndex]
          ];
          const requiredCopies = /* @__PURE__ */ new Map();
          for (const entry of selected) {
            requiredCopies.set(
              entry.card.id,
              (requiredCopies.get(entry.card.id) ?? 0) + 1
            );
          }
          if ([...requiredCopies].some(
            ([cardId, required]) => required > (selectedEntries.find(({ card }) => card.id === cardId)?.quantity ?? 0)
          )) {
            continue;
          }
          const [firstSelected, secondSelected, thirdSelected] = selected;
          const analysis = analyzeCardTripleWithResolvers(
            firstSelected.card,
            secondSelected.card,
            thirdSelected.card,
            analyzeSelectedPair,
            selectedTraits
          );
          const motifReasons = analysis.reasons.filter(
            (reason) => reason.scope === "triple-motif" && reason.value !== 0
          );
          if (motifReasons.length === 0) continue;
          const reliability = earlyCombinationReliability(
            targetDeckSize,
            [...requiredCopies].map(([cardId, required]) => ({
              copies: selectedEntries.find(({ card }) => card.id === cardId)?.quantity ?? 0,
              required
            })),
            openingHand,
            earlyDraws
          );
          const synergyReasons = motifReasons.filter(
            (reason) => reason.kind === "synergy" && reason.value > 0
          );
          const antisynergyReasons = motifReasons.filter(
            (reason) => reason.kind === "antisynergy" && reason.value < 0
          );
          const synergyValue = round(
            synergyReasons.reduce((sum, reason) => sum + reason.value, 0) * reliability ** 0.7 * 0.42,
            2
          );
          const antisynergyValue = round(
            antisynergyReasons.reduce(
              (sum, reason) => sum + Math.abs(reason.value),
              0
            ) * reliability ** 0.7 * 0.42,
            2
          );
          if (synergyValue < 0.04 && antisynergyValue < 0.04) continue;
          tripleSignals.push({
            analysis,
            synergyReasons,
            antisynergyReasons,
            reliability,
            synergy: synergyValue,
            antisynergy: antisynergyValue
          });
        }
      }
    }
    tripleSynergy = Math.min(
      4,
      tripleSignals.reduce((sum, signal) => sum + signal.synergy, 0)
    );
    tripleAntisynergy = Math.min(
      4,
      tripleSignals.reduce((sum, signal) => sum + signal.antisynergy, 0)
    );
    if (tripleSynergy > 0) {
      synergy += tripleSynergy;
      for (const signal of tripleSignals.filter(({ synergy: value }) => value >= 0.04).sort(
        (left, right) => right.synergy - left.synergy || left.analysis.cardIds.join(":").localeCompare(right.analysis.cardIds.join(":"))
      ).slice(0, 3)) {
        contributions.push({
          id: `triple-${signal.analysis.cardIds.join("-")}`,
          label: signal.synergyReasons[0]?.label ?? "Three-card engine",
          value: signal.synergy,
          detail: `${round(signal.reliability * 100)}% modeled early three-card overlap. ${signal.synergyReasons.map((reason) => reason.detail).join(" ")}`,
          cards: signal.analysis.cardIds.map(
            (cardId) => selectedEntries.find(({ card }) => card.id === cardId)?.card.name
          ).filter((name) => Boolean(name))
        });
      }
    }
    if (tripleAntisynergy > 0) {
      for (const signal of tripleSignals.filter(({ antisynergy: value }) => value >= 0.04).sort(
        (left, right) => right.antisynergy - left.antisynergy || left.analysis.cardIds.join(":").localeCompare(right.analysis.cardIds.join(":"))
      ).slice(0, 3)) {
        contributions.push({
          id: `triple-antisynergy-${signal.analysis.cardIds.join("-")}`,
          label: signal.antisynergyReasons[0]?.label ?? "Three-card friction",
          value: -signal.antisynergy,
          detail: `${round(signal.reliability * 100)}% modeled early three-card overlap. ${signal.antisynergyReasons.map((reason) => reason.detail).join(" ")}`,
          cards: signal.analysis.cardIds.map(
            (cardId) => selectedEntries.find(({ card }) => card.id === cardId)?.card.name
          ).filter((name) => Boolean(name))
        });
      }
    }
  }
  synergy = round(Math.min(24, synergy));
  const detailedPairFriction = Math.min(
    4,
    detailedPairSignals.reduce((sum, signal) => sum + signal.friction, 0)
  );
  let antisynergy = detailedPairFriction + tripleAntisynergy;
  let equipmentPenaltyTotal = 0;
  let equipmentCarrierPenalty = 0;
  const strandedEquipmentNames = [];
  for (const { card } of selectedEntries) {
    const context = equipmentContexts.get(card.id);
    if (!context || context.penalty <= 0) continue;
    equipmentPenaltyTotal += context.penalty;
    if (isEquipmentCard(card)) {
      equipmentCarrierPenalty += context.penalty;
      strandedEquipmentNames.push(card.name);
      continue;
    }
    antisynergy += context.penalty;
    if (context.penalty >= 5e-3) {
      contributions.push({
        id: `equipment-activation:${card.id}`,
        label: `${card.name} Equipment activation`,
        value: context.breakdown.scoreAdjustment,
        detail: `${round(context.breakdown.activation * 100)}% deck-context activation: ${context.breakdown.detail} ${context.breakdown.conditionalValue} conditional RDS realizes ${context.breakdown.realizedConditionalValue}; ${context.breakdown.reattachTempoTax} re-equip tempo yields an exact ${context.breakdown.scoreAdjustment} adjustment.`,
        cards: [card.name]
      });
    }
  }
  if (equipmentCarrierPenalty > 0) {
    const value = round(equipmentCarrierPenalty, 3);
    antisynergy += value;
    if (value >= 5e-3) {
      contributions.push({
        id: "equipment-carriers",
        label: "Equipment without reliable carriers",
        value: -value,
        detail: "Only the Equipment-dependent slice of each Gear card is gated by the chance to find a causal unit carrier in the modeled early window.",
        cards: [...new Set(strandedEquipmentNames)].sort((left, right) => left.localeCompare(right)).slice(0, 6)
      });
    }
  }
  if (detailedPairFriction > 0) {
    contributions.push({
      id: "pair-resource-friction",
      label: "Pair resource friction",
      value: -round(detailedPairFriction, 2),
      detail: "Exact pair analysis found top-end, early colored-Power, or shared-resource collisions after modeled draw overlap.",
      cards: detailedPairSignals.filter(({ friction }) => friction > 0).sort((left, right) => right.friction - left.friction).flatMap(
        ({ analysis }) => analysis.cardIds.map(
          (cardId) => selectedEntries.find(({ card }) => card.id === cardId)?.card.name
        )
      ).filter((name) => Boolean(name)).filter((name, index, names) => names.indexOf(name) === index).slice(0, 6)
    });
  }
  const units = cards.filter((card) => card.type === "unit").length;
  const cheapUnits = cards.filter(
    (card) => card.type === "unit" && finiteOr(card.energy, 99) >= 1 && finiteOr(card.energy, 99) <= 4
  ).length;
  const earlyActions = cards.filter(
    (card) => ["unit", "spell", "gear"].includes(card.type) && finiteOr(card.energy, 99) <= 3
  ).length;
  const interactive = countCardsWithAnyTrait(cards, [
    "interaction",
    "removal",
    "counter",
    "stun"
  ]);
  const velocity = countCardsWithAnyTrait(cards, [
    "draw",
    "predict",
    "recycle"
  ]);
  const scoringRoles = countCardsWithAnyTrait(cards, [
    "scoring",
    "movement",
    "ganking",
    "assault"
  ]);
  const defensiveRoles = countCardsWithAnyTrait(cards, [
    "shield",
    "tank",
    "deflect",
    "damage-prevention",
    "heal"
  ]);
  const expensive = cards.filter(
    (card) => finiteOr(card.energy, 0) >= 6
  ).length;
  const midCurve = cards.filter(
    (card) => finiteOr(card.energy, 0) >= 4 && finiteOr(card.energy, 0) <= 5
  ).length;
  const curveCounts = {
    early: cards.filter((card) => curveBandFor(card) === "early").length,
    setup: cards.filter((card) => curveBandFor(card) === "setup").length,
    mid: cards.filter((card) => curveBandFor(card) === "mid").length,
    top: cards.filter((card) => curveBandFor(card) === "top").length
  };
  const officialEarlyUnits = cards.filter(
    (card) => card.type === "unit" && finiteOr(card.energy, 99) >= 2 && finiteOr(card.energy, 99) <= 4
  ).length;
  const curveProfile = DECK_CURVE_TARGETS[format];
  const curveScale = targetDeckSize / curveProfile.targetDeckSize;
  const scaledCurveBands = curveProfile.bands.map((band) => ({
    ...band,
    minimum: Math.max(1, Math.round(band.minimum * curveScale)),
    ideal: Math.max(1, Math.round(band.ideal * curveScale)),
    maximum: Math.max(1, Math.round(band.maximum * curveScale))
  }));
  const distinctDomains = new Set(
    cards.flatMap((card) => card.domains).filter((domain) => domain !== "colorless")
  );
  const runes = allocateRunes(entries, legend?.domains, runeDeckSize);
  const runeStrain = runeDemandStrain(entries, runes);
  const unitTarget = isPreRift ? 15 : 18;
  const cheapUnitTarget = isPreRift ? 5 : 9;
  const earlyActionTarget = isPreRift ? 7 : 11;
  const interactionTarget = isPreRift ? 3 : 6;
  const velocityTarget = isPreRift ? 2 : 4;
  if (totalCards > 0 && units < unitTarget) {
    const value = round(Math.min(7, (unitTarget - units) * 0.48));
    antisynergy += value;
    contributions.push({
      id: "low-unit-count",
      label: "Low board presence",
      value: -value,
      detail: `${units} units leave the deck below the ${unitTarget}-unit structural target.`
    });
  }
  if (totalCards > 0 && earlyActions < earlyActionTarget) {
    const value = round(Math.min(5, (earlyActionTarget - earlyActions) * 0.36));
    antisynergy += value;
    contributions.push({
      id: "slow-opening",
      label: "Low early playability",
      value: -value,
      detail: `${earlyActions}/${earlyActionTarget} modeled 1\u20133 Energy actions can affect the opening turns.`
    });
  }
  if (totalCards > 0 && officialEarlyUnits < cheapUnitTarget) {
    const value = round(
      Math.min(5.5, (cheapUnitTarget - officialEarlyUnits) * 0.42)
    );
    antisynergy += value;
    contributions.push({
      id: "official-early-unit-floor",
      label: "2\u20134 Energy unit access",
      value: -value,
      detail: `${officialEarlyUnits}/${cheapUnitTarget} modeled early units. Riot\u2019s official Deckbuilding Primer recommends at least nine 2\u20134 Energy units in a 40-card deck.`,
      cards: cardNames(
        entries,
        (card) => card.type === "unit" && finiteOr(card.energy, 99) >= 2 && finiteOr(card.energy, 99) <= 4
      )
    });
  }
  if (totalCards > 0 && expensive / totalCards > 0.24) {
    const value = round(Math.min(6, (expensive / totalCards - 0.24) * 18));
    antisynergy += value;
    contributions.push({
      id: "top-heavy",
      label: "Top-heavy curve",
      value: -value,
      detail: `${expensive} cards cost six or more Energy.`
    });
  }
  const saturatedBands = scaledCurveBands.filter(
    (band) => curveCounts[band.id] > band.maximum
  );
  for (const band of saturatedBands) {
    const excess = curveCounts[band.id] - band.maximum;
    const value = round(
      Math.min(4.5, excess * (band.id === "mid" ? 0.34 : 0.42))
    );
    antisynergy += value;
    contributions.push({
      id: `curve-saturation-${band.id}`,
      label: `${band.label} curve saturation`,
      value: -value,
      detail: `${curveCounts[band.id]} cards occupy ${band.label}; the ${targetDeckSize}-card theorycraft prior keeps this band at or below ${band.maximum} unless an engine explicitly supports it.`,
      cards: cardNames(entries, (card) => curveBandFor(card) === band.id)
    });
  }
  for (const rule of ORPHAN_ENGINE_RULES) {
    const enablerCards = cards.filter((card) => {
      const traits = deriveTraits(card);
      return rule.enablers.some((trait) => traits.has(trait));
    });
    if (enablerCards.length < rule.minimumEnablers) continue;
    const payoffCards = cards.filter((card) => {
      const traits = deriveTraits(card);
      return rule.payoffs.some((trait) => traits.has(trait));
    });
    if (payoffCards.length >= rule.minimumPayoffs) continue;
    const missingShare = (rule.minimumPayoffs - payoffCards.length) / rule.minimumPayoffs;
    const value = round(
      Math.min(rule.cap, enablerCards.length * rule.coefficient * missingShare)
    );
    antisynergy += value;
    contributions.push({
      id: rule.id,
      label: rule.label,
      value: -value,
      detail: `${enablerCards.length} setup cards connect to only ${payoffCards.length}/${rule.minimumPayoffs} expected payoff cards.`,
      cards: [...new Set(enablerCards.map((card) => card.name))].sort((left, right) => left.localeCompare(right)).slice(0, 6)
    });
  }
  for (const rule of DEAD_PAYOFF_RULES) {
    const payoffCount = countCardsWithAnyTrait(cards, rule.payoffTraits);
    const supportCount = countCardsWithAnyTrait(cards, rule.supportTraits);
    if (payoffCount < rule.minimumPayoffs || supportCount >= rule.minimumSupport) {
      continue;
    }
    const missingShare = (rule.minimumSupport - supportCount) / rule.minimumSupport;
    const value = round(
      Math.min(rule.cap, payoffCount * rule.coefficient * missingShare)
    );
    antisynergy += value;
    contributions.push({
      id: rule.id,
      label: rule.label,
      value: -value,
      detail: `${payoffCount} payoff cards connect to only ${supportCount}/${rule.minimumSupport} expected setup cards.`,
      cards: cardNames(entries, (card) => {
        const traits = deriveTraits(card);
        return rule.payoffTraits.some((trait) => traits.has(trait));
      })
    });
  }
  const trashFillers = countCardsWithAnyTrait(cards, [
    "trash-filler",
    "burn-self"
  ]);
  const trashBanishers = countCardsWithAnyTrait(cards, ["trash-banish"]);
  const trashReusers = countCardsWithAnyTrait(cards, [
    "flow",
    "trash-retrieval"
  ]);
  if (trashBanishers >= 2 && trashReusers >= 2) {
    const consumerDemand = trashBanishers + trashReusers;
    const shortage = Math.max(0, consumerDemand * 0.75 - trashFillers);
    if (shortage > 0) {
      const competition = 2 * Math.min(trashBanishers, trashReusers) / consumerDemand;
      const value = round(
        Math.min(5, shortage * 0.38 * (0.65 + competition * 0.35))
      );
      antisynergy += value;
      contributions.push({
        id: "trash-resource-conflict",
        label: "Competing trash consumers",
        value: -value,
        detail: `${trashBanishers} banish-from-trash cards and ${trashReusers} Flow/retrieval cards compete for only ${trashFillers} dedicated trash fillers.`,
        cards: cardNames(entries, (card) => {
          const traits = deriveTraits(card);
          return traits.has("trash-banish") || traits.has("flow") || traits.has("trash-retrieval");
        })
      });
    }
  }
  const gears = cards.filter((card) => card.type === "gear").length;
  if (gears >= 5 && units < 12) {
    const value = round(Math.min(4.5, (gears - 4) * 0.2 + (12 - units) * 0.24));
    antisynergy += value;
    contributions.push({
      id: "gear-without-board",
      label: "Gear without enough carriers",
      value: -value,
      detail: `${gears} Gear cards have only ${units} units available to establish and hold a board.`
    });
  }
  const buffProducers = traitCounts.get("buff-producer") ?? 0;
  if (buffProducers >= 4 && units < 12) {
    const value = round(
      Math.min(4, (buffProducers - 3) * 0.22 + (12 - units) * 0.2)
    );
    antisynergy += value;
    contributions.push({
      id: "buff-without-board",
      label: "Buffs without enough board",
      value: -value,
      detail: `${buffProducers} buff effects depend on a deck with only ${units} units.`
    });
  }
  const conditionalCards = cards.filter(conditionalSupportCard).length;
  const conditionalThreshold = Math.ceil(totalCards * 0.36);
  if (totalCards >= 20 && conditionalCards > conditionalThreshold) {
    const value = round(
      Math.min(3.5, (conditionalCards - conditionalThreshold) * 0.2)
    );
    antisynergy += value;
    contributions.push({
      id: "conditional-density",
      label: "Conditional dead-draw risk",
      value: -value,
      detail: `${conditionalCards} cards need a board, trigger, or game state before producing their modeled value.`
    });
  }
  if (runeStrain > 0) {
    antisynergy += runeStrain;
    contributions.push({
      id: "rune-strain",
      label: "Colored Power strain",
      value: -runeStrain,
      detail: `Power requirements are stressed against the recommended ${runeDeckSize}-rune split (${runes.map((rune) => `${rune.domain} ${rune.count}`).join(" \xB7 ")}). Recycling a rune for Power also removes future Energy tempo, so earlier multi-Power cards carry more weight.`
    });
  }
  if (legend && !isPreRift) {
    const legendDomains = new Set(legend.domains);
    const offDomain = cards.filter(
      (card) => card.domains.length > 0 && !card.domains.includes("colorless") && !card.domains.every((domain) => legendDomains.has(domain))
    );
    if (offDomain.length > 0) {
      const value = Math.min(18, offDomain.length * 1.5);
      antisynergy += value;
      contributions.push({
        id: "off-domain",
        label: "Domain violation",
        value: -value,
        detail: `${offDomain.length} cards fall outside the Legend\u2019s domain identity.`,
        cards: [...new Set(offDomain.map((card) => card.name))].sort((left, right) => left.localeCompare(right)).slice(0, 6)
      });
    }
  } else if (!isPreRift && distinctDomains.size > 2) {
    const value = (distinctDomains.size - 2) * 2.5;
    antisynergy += value;
    contributions.push({
      id: "domain-spread",
      label: "Unfocused domain demand",
      value: -value,
      detail: `${distinctDomains.size} domains are present before choosing a Legend.`
    });
  }
  const nonEquipmentAntisynergy = Math.max(
    0,
    antisynergy - equipmentPenaltyTotal
  );
  antisynergy = round(
    equipmentPenaltyTotal + Math.min(48, nonEquipmentAntisynergy),
    3
  );
  let structure = 0;
  if (totalCards > 0) {
    structure += Math.min(4.1, units / unitTarget * 4.1);
    structure += Math.min(2.5, earlyActions / earlyActionTarget * 2.5);
    structure += Math.min(2.2, interactive / interactionTarget * 2.2);
    structure += Math.min(1.5, velocity / velocityTarget * 1.5);
    structure += Math.min(1.1, scoringRoles / (isPreRift ? 3 : 5) * 1.1);
    structure += Math.min(0.8, defensiveRoles / (isPreRift ? 2 : 4) * 0.8);
    const curveCoverage = scaledCurveBands.reduce(
      (sum, band) => sum + Math.min(1, curveCounts[band.id] / Math.max(1, band.ideal)),
      0
    ) / scaledCurveBands.length;
    structure += curveCoverage * 1.5;
    if (earlyActions > 0 && midCurve > 0 && expensive < totalCards * 0.35) {
      structure += 0.6;
    }
    if (!isPreRift && totalCards === 40 || isPreRift && totalCards >= 25) {
      structure += 1.2;
    }
  }
  structure = round(Math.min(14, structure));
  contributions.push({
    id: "deck-structure",
    label: "Curve & role coverage",
    value: structure,
    detail: `${units} units (${officialEarlyUnits} at 2\u20134 Energy) \xB7 curve ${curveCounts.early}/${curveCounts.setup}/${curveCounts.mid}/${curveCounts.top} across 1\u20132/3/4\u20135/6+ \xB7 ${interactive} interaction \xB7 ${velocity} velocity \xB7 ${scoringRoles} scoring/movement \xB7 ${defensiveRoles} protection.`
  });
  const contextScore = (context, cap, coefficient) => {
    const affinities = cards.map((card) => contextualAffinity(context, card)).filter((affinity) => affinity >= 0.16).sort((left, right) => right - left).slice(0, 12);
    return Math.min(
      cap,
      affinities.reduce(
        (sum, affinity) => sum + Math.min(1.6, affinity) * coefficient,
        0
      )
    );
  };
  let compatibility = 0;
  if (legend) {
    compatibility += contextScore(legend, 5.2, 0.3);
    if (options.champion && championMatchesLegend(legend, options.champion)) {
      compatibility += 0.7;
    }
  }
  if (options.champion) {
    compatibility += contextScore(options.champion, 3.2, 0.2);
  }
  for (const battlefield of options.battlefields ?? []) {
    compatibility += contextScore(battlefield, 1.1, 0.1);
  }
  compatibility = round(Math.min(12, compatibility));
  if (compatibility > 0) {
    contributions.push({
      id: "legend-compatibility",
      label: "Legend, Champion & Battlefield fit",
      value: compatibility,
      detail: "Context fit uses explicit rules-text packages and Champion identity. Shared region tags and domain legality do not inflate this component."
    });
  }
  const requestedMeta = options.metaAdjustment ?? 0;
  const legacyMeta = Number.isFinite(requestedMeta) ? Math.max(-5, Math.min(5, requestedMeta)) : 0;
  const evidenceMeta = resolveDeckMetaOverlay(entries, options.metaCalibration);
  const totalCopies = entries.reduce((n, entry) => n + entry.quantity, 0);
  const averagedEvidence = totalCopies > 0 ? entries.reduce(
    (sum, entry) => {
      const rating = rateCardWithEvidence(
        entry.card,
        options.gameplayEvidence
      );
      return {
        tournament: sum.tournament + rating.tournament * entry.quantity,
        outcomes: sum.outcomes + rating.outcomes * entry.quantity
      };
    },
    { tournament: 0, outcomes: 0 }
  ) : { tournament: 0, outcomes: 0 };
  const tournamentPoints = totalCopies > 0 ? averagedEvidence.tournament / totalCopies * 10 : 0;
  const outcomePoints = totalCopies > 0 ? averagedEvidence.outcomes / totalCopies * 10 : 0;
  const cardEvidence = tournamentPoints + outcomePoints;
  const meta = round(
    Math.max(-5, Math.min(5, legacyMeta + evidenceMeta.total + cardEvidence))
  );
  const suppliedSnapshot = options.metaCalibration?.snapshot;
  const snapshot = suppliedSnapshot?.scoreModelVersion === SCORE_MODEL_VERSION ? suppliedSnapshot : null;
  contributions.push({
    id: "meta-calibration",
    label: "Meta calibration",
    value: meta,
    detail: `Historical Top-8 adoption ${round(tournamentPoints)} \xB7 qualified human inclusion outcomes ${round(outcomePoints)} \xB7 legacy source ${round(legacyMeta + evidenceMeta.total)}. Total correction capped at \xB15 deck points. Missing evidence is neutral.${snapshot ? ` Source: ${snapshot.attributionText}.` : ""}`,
    cards: evidenceMeta.matchedCardNames.slice(0, 6)
  });
  const rawTotal = round(
    base + synergy - antisynergy + compatibility + structure + meta,
    2
  );
  const floorAdjustment = rawTotal < 0 ? round(-rawTotal, 2) : 0;
  const total = round(rawTotal + floorAdjustment);
  if (floorAdjustment > 0) {
    contributions.push({
      id: "score-floor",
      label: "Zero-point score floor",
      value: floorAdjustment,
      detail: `The component ledger reached ${rawTotal}; a +${floorAdjustment} floor adjustment keeps the published deck score at zero.`
    });
  }
  const issues = [];
  const warnings = [];
  const invalidEntryTypes = new Set(
    invalidMainDeckEntries.map(({ card }) => card.type)
  );
  if (invalidEntryTypes.has("legend")) {
    issues.push(
      "Legends are external to the 40-card Main Deck; select exactly one through the Legend slot."
    );
  }
  if (invalidEntryTypes.has("rune")) {
    issues.push(
      "Rune cards belong to the separate Rune Deck and cannot be Main Deck entries."
    );
  }
  if (invalidEntryTypes.has("battlefield")) {
    issues.push(
      "Battlefields are external to the Main Deck; select them through the Battlefield slots."
    );
  }
  if (invalidMainDeckEntries.some(
    ({ card }) => !["legend", "rune", "battlefield"].includes(card.type)
  )) {
    issues.push("Only Unit, Spell, and Gear cards can be Main Deck entries.");
  }
  if (options.legend && !legend) {
    issues.push("Selected Legend must be a Legend card.");
  }
  const battlefields = options.battlefields ?? [];
  const previewCards = [
    ...entries.map(({ card }) => card),
    ...legend ? [legend] : [],
    ...options.champion ? [options.champion] : [],
    ...battlefields
  ].filter((card) => previewSetLegalFrom(card.setId) !== null);
  if (isPreRift) {
    if (totalCards < sealedMinimumMainDeck) {
      issues.push(
        `Pre-Rift Main Deck needs at least ${sealedMinimumMainDeck} cards (${totalCards}/${sealedMinimumMainDeck}).`
      );
    }
    if (sealedMaximumMainDeck !== null && totalCards > sealedMaximumMainDeck) {
      issues.push(
        `Pre-Rift Main Deck allows at most ${sealedMaximumMainDeck} cards (${totalCards}/${sealedMaximumMainDeck}).`
      );
    }
  } else if (totalCards !== 40) {
    issues.push(`Main Deck must be exactly 40 cards (${totalCards}/40).`);
  }
  if (!isPreRift && !legend) {
    issues.push("Choose exactly one Champion Legend.");
  }
  if (championRules.required && !options.champion) {
    issues.push("Choose one Chosen Champion.");
  }
  if (options.champion && championRules.countsInMainDeck && !entries.some(
    ({ card, quantity }) => card.id === options.champion?.id && quantity > 0
  )) {
    issues.push("Chosen Champion must be included in the Main Deck.");
  }
  if (legend && options.champion && championRules.mustMatchLegendChampion && !championMatchesLegend(legend, options.champion)) {
    issues.push("Chosen Champion must match the selected Champion Legend.");
  }
  if (!isPreRift) {
    const signatureEntries = entries.filter(
      ({ card }) => isSignatureCard(card)
    );
    const signatureTotal = signatureEntries.reduce(
      (total2, { quantity }) => total2 + quantity,
      0
    );
    if (signatureTotal > 3) {
      issues.push(
        `Main Deck has ${signatureTotal} Signature cards; Constructed allows at most 3 total.`
      );
    }
    if (legend) {
      for (const { card } of signatureEntries) {
        if (signatureMatchesLegend(card, legend)) continue;
        const signatureIdentity = card.tags[0] ?? "unknown-character";
        const article = /^[aeiou]/i.test(signatureIdentity) ? "an" : "a";
        issues.push(
          `${card.name} is ${article} ${signatureIdentity} Signature card and requires ${article} ${signatureIdentity} Champion Legend.`
        );
      }
    }
  }
  const battlefieldTotal = battlefields.length + (isPreRift ? options.blankBattlefields ?? 0 : 0);
  if (battlefieldTotal !== (isPreRift ? sealedBattlefieldCount : 3)) {
    issues.push(
      isPreRift ? `Present ${sealedBattlefieldLabel} Battlefields; opened cards or facedown blanks are allowed (${battlefieldTotal}/${sealedBattlefieldCount}).` : `Choose exactly three distinct Battlefields (${battlefields.length}/3).`
    );
  }
  if (new Set(battlefields.map((card) => card.name)).size !== battlefields.length) {
    issues.push("Battlefields must have unique names.");
  }
  if (!isPreRift && previewCards.length > 0) {
    for (const setId of new Set(previewCards.map((card) => card.setId))) {
      issues.push(
        `${previewSetLabel(setId)} cards are preview-only; local Constructed legality begins ${previewSetLegalFrom(setId)}.`
      );
    }
  }
  for (const { card, quantity } of entries) {
    if (!isPreRift && quantity > card.copyLimit) {
      issues.push(`${card.name} exceeds its ${card.copyLimit}-copy limit.`);
    }
    if (isPreRift && quantity > (options.sealedPool?.[card.id] ?? 0)) {
      issues.push(
        `${card.name} exceeds the ${options.sealedPool?.[card.id] ?? 0} copies in your sealed pool.`
      );
    }
    if (!isPreRift && CURRENT_CONSTRUCTED_BANS.cards.has(card.id)) {
      issues.push(`${card.name} is currently banned in Constructed.`);
    }
  }
  for (const battlefield of battlefields) {
    if (isPreRift && (options.sealedPool?.[battlefield.id] ?? 0) < 1) {
      issues.push(`${battlefield.name} is not recorded in your sealed pool.`);
    }
    if (!isPreRift && CURRENT_CONSTRUCTED_BANS.battlefields.has(battlefield.id)) {
      issues.push(`${battlefield.name} is currently banned in Constructed.`);
    }
  }
  const preRiftDomains = /* @__PURE__ */ new Set([
    ...distinctDomains,
    ...legend?.domains ?? [],
    ...options.champion?.domains ?? []
  ]);
  preRiftDomains.delete("colorless");
  if (isPreRift && preRiftDomains.size > sealedMaximumDomains) {
    issues.push(
      `Pre-Rift decks may use at most ${sealedDomainLabel} ${sealedDomainNoun} (${preRiftDomains.size} selected).`
    );
  }
  if (runes.length > 2)
    warnings.push("Rune demand spans more than two domains.");
  if (interactive < interactionTarget && totalCards >= (isPreRift ? sealedMinimumMainDeck : 30)) {
    warnings.push(
      `Fewer than ${interactionTarget} interactive cards may reduce comeback potential.`
    );
  }
  if (cheapUnits < cheapUnitTarget && totalCards >= (isPreRift ? sealedMinimumMainDeck : 30)) {
    warnings.push(
      `Fewer than ${cheapUnitTarget} 2\u20134 Energy units may weaken early battlefield access.`
    );
  }
  const contextCards = [
    legend,
    options.champion,
    ...options.battlefields ?? []
  ].filter((card) => Boolean(card));
  const matchedMetaNames = new Set(evidenceMeta.matchedCardNames);
  const curveIdeals = new Map(
    scaledCurveBands.map((band) => [band.id, band.ideal])
  );
  const rowWeights = selectedEntries.map(({ card, quantity }) => {
    const cardPairs = pairAnalyses.filter(
      ({ analysis }) => analysis.cardIds.includes(card.id)
    );
    const synergyWeight = cardPairs.reduce(
      (sum, pair) => sum + pair.analysis.synergy * (pair.analysis.cardIds[0] === card.id ? pair.rightQuantity : pair.leftQuantity) * quantity,
      0
    );
    const pairAntisynergy = cardPairs.reduce(
      (sum, pair) => sum + pair.analysis.antisynergy * (pair.analysis.cardIds[0] === card.id ? pair.rightQuantity : pair.leftQuantity) * quantity,
      0
    );
    const foundationProfile = baseCardRatingBreakdown(card);
    const effectProfile = {
      ...foundationProfile,
      mechanics: foundationProfile.mechanics,
      axes: foundationProfile.axes
    };
    const curveBand = curveBandFor(card);
    const curveDeficit = curveBand ? Math.max(0, (curveIdeals.get(curveBand) ?? 0) - curveCounts[curveBand]) : 0;
    const curveRepair = curveBand === "early" || curveBand === "setup" ? curveDeficit * 0.32 : curveBand === "mid" ? curveDeficit * 0.16 : curveDeficit * 0.08;
    const runeReliability = cardRuneReliability(card, runes);
    const conditionalRisk = conditionalClauseCount(rulesForScoring(card)) * 0.08 * quantity;
    const runeRisk = (1 - runeReliability) * Math.max(0, finiteOr(card.power, 0)) * quantity;
    const compatibilityWeight = contextCards.reduce(
      (sum, context) => sum + contextualAffinity(context, card),
      0
    ) * quantity;
    const roleWeight = (deriveTraits(card).has("interaction") ? 0.45 : 0) + (deriveTraits(card).has("draw") ? 0.32 : 0) + (deriveTraits(card).has("scoring") ? 0.3 : 0) + curveRepair;
    const equipmentContext = equipmentContexts.get(card.id) ?? null;
    return {
      effectProfile,
      equipmentContext,
      curveBand,
      curveRepair: round(curveRepair, 2),
      runeReliability,
      base: baseCardRating(card) * quantity,
      synergy: synergyWeight,
      antisynergy: pairAntisynergy + conditionalRisk + runeRisk + quantity * 0.01,
      equipmentPenalty: equipmentContext?.penalty ?? 0,
      compatibility: compatibilityWeight,
      structure: (roleWeight + quantity * 0.08) * quantity,
      meta: matchedMetaNames.has(card.name) ? quantity : 0
    };
  });
  const apportion = (component, key) => {
    const weights = rowWeights.map((row) => {
      const value = row[key];
      return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
    });
    const weightTotal = weights.reduce((sum, value) => sum + value, 0);
    const fallbackTotal = selectedEntries.reduce(
      (sum, entry) => sum + entry.quantity,
      0
    );
    const shares = weights.map(
      (weight, index) => round(
        component * (weightTotal > 0 ? weight / weightTotal : selectedEntries[index].quantity / Math.max(1, fallbackTotal)),
        2
      )
    );
    if (shares.length > 0) {
      const residual = round(
        component - shares.reduce((sum, share) => sum + share, 0),
        2
      );
      const anchorIndex = weightTotal > 0 ? weights.reduce(
        (best, weight, index) => weight > weights[best] ? index : best,
        0
      ) : 0;
      shares[anchorIndex] = round(shares[anchorIndex] + residual, 2);
    }
    return shares;
  };
  const baseShares = apportion(base, "base");
  const synergyShares = apportion(synergy, "synergy");
  const generalAntisynergy = Math.max(
    0,
    round(antisynergy - equipmentPenaltyTotal, 3)
  );
  const antisynergyShares = apportion(generalAntisynergy, "antisynergy");
  const compatibilityShares = apportion(compatibility, "compatibility");
  const structureShares = apportion(structure, "structure");
  const metaShares = apportion(Math.abs(meta), "meta").map(
    (value) => meta < 0 ? -value : value
  );
  const floorAdjustmentShares = apportion(floorAdjustment, "antisynergy");
  const cardBreakdown = selectedEntries.map(
    ({ card, quantity }, index) => {
      const cardPairs = pairAnalyses.filter(({ analysis }) => analysis.cardIds.includes(card.id)).map(({ analysis }) => {
        const partnerId = analysis.cardIds[0] === card.id ? analysis.cardIds[1] : analysis.cardIds[0];
        const partner = selectedEntries.find(
          (entry) => entry.card.id === partnerId
        )?.card;
        return {
          cardId: partnerId,
          name: partner?.name ?? partnerId,
          synergy: analysis.synergy,
          antisynergy: analysis.antisynergy,
          net: analysis.net,
          reasons: analysis.reasons.map((reason) => reason.label)
        };
      }).sort(
        (left, right) => Math.abs(right.net) - Math.abs(left.net) || left.cardId.localeCompare(right.cardId)
      ).slice(0, 3);
      const row = rowWeights[index];
      const rowBase = baseShares[index] ?? 0;
      const rowSynergy = synergyShares[index] ?? 0;
      const rowAnti = round(
        (antisynergyShares[index] ?? 0) + row.equipmentPenalty,
        3
      );
      const rowCompatibility = compatibilityShares[index] ?? 0;
      const rowStructure = structureShares[index] ?? 0;
      const rowMeta = metaShares[index] ?? 0;
      const rowFloorAdjustment = floorAdjustmentShares[index] ?? 0;
      return {
        cardId: card.id,
        name: card.name,
        quantity,
        grade: cardTierGrade(row.effectProfile.total),
        foundation: row.effectProfile.total,
        base: rowBase,
        synergy: rowSynergy,
        antisynergy: rowAnti,
        compatibility: rowCompatibility,
        structure: rowStructure,
        meta: rowMeta,
        floorAdjustment: rowFloorAdjustment,
        total: round(
          rowBase + rowSynergy - rowAnti + rowCompatibility + rowStructure + rowMeta + rowFloorAdjustment,
          2
        ),
        partners: cardPairs,
        traits: [...deriveTraits(card)].sort(
          (left, right) => left.localeCompare(right)
        ),
        effectProfile: row.effectProfile,
        curveBand: row.curveBand,
        curveRepair: row.curveRepair,
        runeReliability: row.runeReliability,
        equipmentActivation: row.equipmentContext?.breakdown ?? null,
        confidence: conditionalClauseCount(rulesForScoring(card)) > 0 || deriveTraits(card).has("spell-matters") || deriveTraits(card).has("trash-payoff") || row.equipmentContext !== null ? "context-sensitive" : "stable"
      };
    }
  );
  return {
    total,
    base,
    synergy,
    antisynergy,
    compatibility,
    structure,
    meta,
    confidence: "foundation",
    contributions: contributions.sort(
      (a, b) => Math.abs(b.value) - Math.abs(a.value)
    ),
    cardBreakdown,
    runes,
    legality: {
      legal: issues.length === 0,
      issues: issues.sort((left, right) => left.localeCompare(right)),
      warnings: warnings.sort((left, right) => left.localeCompare(right))
    }
  };
}
function candidateCurveRepairScore(entries, candidate, options) {
  const format = options.format ?? "standard-1v1";
  const profile = DECK_CURVE_TARGETS[format];
  const targetDeckSize = Math.max(
    1,
    Math.floor(
      finiteOr(options.targetDeckSize, format === "vendetta-prerift" ? 25 : 40)
    )
  );
  const scale = targetDeckSize / profile.targetDeckSize;
  const band = curveBandFor(candidate);
  let score = 0;
  if (band) {
    const target = profile.bands.find((entry) => entry.id === band);
    const current = entries.reduce(
      (sum, entry) => sum + (curveBandFor(entry.card) === band ? safeQuantity(entry.quantity) : 0),
      0
    );
    if (target) {
      const ideal = Math.max(1, Math.round(target.ideal * scale));
      const maximum = Math.max(1, Math.round(target.maximum * scale));
      if (current < ideal) score += (ideal - current) / ideal;
      if (current >= maximum) score -= 0.75;
    }
  }
  const earlyUnitTarget = format === "vendetta-prerift" ? 5 : 9;
  const earlyUnits = entries.reduce(
    (sum, entry) => sum + (entry.card.type === "unit" && finiteOr(entry.card.energy, 99) >= 2 && finiteOr(entry.card.energy, 99) <= 4 ? safeQuantity(entry.quantity) : 0),
    0
  );
  if (earlyUnits < earlyUnitTarget && candidate.type === "unit" && finiteOr(candidate.energy, 99) >= 2 && finiteOr(candidate.energy, 99) <= 4) {
    score += 0.9 * (1 - earlyUnits / earlyUnitTarget);
  }
  return round(clamp2(score, -1, 2), 3);
}
function candidateRoleRepairScore(entries, candidate, format) {
  const cards = weightedCards([...entries]);
  const traits = deriveTraits(candidate);
  const countRole = (roles) => cards.filter((card) => {
    const current = deriveTraits(card);
    return roles.some((role) => current.has(role));
  }).length;
  const interactionTarget = format === "vendetta-prerift" ? 3 : 6;
  const velocityTarget = format === "vendetta-prerift" ? 2 : 4;
  const scoringTarget = format === "vendetta-prerift" ? 3 : 5;
  let repair = 0;
  const interaction = countRole(["interaction", "removal", "counter", "stun"]);
  if (interaction < interactionTarget && hasAnyTrait(traits, ["interaction", "removal", "counter", "stun"])) {
    repair += 1 - interaction / interactionTarget;
  }
  const velocity = countRole(["draw", "predict", "recycle"]);
  if (velocity < velocityTarget && hasAnyTrait(traits, ["draw", "predict", "recycle"])) {
    repair += 0.7 * (1 - velocity / velocityTarget);
  }
  const scoring = countRole(["scoring", "movement", "ganking", "assault"]);
  if (scoring < scoringTarget && hasAnyTrait(traits, ["scoring", "movement", "ganking", "assault"])) {
    repair += 0.65 * (1 - scoring / scoringTarget);
  }
  return round(clamp2(repair, 0, 2), 3);
}
function candidateAnalysisCache() {
  return {
    pairs: /* @__PURE__ */ new Map(),
    mechanicalPairs: /* @__PURE__ */ new Map(),
    traits: /* @__PURE__ */ new Map(),
    tripleTraitMasks: /* @__PURE__ */ new Map(),
    curveBands: /* @__PURE__ */ new Map()
  };
}
function candidatePairKey(left, right) {
  return left.id.localeCompare(right.id) <= 0 ? `${left.id}:${right.id}` : `${right.id}:${left.id}`;
}
function cachedCandidatePair(cache, left, right) {
  const key = candidatePairKey(left, right);
  const existing = cache.pairs.get(key);
  if (existing) return existing;
  const analysis = analyzeCardPair(left, right);
  cache.pairs.set(key, analysis);
  cache.mechanicalPairs.set(
    key,
    analysis.reasons.some(
      (reason) => reason.kind === "synergy" && (reason.scope === "mechanic-package" || reason.scope === "explicit-reference")
    )
  );
  return analysis;
}
function cachedCandidateTraits(cache, card) {
  const existing = cache.traits.get(card.id);
  if (existing) return existing;
  const traits = deriveTraits(card);
  cache.traits.set(card.id, traits);
  return traits;
}
var CANDIDATE_TRIPLE_TRAIT_BITS = {
  skip: 1 << 0,
  hold: 1 << 1,
  scoring: 1 << 2,
  ready: 1 << 3,
  "energy-ramp": 1 << 4,
  "cost-reduction": 1 << 5,
  "trash-filler": 1 << 6,
  flow: 1 << 7,
  "trash-payoff": 1 << 8,
  "trash-retrieval": 1 << 9,
  token: 1 << 10,
  wide: 1 << 11
};
function cachedCandidateTripleTraitMask(cache, card) {
  const existing = cache.tripleTraitMasks.get(card.id);
  if (existing !== void 0) return existing;
  const traits = cachedCandidateTraits(cache, card);
  let mask = 0;
  for (const [trait, bit] of Object.entries(CANDIDATE_TRIPLE_TRAIT_BITS)) {
    if (traits.has(trait)) mask |= bit;
  }
  cache.tripleTraitMasks.set(card.id, mask);
  return mask;
}
function cachedCandidateCurveBand(cache, card) {
  if (cache.curveBands.has(card.id)) {
    return cache.curveBands.get(card.id) ?? null;
  }
  const band = curveBandFor(card);
  cache.curveBands.set(card.id, band);
  return band;
}
function candidateRankingContext(entries, cache) {
  const pairMatrix = Array.from(
    { length: entries.length },
    () => Array(entries.length)
  );
  const mechanicalMatrix = Array.from(
    { length: entries.length },
    () => Array(entries.length).fill(false)
  );
  for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex; rightIndex < entries.length; rightIndex += 1) {
      const left = entries[leftIndex].card;
      const right = entries[rightIndex].card;
      const analysis = cachedCandidatePair(cache, left, right);
      const mechanical = cache.mechanicalPairs.get(candidatePairKey(left, right)) ?? false;
      pairMatrix[leftIndex][rightIndex] = analysis;
      pairMatrix[rightIndex][leftIndex] = analysis;
      mechanicalMatrix[leftIndex][rightIndex] = mechanical;
      mechanicalMatrix[rightIndex][leftIndex] = mechanical;
    }
  }
  return {
    baseIndexById: new Map(
      entries.map((entry, index) => [entry.card.id, index])
    ),
    pairMatrix,
    mechanicalMatrix
  };
}
function normalizeCandidateEntries(entries) {
  return normalizeMainDeckEntries(entries);
}
function addCandidateCopy(entries, candidate) {
  let found = false;
  const afterEntries = entries.map((entry) => {
    if (entry.card.id !== candidate.id) return { ...entry };
    found = true;
    return {
      card: candidate,
      quantity: safeQuantity(entry.quantity + 1)
    };
  });
  if (!found) afterEntries.push({ card: candidate, quantity: 1 });
  return afterEntries.sort(
    (left, right) => left.card.id.localeCompare(right.card.id)
  );
}
function candidatePairAnalyses(afterEntries, candidate, cache) {
  const candidateQuantity = afterEntries.find((entry) => entry.card.id === candidate.id)?.quantity ?? 0;
  const analysesByIds = /* @__PURE__ */ new Map();
  for (const entry of afterEntries) {
    if (entry.card.id === candidate.id && candidateQuantity < 2) continue;
    const analysis = cachedCandidatePair(cache, candidate, entry.card);
    analysesByIds.set(analysis.cardIds.join(":"), analysis);
  }
  return [...analysesByIds.values()].sort(
    (left, right) => right.net - left.net || left.cardIds.join(":").localeCompare(right.cardIds.join(":"))
  );
}
function visitCandidateTriples(afterEntries, candidate, visit) {
  const candidateQuantity = afterEntries.find((entry) => entry.card.id === candidate.id)?.quantity ?? 0;
  for (let leftIndex = 0; leftIndex < afterEntries.length; leftIndex += 1) {
    for (let rightIndex = leftIndex; rightIndex < afterEntries.length; rightIndex += 1) {
      const left = afterEntries[leftIndex];
      const right = afterEntries[rightIndex];
      const requiredCandidateCopies = 1 + Number(left.card.id === candidate.id) + Number(right.card.id === candidate.id);
      if (requiredCandidateCopies > candidateQuantity) continue;
      if (leftIndex === rightIndex && left.card.id !== candidate.id && left.quantity < 2) {
        continue;
      }
      visit(leftIndex, rightIndex);
    }
  }
}
function candidateTripleAnalyses(afterEntries, candidate, cache) {
  const analyses = [];
  visitCandidateTriples(afterEntries, candidate, (leftIndex, rightIndex) => {
    const analysis = analyzeCardTripleWithResolvers(
      candidate,
      afterEntries[leftIndex].card,
      afterEntries[rightIndex].card,
      (left, right) => cachedCandidatePair(cache, left, right),
      (card) => cachedCandidateTraits(cache, card)
    );
    analyses.push(analysis);
  });
  return analyses.sort(
    (left, right) => right.net - left.net || left.cardIds.join(":").localeCompare(right.cardIds.join(":"))
  );
}
function candidateTripleNetFromFeatures(first, second, third, firstSecond, firstThird, secondThird, mechanicalEdges, traitMask, firstBand, secondBand, thirdBand) {
  let synergy = (firstSecond.synergy + firstThird.synergy + secondThird.synergy) * 0.65;
  let antisynergy = (firstSecond.antisynergy + firstThird.antisynergy + secondThird.antisynergy) * 0.65;
  if (first.id !== second.id && first.id !== third.id && second.id !== third.id && mechanicalEdges >= 2) {
    synergy += 0.72;
  }
  if ((traitMask & CANDIDATE_TRIPLE_TRAIT_BITS.skip) !== 0 && (traitMask & (CANDIDATE_TRIPLE_TRAIT_BITS.hold | CANDIDATE_TRIPLE_TRAIT_BITS.scoring | CANDIDATE_TRIPLE_TRAIT_BITS.ready)) !== 0 && (traitMask & (CANDIDATE_TRIPLE_TRAIT_BITS["energy-ramp"] | CANDIDATE_TRIPLE_TRAIT_BITS["cost-reduction"])) !== 0) {
    synergy += 1.85;
  }
  if ((traitMask & (CANDIDATE_TRIPLE_TRAIT_BITS["trash-filler"] | CANDIDATE_TRIPLE_TRAIT_BITS.flow)) === (CANDIDATE_TRIPLE_TRAIT_BITS["trash-filler"] | CANDIDATE_TRIPLE_TRAIT_BITS.flow) && (traitMask & (CANDIDATE_TRIPLE_TRAIT_BITS["trash-payoff"] | CANDIDATE_TRIPLE_TRAIT_BITS["trash-retrieval"])) !== 0) {
    synergy += 1.25;
  }
  if ((traitMask & (CANDIDATE_TRIPLE_TRAIT_BITS.token | CANDIDATE_TRIPLE_TRAIT_BITS.wide | CANDIDATE_TRIPLE_TRAIT_BITS.scoring)) === (CANDIDATE_TRIPLE_TRAIT_BITS.token | CANDIDATE_TRIPLE_TRAIT_BITS.wide | CANDIDATE_TRIPLE_TRAIT_BITS.scoring)) {
    synergy += 1.1;
  }
  const firstSlow = firstBand === "mid" || firstBand === "top";
  const secondSlow = secondBand === "mid" || secondBand === "top";
  const thirdSlow = thirdBand === "mid" || thirdBand === "top";
  if (firstSlow && secondSlow && thirdSlow) {
    antisynergy += firstBand === "top" && secondBand === "top" && thirdBand === "top" ? 0.95 : 0.45;
  }
  synergy = round(clamp2(synergy, 0, 18), 2);
  antisynergy = round(clamp2(antisynergy, 0, 8), 2);
  return round(synergy - antisynergy, 2);
}
function candidateTopTripleNets(afterEntries, candidate, cache, context) {
  const candidateIndex = afterEntries.findIndex(
    (entry) => entry.card.id === candidate.id
  );
  const candidatePairs = afterEntries.map(
    (entry) => cachedCandidatePair(cache, candidate, entry.card)
  );
  const candidateMechanicalPairs = afterEntries.map(
    (entry) => cache.mechanicalPairs.get(candidatePairKey(candidate, entry.card)) ?? false
  );
  const traitMasks = afterEntries.map(
    (entry) => cachedCandidateTripleTraitMask(cache, entry.card)
  );
  const curveBands = afterEntries.map(
    (entry) => cachedCandidateCurveBand(cache, entry.card)
  );
  const baseIndexes = afterEntries.map(
    (entry) => context.baseIndexById.get(entry.card.id) ?? -1
  );
  const candidateQuantity = afterEntries[candidateIndex]?.quantity ?? 0;
  const topNets = [];
  for (let leftIndex = 0; leftIndex < afterEntries.length; leftIndex += 1) {
    const leftEntry = afterEntries[leftIndex];
    for (let rightIndex = leftIndex; rightIndex < afterEntries.length; rightIndex += 1) {
      const rightEntry = afterEntries[rightIndex];
      const requiredCandidateCopies = 1 + Number(leftIndex === candidateIndex) + Number(rightIndex === candidateIndex);
      if (requiredCandidateCopies > candidateQuantity) continue;
      if (leftIndex === rightIndex && leftIndex !== candidateIndex && leftEntry.quantity < 2) {
        continue;
      }
      const leftIsCandidate = leftIndex === candidateIndex;
      const rightIsCandidate = rightIndex === candidateIndex;
      const leftRight = leftIsCandidate ? candidatePairs[rightIndex] : rightIsCandidate ? candidatePairs[leftIndex] : context.pairMatrix[baseIndexes[leftIndex]][baseIndexes[rightIndex]];
      const leftRightMechanical = leftIsCandidate ? candidateMechanicalPairs[rightIndex] : rightIsCandidate ? candidateMechanicalPairs[leftIndex] : context.mechanicalMatrix[baseIndexes[leftIndex]][baseIndexes[rightIndex]];
      const net = candidateTripleNetFromFeatures(
        candidate,
        leftEntry.card,
        rightEntry.card,
        candidatePairs[leftIndex],
        candidatePairs[rightIndex],
        leftRight,
        Number(candidateMechanicalPairs[leftIndex]) + Number(candidateMechanicalPairs[rightIndex]) + Number(leftRightMechanical),
        traitMasks[candidateIndex] | traitMasks[leftIndex] | traitMasks[rightIndex],
        curveBands[candidateIndex],
        curveBands[leftIndex],
        curveBands[rightIndex]
      );
      if (topNets.length < 3) {
        topNets.push(net);
        topNets.sort((leftNet, rightNet) => rightNet - leftNet);
      } else if (net > topNets[2]) {
        topNets[2] = net;
        topNets.sort((leftNet, rightNet) => rightNet - leftNet);
      }
    }
  }
  return topNets;
}
function candidateFitMetrics(normalizedEntries, afterEntries, candidate, options, pairAnalyses, tripleNets) {
  const curveRepair = candidateCurveRepairScore(
    normalizedEntries,
    candidate,
    options
  );
  const roleRepair = candidateRoleRepairScore(
    normalizedEntries,
    candidate,
    options.format ?? "standard-1v1"
  );
  const runeDeckSize = Math.floor(
    clamp2(finiteOr(options.runeDeckSize, 12), 1, 40)
  );
  const legend = validExternalLegend(options.legend);
  const runeReliability = cardRuneReliability(
    candidate,
    allocateRunes([...afterEntries], legend?.domains, runeDeckSize)
  );
  const contextCards = [
    legend,
    options.champion,
    ...options.battlefields ?? []
  ].filter((card) => Boolean(card));
  const contextFit = contextCards.reduce(
    (sum, context) => sum + contextualAffinity(context, candidate),
    0
  );
  const pairSignal = pairAnalyses.slice(0, 4).reduce((sum, analysis) => sum + analysis.net, 0);
  const tripleSignal = tripleNets.reduce((sum, net) => sum + net, 0);
  const comboScore = clamp2(pairSignal * 1.65 + tripleSignal * 0.55, -8, 25);
  const targetDeckSize = Math.max(
    1,
    Math.floor(
      finiteOr(
        options.targetDeckSize,
        options.format === "vendetta-prerift" ? 25 : 40
      )
    )
  );
  const openingHand = Math.floor(
    clamp2(
      finiteOr(options.openingHand, STANDARD_OPENING_HAND),
      0,
      targetDeckSize
    )
  );
  const earlyDraws = Math.floor(
    clamp2(finiteOr(options.earlyDraws, DEFAULT_EARLY_DRAWS), 0, targetDeckSize)
  );
  const candidateQuantity = afterEntries.find(({ card }) => card.id === candidate.id)?.quantity ?? 1;
  const equipmentContext = equipmentContextForCard(
    candidate,
    candidateQuantity,
    afterEntries,
    targetDeckSize,
    openingHand,
    earlyDraws
  );
  const equipmentFitPenalty = equipmentContext ? equipmentContext.penalty * 18 : 0;
  const improvedEquipmentContexts = normalizedEntries.map(({ card: existingCard, quantity: existingQuantity }) => {
    const beforeContext = equipmentContextForCard(
      existingCard,
      existingQuantity,
      normalizedEntries,
      targetDeckSize,
      openingHand,
      earlyDraws
    );
    const afterContext = equipmentContextForCard(
      existingCard,
      existingQuantity,
      afterEntries,
      targetDeckSize,
      openingHand,
      earlyDraws
    );
    if (!beforeContext || !afterContext) return null;
    const delta = round(
      afterContext.breakdown.scoreAdjustment - beforeContext.breakdown.scoreAdjustment,
      3
    );
    const newlyCausalProvider = afterContext.breakdown.providerCardIds.includes(candidate.id) && !beforeContext.breakdown.providerCardIds.includes(candidate.id);
    const coverageDelta = newlyCausalProvider ? round(
      Math.max(
        0,
        afterContext.breakdown.conditionalValue - beforeContext.breakdown.realizedConditionalValue
      ),
      3
    ) : 0;
    return delta > 0 || coverageDelta > 0 ? { card: existingCard, delta, coverageDelta } : null;
  }).filter(
    (improvement) => improvement !== null
  ).sort(
    (left, right) => right.delta + right.coverageDelta - (left.delta + left.coverageDelta) || left.card.id.localeCompare(right.card.id)
  );
  const equipmentProviderDelta = round(
    improvedEquipmentContexts.reduce(
      (total, improvement) => total + improvement.delta + improvement.coverageDelta,
      0
    ),
    3
  );
  const equipmentProviderCredit = clamp2(equipmentProviderDelta * 60, 0, 36);
  const fitIndex = round(
    clamp2(
      baseCardRating(candidate) * 3 + comboScore + clamp2(curveRepair, -1, 1) * 20 + clamp2(roleRepair / 2, 0, 1) * 10 + runeReliability * 10 + Math.min(5, contextFit * 0.55) - equipmentFitPenalty + equipmentProviderCredit,
      0,
      100
    ),
    1
  );
  const fitReasons = [
    curveRepair > 0.2 ? `Repairs the ${curveBandFor(candidate) ?? "identity"} curve slot` : null,
    roleRepair > 0.2 ? "Fills a missing deck role" : null,
    pairAnalyses[0]?.net && pairAnalyses[0].net > 0.4 ? `Best pair: ${pairAnalyses[0].reasons[0]?.label ?? "mechanical package"}` : null,
    runeReliability < 0.7 ? `Colored Power reliability is only ${round(runeReliability * 100)}%` : null,
    equipmentContext && equipmentContext.breakdown.activation < 0.82 ? `Equipment activation is only ${round(equipmentContext.breakdown.activation * 100)}% in this deck` : null,
    improvedEquipmentContexts.length > 0 ? `Improves Equipment activation for ${improvedEquipmentContexts.slice(0, 3).map(({ card: existingCard }) => existingCard.name).join(", ")} (+${equipmentProviderDelta} bounded context impact)` : null
  ].filter((reason) => Boolean(reason));
  return {
    curveRepair,
    roleRepair,
    runeReliability,
    fitIndex,
    fitReasons
  };
}
function candidateRankingSignals(normalizedEntries, candidate, options, cache, context) {
  const afterEntries = addCandidateCopy(normalizedEntries, candidate);
  const pairAnalyses = candidatePairAnalyses(afterEntries, candidate, cache);
  const tripleNets = candidateTopTripleNets(
    afterEntries,
    candidate,
    cache,
    context
  );
  return {
    afterEntries,
    pairAnalyses,
    ...candidateFitMetrics(
      normalizedEntries,
      afterEntries,
      candidate,
      options,
      pairAnalyses,
      tripleNets
    )
  };
}
function candidateFitSignals(normalizedEntries, candidate, options, cache = candidateAnalysisCache()) {
  const afterEntries = addCandidateCopy(normalizedEntries, candidate);
  const pairAnalyses = candidatePairAnalyses(afterEntries, candidate, cache);
  const tripleAnalyses = candidateTripleAnalyses(
    afterEntries,
    candidate,
    cache
  );
  return {
    afterEntries,
    pairAnalyses,
    tripleAnalyses,
    ...candidateFitMetrics(
      normalizedEntries,
      afterEntries,
      candidate,
      options,
      pairAnalyses,
      tripleAnalyses.slice(0, 3).map((analysis) => analysis.net)
    )
  };
}
function materializeCandidateFit(normalizedEntries, candidate, options, signals, sharedBefore, sharedAfter) {
  const deltaOptions = {
    ...options,
    combinationDepth: "pair"
  };
  const before = sharedBefore ?? scoreDeck([...normalizedEntries], deltaOptions);
  const after = sharedAfter ?? scoreDeck([...signals.afterEntries], deltaOptions);
  return {
    card: candidate,
    before,
    after,
    totalDelta: round(after.total - before.total, 2),
    fitIndex: signals.fitIndex,
    fitReasons: signals.fitReasons,
    components: {
      base: round(after.base - before.base, 2),
      synergy: round(after.synergy - before.synergy, 2),
      antisynergy: round(after.antisynergy - before.antisynergy, 2),
      compatibility: round(after.compatibility - before.compatibility, 2),
      structure: round(after.structure - before.structure, 2),
      meta: round(after.meta - before.meta, 2),
      curve: signals.curveRepair,
      runes: round(signals.runeReliability, 3),
      roles: signals.roleRepair
    },
    pairAnalyses: signals.pairAnalyses,
    tripleAnalyses: signals.tripleAnalyses
  };
}
function evaluateCandidateFit(entries, candidate, options = {}) {
  if (!isMainDeckScoreCard(candidate)) {
    throw new RangeError(
      `${candidate.name} is not a Unit, Spell, or Gear Main Deck candidate.`
    );
  }
  const normalizedEntries = normalizeCandidateEntries(entries);
  const signals = candidateFitSignals(normalizedEntries, candidate, options);
  return materializeCandidateFit(
    normalizedEntries,
    candidate,
    options,
    signals
  );
}
function rankCandidateFits(entries, candidates, options = {}) {
  const {
    collection = {},
    ownership = "all",
    excludeBanned = true,
    limit = 24,
    ...scoreOptions
  } = options;
  const normalizedEntries = normalizeCandidateEntries(entries);
  const selectedQuantities = new Map(
    normalizedEntries.map((entry) => [entry.card.id, entry.quantity])
  );
  const legendDomains = new Set(
    validExternalLegend(scoreOptions.legend)?.domains ?? []
  );
  const eligible = candidates.filter((candidate) => {
    const selected = selectedQuantities.get(candidate.id) ?? 0;
    const owned = Math.max(0, Math.floor(collection[candidate.id] ?? 0));
    if (selected >= Math.max(1, candidate.copyLimit)) return false;
    if (ownership === "owned" && owned <= selected) return false;
    if (ownership === "not-owned" && owned > selected) return false;
    if (excludeBanned && isConstructedBanned(candidate)) return false;
    if (legendDomains.size > 0 && !candidate.domains.includes("colorless") && !candidate.domains.every((domain) => legendDomains.has(domain))) {
      return false;
    }
    return isMainDeckScoreCard(candidate);
  });
  const requestedLimit = Math.max(1, Math.floor(limit));
  const analysisCache = candidateAnalysisCache();
  const rankingContext = candidateRankingContext(
    normalizedEntries,
    analysisCache
  );
  const exactCandidates = eligible.map((candidate) => ({
    candidate,
    signals: candidateRankingSignals(
      normalizedEntries,
      candidate,
      scoreOptions,
      analysisCache,
      rankingContext
    )
  })).sort(
    (left, right) => right.signals.fitIndex - left.signals.fitIndex || left.candidate.name.localeCompare(right.candidate.name) || left.candidate.id.localeCompare(right.candidate.id)
  );
  if (exactCandidates.length === 0) return [];
  const cutoffIndex = Math.min(requestedLimit, exactCandidates.length) - 1;
  const cutoffFitIndex = exactCandidates[cutoffIndex].signals.fitIndex;
  const contenders = exactCandidates.filter(
    ({ signals }) => signals.fitIndex >= cutoffFitIndex
  );
  const deltaOptions = {
    ...scoreOptions,
    combinationDepth: "pair"
  };
  const before = scoreDeck([...normalizedEntries], deltaOptions);
  const winners = contenders.map(({ candidate, signals }) => {
    const after = scoreDeck([...signals.afterEntries], deltaOptions);
    return {
      candidate,
      signals,
      after,
      totalDelta: round(after.total - before.total, 2)
    };
  }).sort(
    (left, right) => right.signals.fitIndex - left.signals.fitIndex || right.totalDelta - left.totalDelta || left.candidate.name.localeCompare(right.candidate.name) || left.candidate.id.localeCompare(right.candidate.id)
  ).slice(0, requestedLimit);
  return winners.map(({ candidate, after }) => {
    const signals = candidateFitSignals(
      normalizedEntries,
      candidate,
      scoreOptions,
      analysisCache
    );
    return materializeCandidateFit(
      normalizedEntries,
      candidate,
      scoreOptions,
      signals,
      before,
      after
    );
  });
}
export {
  CARD_TIER_GRADES,
  CARD_TIER_THRESHOLDS,
  CURRENT_CONSTRUCTED_BANS,
  CURRENT_CONSTRUCTED_BAN_ENTRIES,
  DECK_CURVE_TARGETS,
  ORPHAN_ENGINE_RULES,
  PACKAGE_PAIRS,
  RULES_SNAPSHOT_DATE,
  SCORE_MODEL_VERSION,
  TRAIT_LABELS,
  VENDETTA_LEGAL_DATE,
  analyzeCardPair,
  analyzeCardTriple,
  baseCardRating,
  baseCardRatingBreakdown,
  cardRuneReliability,
  cardTierGrade,
  championMatchesLegend,
  constructedBanFor,
  curveBandFor,
  deriveTraits,
  earlyPackageReliability,
  evaluateCandidateFit,
  foundationGradeForCard,
  hypergeometricAtLeast,
  isConstructedBanned,
  isMainDeckScoreCard,
  isScoredCard,
  isSignatureCard,
  previewSetLabel,
  previewSetLegalFrom,
  rankCandidateFits,
  rateCardWithEvidence,
  requiredAllTagNames,
  scoreDeck,
  signatureMatchesLegend,
  synergyAffinity
};
