import { Type, } from "../../deps/deno.land/x/typebox@0.25.13/src/typebox.js";
import { C } from "../core/mod.js";
import { fromHex, toHex } from "../utils/utils.js";
export class Constr {
    constructor(index, fields) {
        Object.defineProperty(this, "index", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fields", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        this.index = index;
        this.fields = fields;
    }
}
export const Data = {
    // Types
    // Note: Recursive types are not supported (yet)
    BigInt: Type.Unsafe({ type: "bigint" }),
    String: Type.String(),
    Boolean: Type.Boolean(),
    Any: Type.Any(),
    Array: function (schema) {
        return Type.Array(schema);
    },
    Map: function (keySchema, valueSchema) {
        return Type.Unsafe({
            key: keySchema,
            value: valueSchema,
            type: "map",
        });
    },
    Object: function (properties) {
        return Type.Object(properties);
    },
    Enum: function (items) {
        return Type.Union(items);
    },
    Tuple: function (items) {
        return Type.Tuple(items);
    },
    Literal: function (literal) {
        return Type.Literal(literal);
    },
    Nullable: function (schema) {
        return Type.Unsafe({ ...schema, nullable: true });
    },
    /**
     * Convert PlutusData to Cbor encoded data.\
     * Or apply a shape and convert the provided data struct to Cbor encoded data.
     */
    to,
    /** Convert Cbor encoded data to PlutusData */
    from,
    /**
     *  Convert Cbor encoded data to Data.\
     *  Or apply a shape and cast the cbor encoded data to a certain type.
     */
    fromJson,
    /**
     * Convert PlutusData to a Json object.
     * Note: Constructor cannot be used here, also only bytes/integers as Json keys.
     */
    toJson,
    void: function () {
        return "d87980";
    },
    castFrom,
    castTo,
};
/**
 * Convert PlutusData to Cbor encoded data.\
 * Or apply a shape and convert the provided data struct to Cbor encoded data.
 */
function to(data, shape) {
    function serialize(data) {
        try {
            if (typeof data === "bigint") {
                return C.PlutusData.new_integer(C.BigInt.from_str(data.toString()));
            }
            else if (typeof data === "string") {
                return C.PlutusData.new_bytes(fromHex(data));
            }
            else if (data instanceof Constr) {
                const { index, fields } = data;
                const plutusList = C.PlutusList.new();
                fields.forEach((field) => plutusList.add(serialize(field)));
                return C.PlutusData.new_constr_plutus_data(C.ConstrPlutusData.new(C.BigNum.from_str(index.toString()), plutusList));
            }
            else if (data instanceof Array) {
                const plutusList = C.PlutusList.new();
                data.forEach((arg) => plutusList.add(serialize(arg)));
                return C.PlutusData.new_list(plutusList);
            }
            else if (data instanceof Map) {
                const plutusMap = C.PlutusMap.new();
                for (const [key, value] of data.entries()) {
                    plutusMap.insert(serialize(key), serialize(value));
                }
                return C.PlutusData.new_map(plutusMap);
            }
            throw new Error("Unsupported type");
        }
        catch (error) {
            throw new Error("Could not serialize the data: " + error);
        }
    }
    const d = shape ? castTo(data, shape) : data;
    return toHex(serialize(d).to_bytes());
}
/**
 *  Convert Cbor encoded data to Data.\
 *  Or apply a shape and cast the cbor encoded data to a certain type.
 */
function from(raw, shape) {
    function deserialize(data) {
        if (data.kind() === 0) {
            const constr = data.as_constr_plutus_data();
            const l = constr.data();
            const desL = [];
            for (let i = 0; i < l.len(); i++) {
                desL.push(deserialize(l.get(i)));
            }
            return new Constr(parseInt(constr.alternative().to_str()), desL);
        }
        else if (data.kind() === 1) {
            const m = data.as_map();
            const desM = new Map();
            const keys = m.keys();
            for (let i = 0; i < keys.len(); i++) {
                desM.set(deserialize(keys.get(i)), deserialize(m.get(keys.get(i))));
            }
            return desM;
        }
        else if (data.kind() === 2) {
            const l = data.as_list();
            const desL = [];
            for (let i = 0; i < l.len(); i++) {
                desL.push(deserialize(l.get(i)));
            }
            return desL;
        }
        else if (data.kind() === 3) {
            return BigInt(data.as_integer().to_str());
        }
        else if (data.kind() === 4) {
            return toHex(data.as_bytes());
        }
        throw new Error("Unsupported type");
    }
    const data = deserialize(C.PlutusData.from_bytes(fromHex(raw)));
    return shape ? castFrom(data, shape) : data;
}
/**
 * Convert conveniently a Json object (e.g. Metadata) to PlutusData.
 * Note: Constructor cannot be used here.
 */
function fromJson(json) {
    function toData(json) {
        if (typeof json === "string") {
            return json.startsWith("0x")
                ? json.slice(2)
                : toHex(new TextEncoder().encode(json));
        }
        if (typeof json === "number")
            return BigInt(json);
        if (typeof json === "bigint")
            return json;
        if (json instanceof Array)
            return json.map((v) => toData(v));
        if (json instanceof Object) {
            const tempMap = new Map();
            Object.entries(json).forEach(([key, value]) => {
                tempMap.set(toData(key), toData(value));
            });
            return tempMap;
        }
        throw new Error("Unsupported type");
    }
    return toData(json);
}
/**
 * Convert PlutusData to a Json object.
 * Note: Constructor cannot be used here, also only bytes/integers as Json keys.
 */
function toJson(plutusData) {
    function fromData(data) {
        if (typeof data === "bigint" ||
            typeof data === "number" ||
            (typeof data === "string" &&
                !isNaN(parseInt(data)) &&
                data.slice(-1) === "n")) {
            const bigint = typeof data === "string"
                ? BigInt(data.slice(0, -1))
                : data;
            return parseInt(bigint.toString());
        }
        if (typeof data === "string") {
            return new TextDecoder().decode(fromHex(data));
        }
        if (data instanceof Array)
            return data.map((v) => fromData(v));
        if (data instanceof Map) {
            const tempJson = {};
            data.forEach((value, key) => {
                const convertedKey = fromData(key);
                if (typeof convertedKey !== "string" &&
                    typeof convertedKey !== "number") {
                    throw new Error("Unsupported type (Note: Only bytes or integers can be keys of a JSON object)");
                }
                tempJson[convertedKey] = fromData(value);
            });
            return tempJson;
        }
        throw new Error("Unsupported type (Note: Constructor cannot be converted to JSON)");
    }
    return fromData(plutusData);
}
function castFrom(data, shape) {
    if (!shape)
        throw new Error("Could not type cast data.");
    const shapeType = (shape.anyOf ? "enum" : "") || shape.type;
    if (shape.nullable) {
        if (!(data instanceof Constr)) {
            throw new Error("Could not type cast to nullable.");
        }
        if (data.index === 0) {
            const noNullableShape = { ...shape };
            noNullableShape.nullable = false;
            return castFrom(data.fields[0], noNullableShape);
        }
        else if (data.index === 1 && data.fields.length === 0)
            return null;
        throw new Error("Could not type cast to nullable.");
    }
    switch (shapeType) {
        case "bigint": {
            if (typeof data !== "bigint") {
                throw new Error("Could not type cast to bigint.");
            }
            return data;
        }
        case "string": {
            if (typeof data !== "string") {
                throw new Error("Could not type cast to string/bytes.");
            }
            return data;
        }
        case "boolean": {
            if (!(data instanceof Constr)) {
                throw new Error("Could not type cast to boolean.");
            }
            if (data.index === 0 && data.fields.length === 0)
                return false;
            else if (data.index === 1 && data.fields.length === 0)
                return true;
            throw new Error("Could not type cast to boolean.");
        }
        case "enum": {
            if (!(data instanceof Constr)) {
                throw new Error("Could not type cast to enum.");
            }
            const enumSchema = shape.anyOf[data.index];
            if (!enumSchema)
                throw new Error("Could not type cast to enum.");
            switch (enumSchema.type) {
                case "string": {
                    if (typeof enumSchema.const === "string" &&
                        /[A-Z]/.test(enumSchema.const[0]) && data.fields.length === 0) {
                        return enumSchema.const;
                    }
                    throw new Error("Could not type cast to enum.");
                }
                case "object": {
                    const objectSchema = enumSchema.properties;
                    const key = Object.keys(objectSchema)[0];
                    if (!(/[A-Z]/.test(key[0]))) {
                        throw new Error("Could not type cast to enum. Enums need to start with an uppercase letter.");
                    }
                    return {
                        [key]: castFrom(new Constr(0, data.fields), objectSchema[key]),
                    };
                }
            }
            throw new Error("Could not type cast to enum.");
        }
        case "object": {
            if (!(data instanceof Constr) || data.index !== 0) {
                throw new Error("Could not type cast to object.");
            }
            const fields = {};
            Object.entries(shape.properties).forEach(([name, schema], index) => {
                if ((/[A-Z]/.test(name[0]))) {
                    throw new Error("Could not type cast to object. Object properties need to start with a lowercase letter.");
                }
                fields[name] = castFrom(data.fields[index], schema);
            });
            return fields;
        }
        case "array": {
            if (shape.items instanceof Array) { // tuple
                if (!(data instanceof Constr) || data.index !== 0) {
                    throw new Error("Could not type cast to tuple.");
                }
                return data.fields.map((field, index) => castFrom(field, shape.items[index]));
            }
            else { // array
                if (!(data instanceof Array)) {
                    throw new Error("Could not type cast to array.");
                }
                return data.map((field) => castFrom(field, shape.items));
            }
        }
        case "map": {
            if (!(data instanceof Map)) {
                throw new Error("Could not type cast to map.");
            }
            const map = new Map();
            for (const [key, value] of (data)
                .entries()) {
                map.set(castFrom(key, shape.key), castFrom(value, shape.value));
            }
            return map;
        }
        case undefined:
            return data;
    }
    throw new Error("Could not type cast data.");
}
function castTo(struct, shape) {
    if (!shape)
        throw new Error("Could not type cast struct.");
    const shapeType = (shape.anyOf ? "enum" : "") || shape.type;
    if (shape.nullable) {
        if (struct !== null) {
            const noNullableShape = { ...shape };
            noNullableShape.nullable = false;
            return new Constr(0, [castTo(struct, noNullableShape)]);
        }
        return new Constr(1, []);
    }
    switch (shapeType) {
        case "bigint": {
            if (typeof struct !== "bigint") {
                throw new Error("Could not type cast to bigint.");
            }
            return struct;
        }
        case "string": {
            if (typeof struct !== "string") {
                throw new Error("Could not type cast to string/bytes.");
            }
            return struct;
        }
        case "boolean": {
            if (typeof struct !== "boolean") {
                throw new Error("Could not type cast to boolean.");
            }
            return new Constr(struct ? 1 : 0, []);
        }
        case "enum": {
            switch (typeof struct) {
                case "string": {
                    if (!(/[A-Z]/.test(struct[0]))) {
                        throw new Error("Could not type cast to enum. Enum needs to start with a uppercase letter.");
                    }
                    const enumIndex = shape.anyOf.findIndex((schema) => schema.type === "string" && schema.const === struct);
                    if (enumIndex < 0)
                        throw "Could not type cast to enum.";
                    return new Constr(enumIndex, []);
                }
                case "object": {
                    if (struct === null)
                        throw "Could not type cast to enum.";
                    const enumKey = Object.keys(struct)[0];
                    if (!(/[A-Z]/.test(enumKey[0]))) {
                        throw new Error("Could not type cast to enum. Enum needs to start with a uppercase letter.");
                    }
                    const enumIndex = shape.anyOf.findIndex((schema) => schema.type === "object" &&
                        Object.keys(schema.properties)[0] === enumKey);
                    const enumSchema = shape.anyOf[enumIndex].properties[enumKey];
                    return new Constr(enumIndex, struct[enumKey].map((item, index) => castTo(item, enumSchema.items[index])));
                }
            }
            throw new Error("Could not type cast to enum.");
        }
        case "object": {
            if (typeof struct !== "object" || struct === null) {
                throw new Error("Could not type cast to object.");
            }
            return new Constr(0, Object.keys(shape.properties).map((name) => castTo(struct[name], shape.properties[name])));
        }
        case "array": {
            if (!(struct instanceof Array)) {
                throw new Error("Could not type cast to array.");
            }
            if (shape.items instanceof Array) { // tuple
                return new Constr(0, struct.map((item, index) => castTo(item, shape.items[index])));
            }
            else { // array
                return struct.map((item) => castTo(item, shape.items));
            }
        }
        case "map": {
            if (!(struct instanceof Map)) {
                throw new Error("Could not type cast to map.");
            }
            const map = new Map();
            for (const [key, value] of (struct)
                .entries()) {
                map.set(castTo(key, shape.key), castTo(value, shape.value));
            }
            return map;
        }
        case undefined: {
            return struct;
        }
    }
    throw new Error("Could not type cast struct.");
}
