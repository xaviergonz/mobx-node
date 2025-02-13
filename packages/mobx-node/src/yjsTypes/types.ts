import * as Y from "yjs"
import { PlainPrimitive } from "../plainTypes/types"

export type YjsStructure = Y.Map<YjsValue> | Y.Array<YjsValue>

export type YjsValue = PlainPrimitive | YjsStructure
