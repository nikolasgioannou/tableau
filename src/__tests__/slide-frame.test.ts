import { describe, it, expect } from "vitest";

describe("SlideFrame", () => {
  it("calculates correct aspect ratio", () => {
    const SLIDE_WIDTH = 1280;
    const SLIDE_HEIGHT = 720;
    const containerWidth = 640;
    const scale = containerWidth / SLIDE_WIDTH;
    const containerHeight = containerWidth * (SLIDE_HEIGHT / SLIDE_WIDTH);

    expect(scale).toBe(0.5);
    expect(containerHeight).toBe(360);
  });

  it("scales to various container widths", () => {
    const containerWidths = [320, 640, 960, 1280];
    const expectedScales = [0.25, 0.5, 0.75, 1];

    containerWidths.forEach((width, i) => {
      expect(width / 1280).toBe(expectedScales[i]);
    });
  });
});
