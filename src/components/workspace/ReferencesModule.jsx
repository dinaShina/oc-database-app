import { INITIAL_REFERENCE_ITEM, REFERENCE_TYPES } from "../../data/referenceSchema.js";
import { createReferenceItem, deleteReferenceItem, saveReferenceItems, updateReferenceItem } from "../../storage/referenceRepository.js";
import WorkspaceItemsModule from "./WorkspaceItemsModule.jsx";

export default function ReferencesModule({ items, oc, onItemsChange }) {
  return <WorkspaceItemsModule createItem={createReferenceItem} deleteItem={deleteReferenceItem} emptyItem={INITIAL_REFERENCE_ITEM} itemTypes={REFERENCE_TYPES} items={items} oc={oc} onItemsChange={onItemsChange} saveItems={saveReferenceItems} title="References" updateItem={updateReferenceItem} typeKey="type" />;
}
