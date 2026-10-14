import { useState } from "react";
import { AlertCircle, CheckCircle } from "lucide-react";

import { AdminAttribute } from "../../api/adminCatalog";

import { AttributeForm } from "./components/AttributeForm";
import { AttributeNameEditor } from "./components/AttributeNameEditor";
import { AttributesTable } from "./components/AttributesTable";
import { useAdminAttributes } from "./hooks/useAdminAttributes";

/** Simple catalog page for defining reusable variant attributes and their values. */
export function AdminAttributesPage() {
  const {
    attributes,
    addAttributeValue,
    busy,
    createAttribute,
    deleteAttribute,
    deleteAttributeValue,
    error,
    loading,
    restoreAttribute,
    restoreAttributeValue,
    success,
    updateAttributeName,
  } = useAdminAttributes();
  const [editingAttribute, setEditingAttribute] = useState<AdminAttribute | null>(null);

  return (
    <div className="dashboard-container admin-catalog admin-taxonomy-page admin-page">
      <header className="admin-page-header">
        <div>
          <p className="eyebrow">Variant configuration</p>
          <h1>Product attributes</h1>
          <p>Create reusable attributes and values for product variants.</p>
        </div>
      </header>

      {error && <div className="alert alert-error"><AlertCircle size={18} />{error}</div>}
      {success && <div className="alert alert-success"><CheckCircle size={18} />{success}</div>}

      <section className="admin-products-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Product attributes</h2>
            <p>Add a name and its allowed values. These values become available when building product variants.</p>
          </div>
        </div>

        {editingAttribute ? (
          <AttributeNameEditor
            key={editingAttribute.id}
            attribute={editingAttribute}
            busy={busy}
            onCancel={() => setEditingAttribute(null)}
            onSave={updateAttributeName}
          />
        ) : (
          <AttributeForm busy={busy} onSubmit={createAttribute} />
        )}
        <AttributesTable
          attributes={attributes}
          busy={busy}
          loading={loading}
          onAddValue={addAttributeValue}
          onDelete={(attribute) => void deleteAttribute(attribute)}
          onDeleteValue={(attribute, value) => void deleteAttributeValue(attribute, value)}
          onEdit={setEditingAttribute}
          onRestore={(attribute) => void restoreAttribute(attribute)}
          onRestoreValue={(attribute, value) => void restoreAttributeValue(attribute, value)}
        />
      </section>
    </div>
  );
}
