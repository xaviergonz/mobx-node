// mobx-bonsai core
export { MobxBonsaiError } from "./error/MobxBonsaiError"

// node/nodeTypeKey
export type { BaseNodeType } from "./node/nodeTypeKey/BaseNodeType"
export type { BaseTypedNodeType } from "./node/nodeTypeKey/BaseTypedNodeType"
export type { KeyedNodeType } from "./node/nodeTypeKey/KeyedNodeType"
export type { NodeForNodeType } from "./node/nodeTypeKey/NodeForNodeType"
export {
  findNodeTypeById,
  getNodeTypeAndKey,
  getNodeTypeId,
  nodeType,
  nodeTypeKey,
} from "./node/nodeTypeKey/nodeTypeKey"
export type {
  AnyNodeType,
  AnyTypedNodeType,
  AnyUntypedNodeType,
  NodeTypeKey,
  NodeKeyValue,
  NodeTypeValue,
  NodeWithAnyType,
  TNode,
} from "./node/nodeTypeKey/nodeTypeKey"
export type { TypedNodeType } from "./node/nodeTypeKey/TypedNodeType"
export type { UntypedNodeType } from "./node/nodeTypeKey/UntypedNodeType"

// node/tree
export { findChildren } from "./node/tree/findChildren"
export { findParent } from "./node/tree/findParent"
export { findParentPath } from "./node/tree/findParentPath"
export type { FoundParentPath } from "./node/tree/FoundParentPath"
export { getChildrenNodes } from "./node/tree/getChildrenNodes"
export { getParent } from "./node/tree/getParent"
export { getParentPath } from "./node/tree/getParentPath"
export { getRoot } from "./node/tree/getRoot"
export { getRootPath } from "./node/tree/getRootPath"
export { isChildOfParent } from "./node/tree/isChildOfParent"
export { isParentOfChild } from "./node/tree/isParentOfChild"
export { isRoot } from "./node/tree/isRoot"
export { onChildAttachedTo } from "./node/tree/onChildAttachedTo"
export type { ParentPath } from "./node/tree/ParentPath"
export type { Path, PathElement, WritablePath } from "./node/tree/pathTypes"
export { resolvePath } from "./node/tree/resolvePath"
export type { RootPath } from "./node/tree/RootPath"
export { walkTree, WalkTreeMode } from "./node/tree/walkTree"

// node/snapshot
export { applySnapshot } from "./node/snapshot/applySnapshot"
export { getSnapshot } from "./node/snapshot/getSnapshot"
export { onSnapshot } from "./node/snapshot/onSnapshot"
export type { OnSnapshotListener } from "./node/snapshot/onSnapshot"

// node
export { clone } from "./node/clone"
export { computedProp } from "./node/computedProp"
export {
  assertIsNode,
  isNode,
  node,
  onDeepChange,
} from "./node/node"
export type {
  NodeChange,
  NodeChangeListener,
} from "./node/node"
export type { NodeKeyGenerator } from "./node/utils/nodeKeyGenerator"
export { volatileProp } from "./node/volatileProp"
export type { VolatileProp } from "./node/volatileProp"

// plainTypes
export type { Primitive } from "./plainTypes/types"

// utils
export { asMap } from "./utils/asMap"
export { asSet } from "./utils/asSet"
export { deepEquals } from "./utils/deepEquals"

// yjsBinding
export {
  applyPlainArrayToYArray,
  applyPlainObjectToYMap,
  convertPlainToYjsValue,
} from "./yjsBinding/nodeToYjs/convertPlainToYjsValue"

export type { YjsStructure, YjsValue } from "./yjsBinding/yjsTypes/types"

export { bindYjsToNode } from "./yjsBinding/bindYjsToNode"

// polyfills
;(Symbol as any).dispose ??= Symbol("Symbol.dispose")
