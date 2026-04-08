import { describe, it, expect } from "vitest";

function getToolLabel(
  toolName: string,
  input: Record<string, unknown>,
): string {
  if (toolName === "updateSlide") {
    return `Updated slide ${(input.slideIndex as number) + 1}`;
  } else if (toolName === "bulkUpdateSlides") {
    return `Bulk updated ${(input.updates as Array<unknown>).length} slides`;
  } else if (toolName === "addSlide") {
    return "Added new slide";
  } else if (toolName === "deleteSlide") {
    return `Deleted slide ${(input.slideIndex as number) + 1}`;
  } else if (toolName === "reorderSlides") {
    return "Reordered slides";
  }
  return toolName;
}

describe("getToolLabel", () => {
  it("labels updateSlide correctly", () => {
    expect(getToolLabel("updateSlide", { slideIndex: 2 })).toBe(
      "Updated slide 3",
    );
  });

  it("labels bulkUpdateSlides correctly", () => {
    expect(getToolLabel("bulkUpdateSlides", { updates: [{}, {}, {}] })).toBe(
      "Bulk updated 3 slides",
    );
  });

  it("labels addSlide correctly", () => {
    expect(getToolLabel("addSlide", {})).toBe("Added new slide");
  });

  it("labels deleteSlide correctly", () => {
    expect(getToolLabel("deleteSlide", { slideIndex: 0 })).toBe(
      "Deleted slide 1",
    );
  });

  it("labels reorderSlides correctly", () => {
    expect(getToolLabel("reorderSlides", {})).toBe("Reordered slides");
  });

  it("returns tool name for unknown tools", () => {
    expect(getToolLabel("unknownTool", {})).toBe("unknownTool");
  });
});
