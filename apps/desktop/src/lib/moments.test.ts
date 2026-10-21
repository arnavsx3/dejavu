import { invoke, isTauri } from "@tauri-apps/api/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMoment, deleteMoment, listMoments, MomentError, updateMoment } from "./moments";

vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(), isTauri: vi.fn() }));

const moment = {
  id: "24f3507d-6694-4e86-a15c-30b904733d04",
  body: "Synthetic bridge fixture",
  createdAt: "2026-01-01T12:00:00Z",
  updatedAt: "2026-01-01T12:00:00Z",
};

beforeEach(() => {
  vi.mocked(isTauri).mockReturnValue(true);
});

describe("native moment bridge", () => {
  it("loads and creates moments through the registered commands", async () => {
    vi.mocked(invoke).mockResolvedValueOnce([moment]).mockResolvedValueOnce(moment);
    await expect(listMoments()).resolves.toEqual([moment]);
    await expect(createMoment(moment.body)).resolves.toEqual(moment);
    expect(invoke).toHaveBeenNthCalledWith(1, "list_moments", undefined);
    expect(invoke).toHaveBeenNthCalledWith(2, "create_moment", { body: moment.body });
  });

  it("includes the revision when editing and deleting", async () => {
    vi.mocked(invoke)
      .mockResolvedValueOnce({ ...moment, body: "Changed fixture" })
      .mockResolvedValueOnce(undefined);
    await updateMoment(moment, "Changed fixture");
    await deleteMoment(moment);
    expect(invoke).toHaveBeenNthCalledWith(1, "update_moment", {
      id: moment.id,
      body: "Changed fixture",
      expectedUpdatedAt: moment.updatedAt,
    });
    expect(invoke).toHaveBeenNthCalledWith(2, "delete_moment", {
      id: moment.id,
      expectedUpdatedAt: moment.updatedAt,
    });
  });

  it("retains actionable native error codes", async () => {
    vi.mocked(invoke).mockRejectedValueOnce({
      code: "conflict",
      message: "Refresh before trying again.",
    });
    await expect(updateMoment(moment, "Changed fixture")).rejects.toMatchObject({
      code: "conflict",
      message: "Refresh before trying again.",
    });
  });

  it("does not pretend a browser preview can persist moments", async () => {
    vi.mocked(isTauri).mockReturnValue(false);
    await expect(createMoment("Preview fixture")).rejects.toMatchObject({
      code: "desktop_required",
    });
    expect(invoke).not.toHaveBeenCalled();
  });

  it("does not expose unknown transport error details", async () => {
    vi.mocked(invoke).mockRejectedValueOnce("private internal details");
    await expect(listMoments()).rejects.toBeInstanceOf(MomentError);
    vi.mocked(invoke).mockRejectedValueOnce("private internal details");
    await expect(listMoments()).rejects.toMatchObject({
      code: "unknown",
      message: "That action couldn't be completed. Please try again.",
    });
  });
});
