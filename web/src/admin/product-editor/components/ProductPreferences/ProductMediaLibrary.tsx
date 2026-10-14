import { ImagePlus, Star, Trash2, X } from "lucide-react";

import type { ProductEditorController } from "../../hooks/useProductEditor";

interface Props {
  editor: ProductEditorController;
}

/**
 * Shows saved media and the local upload queue.
 * Saved media changes immediately in edit mode; pending files upload during save
 * after product and SKU database IDs are available.
 */
export const ProductMediaLibrary = ({ editor }: Props) => (
  <div className="product-media-library">
    <div className="variant-workbench-heading">
      <div>
        <h3>Product media library</h3>
        <p>{editor.mediaScope === "all"
          ? "New uploads are shared by all variants."
          : "Add SKU media from the Selected Variant panel; shared media remains available as fallback."}</p>
      </div>
    </div>

    {editor.media.length > 0 && (
      <div className="admin-media-grid">
        {editor.media.map((item) => (
          <article className="admin-media-card" key={item.id}>
            <div className="admin-media-image">
              {item.type === "VIDEO"
                ? <video src={item.url} controls muted playsInline preload="metadata" />
                : <img src={item.thumbnailUrl || item.url} alt={item.altText || editor.form.name} />}
              {item.isPrimary && <span className="admin-primary-badge"><Star size={13} /> Primary</span>}
            </div>
            <div className="admin-media-actions">
              {editor.editingProductId && (
                <select
                  className="form-input"
                  aria-label={`Assign ${item.altText || "media"} to a variant`}
                  value={item.variantId ?? ""}
                  disabled={editor.mediaBusyId === item.id}
                  onChange={(event) => void editor.assignMediaToVariant(item.id, event.target.value)}
                >
                  <option value="">All variants</option>
                  {editor.variantDrafts.filter((variant) => variant.id).map((variant) => (
                    <option key={variant.id} value={variant.id}>{variant.optionLabel || variant.sku}</option>
                  ))}
                </select>
              )}
              {item.type === "IMAGE" && !item.isPrimary && (
                <button type="button" onClick={() => void editor.setPrimaryImage(item.id)} disabled={editor.mediaBusyId === item.id}><Star size={16} /> Primary</button>
              )}
              <button className="media-delete-button" type="button" onClick={() => void editor.deleteImage(item.id)} disabled={editor.mediaBusyId === item.id}><Trash2 size={16} /> Delete</button>
            </div>
          </article>
        ))}
      </div>
    )}

    {editor.pendingMedia.length > 0 && (
      <div className="pending-image-list">
        {editor.pendingMedia.map((item) => (
          <div key={item.key}>
            <span>{item.file.name}</span>
            {editor.mediaScope === "all" ? <small>All variants</small> : (
              <select
                className="form-input"
                aria-label={`Assign ${item.file.name} to a variant`}
                value={item.variantKey}
                onChange={(event) => editor.movePendingMedia(item.key, event.target.value)}
              >
                <option value="all">Shared fallback</option>
                {editor.variantDrafts.map((variant) => (
                  <option key={variant.key} value={variant.key}>{variant.optionLabel || variant.sku || "Default"}</option>
                ))}
              </select>
            )}
            <button type="button" aria-label={`Remove ${item.file.name}`} onClick={() => editor.setPendingMedia((current) => current.filter((entry) => entry.key !== item.key))}><X size={15} /></button>
          </div>
        ))}
      </div>
    )}

    {editor.mediaScope === "all" && editor.mediaCountForScope("all") < 4 ? (
      <label className="admin-image-picker">
        <ImagePlus size={22} />
        <span>Add shared media</span>
        <small>JPEG, PNG, WebP up to 2 MB · MP4, WebM up to 20 MB · 4 shared items</small>
        <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={editor.handleImageSelection} />
      </label>
    ) : editor.mediaScope === "all" ? (
      <p className="admin-media-limit">The four-item shared media limit has been reached.</p>
    ) : (
      <p className="admin-media-limit">Individual SKU uploads are available in the Selected Variant panel.</p>
    )}
  </div>
);
