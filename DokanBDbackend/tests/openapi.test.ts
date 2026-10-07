import { describe, expect, it } from "vitest";

import { openApiDocument } from "../src/docs/openapi.js";

describe("OpenAPI documentation", () => {
  const paths = openApiDocument.paths as Record<
    string,
    Record<string, Record<string, unknown>>
  >;

  it("documents every currently connected API operation", () => {
    const operationCount = Object.values(paths).reduce(
      (total, pathItem) => total + Object.keys(pathItem).length,
      0,
    );

    expect(Object.keys(paths)).toHaveLength(41);
    expect(operationCount).toBe(54);
  });

  it("marks protected and administrator operations with bearer security", () => {
    expect(paths["/cart"]?.get?.security).toEqual([{ bearerAuth: [] }]);
    expect(paths["/admin/products"]?.post?.security).toEqual([
      { bearerAuth: [] },
    ]);
  });

  it("documents JSON and multipart request bodies", () => {
    expect(paths["/auth/register"]?.post?.requestBody).toBeDefined();
    expect(
      paths["/admin/products/{productId}/media"]?.post?.requestBody,
    ).toBeDefined();
    expect(paths["/users/me/profile-image"]?.post?.requestBody).toBeDefined();
  });

  it("documents product media listing and response schemas", () => {
    expect(paths["/admin/products/{productId}/media"]?.get).toBeDefined();
    const components = openApiDocument.components.schemas as Record<string, unknown>;
    expect(components.ProductMedia).toBeDefined();
    expect(components.ProductMediaListResponse).toBeDefined();
  });
});
