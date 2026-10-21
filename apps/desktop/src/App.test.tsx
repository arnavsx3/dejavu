import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { App } from "./App";
import { createMoment, deleteMoment, listMoments, MomentError, updateMoment } from "./lib/moments";

vi.mock("./lib/moments", async (original) => ({
  ...(await original<typeof import("./lib/moments")>()),
  createMoment: vi.fn(),
  listMoments: vi.fn(),
  updateMoment: vi.fn(),
  deleteMoment: vi.fn(),
}));

const fixture = {
  id: "saved-id",
  body: "Synthetic shelf memory",
  createdAt: "2026-01-01T12:00:00Z",
  updatedAt: "2026-01-01T12:00:00Z",
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(listMoments).mockResolvedValue([]);
});

it("adds a card only after saving and loads it again on a fresh app mount", async () => {
  const user = userEvent.setup();
  vi.mocked(listMoments).mockResolvedValueOnce([]).mockResolvedValueOnce([fixture]);
  vi.mocked(createMoment).mockResolvedValue(fixture);
  const first = render(<App />);
  await screen.findByRole("heading", { name: "Your shelf is waiting." });
  await user.click(screen.getByRole("button", { name: "Keep a moment" }));
  await user.type(screen.getByRole("textbox"), fixture.body);
  await user.click(screen.getByRole("button", { name: "Keep this moment" }));
  expect(
    await screen.findByRole("button", { name: `Open moment: ${fixture.body}` }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  first.unmount();
  render(<App />);
  expect(
    await screen.findByRole("button", { name: `Open moment: ${fixture.body}` }),
  ).toBeInTheDocument();
  expect(createMoment).toHaveBeenCalledOnce();
});

it("opens a saved card and updates its text after editing", async () => {
  const user = userEvent.setup();
  vi.mocked(listMoments).mockResolvedValue([fixture]);
  const edited = { ...fixture, body: "Updated shelf test", updatedAt: "2026-01-01T12:00:01Z" };
  vi.mocked(updateMoment).mockResolvedValue(edited);
  render(<App />);
  await user.click(await screen.findByRole("button", { name: `Open moment: ${fixture.body}` }));
  expect(within(screen.getByRole("dialog")).getByText(fixture.body)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Edit moment" }));
  await user.clear(screen.getByRole("textbox"));
  await user.type(screen.getByRole("textbox"), edited.body);
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(
    await screen.findByRole("button", { name: `Open moment: ${edited.body}` }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: `Open moment: ${fixture.body}` }),
  ).not.toBeInTheDocument();
});

it("leaves the moment intact after a failed delete, then removes it after retry", async () => {
  const user = userEvent.setup();
  vi.mocked(listMoments).mockResolvedValue([fixture]);
  vi.mocked(deleteMoment)
    .mockRejectedValueOnce(new MomentError("storage", "Couldn't remove this moment."))
    .mockResolvedValueOnce(undefined);
  render(<App />);
  await user.click(await screen.findByRole("button", { name: `Open moment: ${fixture.body}` }));
  await user.click(screen.getByRole("button", { name: "Remove moment" }));
  await user.click(screen.getByRole("button", { name: "Remove for good" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't remove this moment");
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Remove for good" }));
  expect(
    await screen.findByRole("heading", { name: "Your shelf is waiting." }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: `Open moment: ${fixture.body}` }),
  ).not.toBeInTheDocument();
});

it("shows an actionable loading failure without claiming the shelf is empty", async () => {
  const user = userEvent.setup();
  vi.mocked(listMoments)
    .mockRejectedValueOnce(new MomentError("storage", "Your moments couldn't be opened."))
    .mockResolvedValueOnce([fixture]);
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Your moments couldn't be opened");
  expect(screen.queryByRole("heading", { name: "Your shelf is waiting." })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Keep a moment" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("button", { name: `Open moment: ${fixture.body}` }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Keep a moment" })).toBeEnabled();
});

it("keeps browser previews explicit and disables saving", async () => {
  vi.mocked(listMoments).mockRejectedValue(
    new MomentError("desktop_required", "Open the dejavu desktop app to keep your moments."),
  );
  render(<App />);
  await waitFor(() =>
    expect(
      screen.getByText("Open the dejavu desktop app to keep your moments."),
    ).toBeInTheDocument(),
  );
  expect(screen.getByRole("button", { name: "Keep a moment" })).toBeDisabled();
  expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
});
