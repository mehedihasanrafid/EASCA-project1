import { GitBranch, Layers3, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { SKIP_OPTION_VALUE, type VariantPathNode } from "../../utils/variantPaths";
import styles from "./VariantOptionsSection.module.css";

interface Props {
  builder: VariantOptionsController;
}

/**
 * Builds explicit parent-child paths for this product only.
 * Example: Black -> XL -> Cotton can exist without forcing Green -> XL -> Cotton.
 */
export const VariantOptionsSection = ({ builder }: Props) => {
  const renderPathTree = (nodes: VariantPathNode[], depth = 0): React.ReactNode => (
    <ul className={`variant-path-tree-level depth-${depth}`}>
      {nodes.map((node) => {
        const leafVariantKey = node.terminalVariantKeys[0] ?? null;
        return (
          <li key={`${node.attributeId}-${node.valueId}`}>
            <div className="variant-path-tree-node">
              <button
                type="button"
                className={`variant-path-node-select${leafVariantKey === builder.focusedVariantKey ? " is-selected" : ""}`}
                onClick={() => leafVariantKey && builder.setFocusedVariantKey(leafVariantKey)}
                disabled={!leafVariantKey}
              >
                <small>{node.attributeName}</small>
                <span>{node.colorHex && <i style={{ backgroundColor: node.colorHex }} />}{node.label}</span>
                {leafVariantKey && <em>SKU</em>}
              </button>
              <button
                type="button"
                className="variant-path-branch-remove"
                onClick={() => builder.removePathBranch(node)}
                aria-label={`Remove ${node.label} branch affecting ${node.variantKeys.length} SKU paths`}
                title={`Remove ${node.variantKeys.length} affected SKU path${node.variantKeys.length === 1 ? "" : "s"}`}
              >
                <Trash2 size={13} /> <span>{node.variantKeys.length}</span>
              </button>
            </div>
            {node.children.length > 0 && renderPathTree(node.children, depth + 1)}
          </li>
        );
      })}
    </ul>
  );

  return (
    <section className={`${styles.root} variant-options-panel`} aria-label="Variant options">
      <div className="variant-workbench-heading">
        <div>
          <h3>Product-specific variant paths</h3>
          <p>Build one valid parent-to-child path at a time. No unwanted combinations are generated.</p>
        </div>
        <Link className="admin-view-link" to="/admin/attributes"><Plus size={15} /> Add attribute</Link>
      </div>

      {builder.loading ? <p>Loading product attributes...</p> : builder.assignments.length === 0 ? (
        <div className="admin-variant-empty">
          <Layers3 size={24} />
          <div>
            <strong>This product type has no attributes yet.</strong>
            <p>Keep one simple stock variant or <Link to="/admin/attributes">add reusable attributes</Link>.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="variant-path-guide">
            <GitBranch size={18} />
            <span>Changing a parent clears its child choices. After adding a SKU, the parent prefix stays ready so you can add a sibling.</span>
          </div>

          <div className="admin-option-selector variant-options-grid variant-path-selector">
            {builder.assignments.map((assignment, assignmentIndex) => {
              const canChoose = builder.assignments.slice(0, assignmentIndex).every((parent) =>
                Object.hasOwn(builder.pathSelection, parent.attributeId),
              );
              const selectedValueId = builder.pathSelection[assignment.attributeId];
              return (
                <fieldset key={assignment.attributeId} className={canChoose ? "" : "is-locked"}>
                  <legend>
                    <span>{assignmentIndex + 1}</span>
                    {assignment.attribute.name}{assignment.isRequired ? " *" : ""}
                    <small>{canChoose ? selectedValueId ? "Chosen" : "Choose one" : "Choose parent first"}</small>
                  </legend>
                  <div className="variant-value-chips">
                    {assignment.attribute.values
                      .filter((value) => value.isActive && !value.deletedAt)
                      .map((value) => (
                        <label key={value.id}>
                          <input
                            type="radio"
                            name={`variant-path-${assignment.attributeId}`}
                            checked={selectedValueId === value.id}
                            disabled={!canChoose}
                            onChange={() => builder.choosePathValue(assignment.attributeId, value.id)}
                          />
                          {value.colorHex && <i style={{ backgroundColor: value.colorHex }} />}
                          {value.label}
                        </label>
                      ))}
                    {!assignment.isRequired && (
                      <label className="variant-path-skip">
                        <input
                          type="radio"
                          name={`variant-path-${assignment.attributeId}`}
                          checked={selectedValueId === SKIP_OPTION_VALUE}
                          disabled={!canChoose}
                          onChange={() => builder.choosePathValue(assignment.attributeId, SKIP_OPTION_VALUE)}
                        />
                        Not used for this SKU
                      </label>
                    )}
                  </div>
                  <div className="variant-inline-add">
                    <input
                      className="form-input"
                      value={builder.newValueLabels[assignment.attributeId] ?? ""}
                      placeholder={`Add new ${assignment.attribute.name.toLowerCase()}`}
                      onChange={(event) => builder.setNewValueLabels((current) => ({
                        ...current,
                        [assignment.attributeId]: event.target.value,
                      }))}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void builder.addSuggestedValue(assignment);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={builder.addingValueFor === assignment.attributeId}
                      onClick={() => void builder.addSuggestedValue(assignment)}
                    >
                      <Plus size={15} /> {builder.addingValueFor === assignment.attributeId ? "Adding..." : "Add"}
                    </button>
                  </div>
                </fieldset>
              );
            })}
          </div>

          <div className="variant-path-create-bar">
            <div>
              <small>Exact SKU path</small>
              <strong>{builder.currentPathLabels.length ? builder.currentPathLabels.join(" → ") : "Choose the first attribute"}</strong>
            </div>
            <button type="button" className="btn btn-primary" onClick={builder.addExactVariantPath} disabled={!builder.pathIsComplete}>
              <Plus size={17} /> Add exact SKU
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => builder.setPathSelection({})} disabled={builder.currentPathLabels.length === 0}>
              Clear path
            </button>
          </div>

          {builder.variantPathTree.length > 0 && (
            <div className="variant-path-tree">
              <div>
                <GitBranch size={17} />
                <strong>Current product tree</strong>
                <small>{builder.exactPathCount} exact SKU path{builder.exactPathCount === 1 ? "" : "s"}</small>
              </div>
              {renderPathTree(builder.variantPathTree)}
            </div>
          )}
        </>
      )}
    </section>
  );
};

