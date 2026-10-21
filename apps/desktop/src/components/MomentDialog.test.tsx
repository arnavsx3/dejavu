import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import {
  createMoment,
  deleteMoment,
  MomentError,
  updateMoment,
  savePhotoMoment,
  readPhoto,
} from "../lib/moments";
import { MomentDialog } from "./MomentDialog";

vi.mock("../lib/moments", async (original) => ({
  ...(await original<typeof import("../lib/moments")>()),
  createMoment: vi.fn(),
  updateMoment: vi.fn(),
  deleteMoment: vi.fn(),
  savePhotoMoment: vi.fn(),
  readPhoto: vi.fn().mockResolvedValue(new ArrayBuffer(1)),
}));

const saved = {
  id: "test-id",
  body: "Synthetic test moment",
  photos: [],
  createdAt: "2026-01-01T12:00:00Z",
  updatedAt: "2026-01-01T12:00:00Z",
};
const onSaved = vi.fn();
const onRemoved = vi.fn();
const onClose = vi.fn();

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(readPhoto).mockResolvedValue(new ArrayBuffer(2));
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn().mockReturnValue("blob:synthetic"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => vi.unstubAllGlobals());

it("creates a moment only after a successful save", async () => {
  const user = userEvent.setup();
  vi.mocked(createMoment).mockResolvedValue(saved);
  render(<MomentDialog moment={null} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />);
  expect(screen.getByRole("button", { name: "Keep this moment" })).toBeDisabled();
  await user.type(screen.getByRole("textbox", { name: "Your moment" }), saved.body);
  await user.click(screen.getByRole("button", { name: "Keep this moment" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
  expect(createMoment).toHaveBeenCalledOnce();
  expect(createMoment).toHaveBeenCalledWith(saved.body);
});

it("preserves the draft and permits retry when saving fails", async () => {
  const user = userEvent.setup();
  vi.mocked(createMoment)
    .mockRejectedValueOnce(new MomentError("storage", "Couldn't save right now."))
    .mockResolvedValueOnce(saved);
  render(<MomentDialog moment={null} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />);
  await user.type(screen.getByRole("textbox"), saved.body);
  await user.click(screen.getByRole("button", { name: "Keep this moment" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Your draft is still here");
  expect(screen.getByRole("textbox")).toHaveValue(saved.body);
  expect(onSaved).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Keep this moment" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(saved));
});

it("edits a saved moment using its existing revision", async () => {
  const user = userEvent.setup();
  const updated = { ...saved, body: "Edited fixture", updatedAt: "2026-01-01T12:00:01Z" };
  vi.mocked(updateMoment).mockResolvedValue(updated);
  render(<MomentDialog moment={saved} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />);
  await user.click(screen.getByRole("button", { name: "Edit moment" }));
  expect(screen.getByRole("textbox")).toHaveValue(saved.body);
  await user.clear(screen.getByRole("textbox"));
  await user.type(screen.getByRole("textbox"), updated.body);
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(updated));
  expect(updateMoment).toHaveBeenCalledWith(saved, updated.body);
});

it("requires a separate confirmation before removing a saved moment", async () => {
  const user = userEvent.setup();
  vi.mocked(deleteMoment).mockResolvedValue(undefined);
  render(<MomentDialog moment={saved} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />);
  await user.click(screen.getByRole("button", { name: "Remove moment" }));
  expect(deleteMoment).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Keep it" }));
  expect(deleteMoment).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Remove moment" }));
  await user.click(screen.getByRole("button", { name: "Remove for good" }));
  await waitFor(() => expect(onRemoved).toHaveBeenCalledWith(saved.id));
  expect(deleteMoment).toHaveBeenCalledWith(saved);
});

it("protects an unsaved draft when the dialog is dismissed", async () => {
  const user = userEvent.setup();
  render(<MomentDialog moment={null} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />);
  await user.type(screen.getByRole("textbox"), "Unsaved test words");
  fireEvent(screen.getByRole("dialog"), new Event("cancel", { cancelable: true }));
  expect(screen.getByRole("heading", { name: "Leave these words behind?" })).toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Keep writing" }));
  expect(screen.getByRole("textbox")).toHaveValue("Unsaved test words");
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  await user.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(onClose).toHaveBeenCalledOnce();
});

it("counts Unicode code points rather than UTF-16 code units for the limit", () => {
  render(<MomentDialog moment={null} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "🌧".repeat(16_000) } });
  expect(screen.getByRole("button", { name: "Keep this moment" })).toBeEnabled();
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "🌧".repeat(16_001) } });
  expect(screen.getByRole("button", { name: "Keep this moment" })).toBeDisabled();
});

it("renders saved content as text, never executable markup", () => {
  const { container } = render(
    <MomentDialog
      moment={{ ...saved, body: '<img src="x" onerror="alert(1)">' }}
      onSaved={onSaved}
      onRemoved={onRemoved}
      onClose={onClose}
    />,
  );
  expect(container.querySelector("img")).toBeNull();
  expect(screen.getByText('<img src="x" onerror="alert(1)">')).toBeInTheDocument();
});

it("keeps photo-only drafts on a failed save and persists retained selections on retry", async () => {
  const user = userEvent.setup();
  const photoMoment = { ...saved, body: "", photos: [{ id: "photo-1", width: 800, height: 600 }] };
  vi.mocked(savePhotoMoment)
    .mockRejectedValueOnce(new MomentError("validation", "Photo cannot be decoded."))
    .mockResolvedValueOnce(photoMoment);
  render(<MomentDialog moment={null} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />);
  await user.upload(
    screen.getByLabelText("Choose photos"),
    new File(["synthetic png"], "fixture.png", { type: "image/png" }),
  );
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Keep this moment" })).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "Keep this moment" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Your draft is still here");
  expect(screen.getByRole("button", { name: "Remove new photo 1" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Keep this moment" }));
  await waitFor(() => expect(onSaved).toHaveBeenCalledWith(photoMoment));
  expect(savePhotoMoment).toHaveBeenLastCalledWith(
    null,
    "",
    [],
    [expect.objectContaining({ encoded: btoa("synthetic png") })],
  );
});

it("protects photo changes and refuses to save an emptied photo-only moment", async () => {
  const user = userEvent.setup();
  const photoMoment = { ...saved, body: "", photos: [{ id: "photo-1", width: 800, height: 600 }] };
  render(
    <MomentDialog moment={photoMoment} onSaved={onSaved} onRemoved={onRemoved} onClose={onClose} />,
  );
  await user.click(screen.getByRole("button", { name: "Edit moment" }));
  await user.click(screen.getByRole("button", { name: "Remove kept photo 1" }));
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByRole("button", { name: "Discard changes" })).toBeInTheDocument();
  expect(onSaved).not.toHaveBeenCalled();
});

it("opens an uncropped photo viewer and navigates between full images", async () => {
  const user = userEvent.setup();
  const photos = [
    { id: "photo-1", width: 800, height: 600 },
    { id: "photo-2", width: 600, height: 800 },
  ];
  render(
    <MomentDialog
      moment={{ ...saved, photos }}
      onSaved={onSaved}
      onRemoved={onRemoved}
      onClose={onClose}
    />,
  );
  await user.click(screen.getByRole("button", { name: "Open full photo 1" }));
  expect(screen.getByRole("heading", { name: "Photo 1 of 2" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Next photo" }));
  expect(screen.getByRole("heading", { name: "Photo 2 of 2" })).toBeInTheDocument();
  await user.keyboard("{ArrowLeft}");
  expect(screen.getByRole("heading", { name: "Photo 1 of 2" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Explore full size" }));
  expect(screen.getByRole("button", { name: "Fit whole photo" })).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Back to moment ×" }));
  expect(screen.queryByRole("heading", { name: "Photo 1 of 2" })).not.toBeInTheDocument();
  expect(onClose).not.toHaveBeenCalled();
});
