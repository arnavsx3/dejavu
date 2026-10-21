import { render, screen, waitFor } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { readPhoto } from "../lib/moments";
import { PhotoImage } from "./PhotoImage";

vi.mock("../lib/moments", () => ({ readPhoto: vi.fn() }));

it("releases image URLs on unmount and ignores late image responses", async () => {
  const create = vi.fn().mockReturnValue("blob:synthetic");
  const revoke = vi.fn();
  vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
  vi.mocked(readPhoto).mockResolvedValue(new ArrayBuffer(2));
  const first = render(<PhotoImage id="synthetic" alt="Test photo" />);
  await waitFor(() => expect(screen.getByRole("img")).toHaveAttribute("src", "blob:synthetic"));
  first.unmount();
  expect(revoke).toHaveBeenCalledWith("blob:synthetic");
  let resolve: ((bytes: ArrayBuffer) => void) | undefined;
  vi.mocked(readPhoto).mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const second = render(<PhotoImage id="late" alt="Late photo" />);
  second.unmount();
  resolve?.(new ArrayBuffer(2));
  await Promise.resolve();
  expect(create).toHaveBeenCalledOnce();
  vi.unstubAllGlobals();
});
