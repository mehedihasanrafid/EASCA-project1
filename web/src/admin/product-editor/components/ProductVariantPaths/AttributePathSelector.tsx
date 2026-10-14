import type { VariantOptionsController } from "../../hooks/useProductCatalogOptions";
import { AddCatalogValue } from "./AddCatalogValue";
import { AttributeValueList } from "./AttributeValueList";
import styles from "./ProductVariantPaths.module.css";

interface Props {
  builder: VariantOptionsController;
}

/** Renders Product Type attributes in their configured parent-to-child order. */
export function AttributePathSelector({ builder }: Props) {
  return (
    <div className={styles.selectorGrid}>
      {builder.assignments.map((assignment, assignmentIndex) => {
        const parent = builder.assignments.find((item) =>
          item.attributeId === assignment.parentAttributeId,
        );
        const canChoose = !parent || Object.hasOwn(builder.pathSelection, parent.attributeId);
        const selectedValueId = builder.pathSelection[assignment.attributeId];

        return (
          <fieldset key={assignment.attributeId} className={canChoose ? "" : styles.locked}>
            <legend>
              <span>{assignmentIndex + 1}</span>
              <strong>{assignment.attribute.name}{assignment.isRequired ? " *" : ""}</strong>
              <small>{canChoose
                ? selectedValueId ? "Chosen" : parent ? `Child of ${parent.attribute.name}` : "Primary"
                : `Choose ${parent?.attribute.name ?? "parent"} first`}</small>
            </legend>

            <AttributeValueList
              assignment={assignment}
              canChoose={canChoose}
              selectedValueId={selectedValueId}
              onChoose={(valueId) => builder.choosePathValue(assignment.attributeId, valueId)}
            />
            <AddCatalogValue assignment={assignment} builder={builder} disabled={!canChoose} />
          </fieldset>
        );
      })}
    </div>
  );
}
