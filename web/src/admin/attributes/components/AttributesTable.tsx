import { Pencil, RotateCcw, Shapes, Trash2 } from "lucide-react";

import { AdminAttribute, AdminAttributeValue } from "../../../api/adminCatalog";
import styles from "../AdminAttributes.module.css";
import { AttributeValuesCell } from "./AttributeValuesCell";

interface AttributesTableProps {
  attributes: AdminAttribute[];
  busy: boolean;
  loading: boolean;
  onAddValue: (attribute: AdminAttribute, label: string) => Promise<boolean>;
  onDelete: (attribute: AdminAttribute) => void;
  onDeleteValue: (attribute: AdminAttribute, value: AdminAttributeValue) => void;
  onEdit: (attribute: AdminAttribute) => void;
  onRestore: (attribute: AdminAttribute) => void;
  onRestoreValue: (attribute: AdminAttribute, value: AdminAttributeValue) => void;
}

export function AttributesTable({
  attributes,
  busy,
  loading,
  onAddValue,
  onDelete,
  onDeleteValue,
  onEdit,
  onRestore,
  onRestoreValue,
}: AttributesTableProps) {
  if (loading) return <div className="admin-empty-state">Loading product attributes...</div>;

  if (attributes.length === 0) {
    return (
      <div className="admin-empty-state">
        <Shapes size={34} />
        <h3>No product attributes yet</h3>
        <p>Add an attribute such as Color, Size, Material, or Storage.</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className={`admin-product-table admin-reference-table ${styles.table}`}>
        <thead>
          <tr>
            <th>Attribute name</th>
            <th>Values</th>
            <th>Status</th>
            <th><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {attributes.map((attribute) => (
              <tr key={attribute.id} className={attribute.deletedAt ? "is-deleted" : ""}>
                <td><strong>{attribute.name}</strong></td>
                <td className={styles.values}>
                  <AttributeValuesCell
                    attribute={attribute}
                    busy={busy}
                    onAdd={onAddValue}
                    onDelete={onDeleteValue}
                    onRestore={onRestoreValue}
                  />
                </td>
                <td>
                  <span className={`status-pill ${attribute.deletedAt ? "status-inactive" : "status-active"}`}>
                    {attribute.deletedAt ? "Deleted" : "Active"}
                  </span>
                </td>
                <td>
                  <div className="admin-row-actions">
                    {attribute.deletedAt ? (
                      <button
                        type="button"
                        className="admin-view-link"
                        aria-label={`Restore ${attribute.name}`}
                        title="Restore"
                        disabled={busy}
                        onClick={() => onRestore(attribute)}
                      >
                        <RotateCcw size={17} />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="admin-view-link"
                          aria-label={`Edit ${attribute.name}`}
                          title="Edit"
                          disabled={busy}
                          onClick={() => onEdit(attribute)}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          type="button"
                          className="admin-view-link reference-delete-button"
                          aria-label={`Delete ${attribute.name}`}
                          title="Delete"
                          disabled={busy}
                          onClick={() => onDelete(attribute)}
                        >
                          <Trash2 size={17} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
