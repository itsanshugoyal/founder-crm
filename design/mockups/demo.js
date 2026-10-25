// Illustrative data only. No production records, network requests, storage, or writes.
const sampleTasks = [
  {
    id: "mira",
    initials: "MS",
    person: "Mira Sethi",
    company: "Luma Learning",
    title: "Review the pilot introduction",
    short: "Pilot introduction",
    type: "draft",
    kind: "Draft review",
    owner: "Anshu",
    date: "Today",
    time: "Before you send",
    status: "Needs your review",
    why: "A first-message draft is ready for a human review. No message has been sent.",
    context:
      "Mira asked to understand the pilot format. Check that this introduction reflects the current offer before choosing a next step.",
    evidence: "Illustrative note · 23 Oct 2026",
    note: "Interested in a simple overview of the pilot. Budget and timing are still unknown.",
    next: "Check the offer and wording",
    action: "Preview draft review",
    message:
      "Hi Mira,\n\nYou mentioned wanting a clearer view of the pilot. I can share the short outline, including what we would test and the time it would need from your team.\n\nWould that be useful?\n\nAnshu",
    foot: "Draft only · not approved · not sent",
  },
  {
    id: "inez",
    initials: "IR",
    person: "Inez Rao",
    company: "Common Ground",
    title: "Prepare for the discovery call",
    short: "Discovery call preparation",
    type: "meeting",
    kind: "Meeting",
    owner: "Both",
    date: "Today",
    time: "16:30–17:00",
    status: "Prepare together",
    why: "A discovery call is on today’s sample agenda. Prepare the questions before the meeting.",
    context:
      "Use the conversation to understand the existing process, the friction, and who needs to be involved. Qualification is still unknown.",
    evidence: "Illustrative meeting note · 24 Oct 2026",
    note: "Discuss the current follow-up process. No pilot, budget, or commercial commitment has been agreed.",
    next: "Review the discovery questions",
    action: "Preview meeting brief",
    message:
      "DISCOVERY QUESTIONS\n\n1. How do you track follow-ups today?\n2. Where does work usually get lost?\n3. Who would need to try a new approach?\n\nLeave room for the answers. This is an illustrative preparation note.",
    foot: "Sample meeting brief · no calendar connection",
  },
  {
    id: "pilot",
    initials: "DD",
    person: "Founder team",
    company: "DealDock · internal",
    title: "Confirm the pilot checklist",
    short: "Pilot checklist",
    type: "task",
    kind: "Commitment",
    owner: "Anshu",
    date: "Today",
    time: "No fixed time",
    status: "Open commitment",
    why: "This is an open internal commitment due today. Review the scope before involving a potential pilot.",
    context:
      "Keep the pilot boundaries explicit: what we will test, what the founder needs to do, and what evidence we will record.",
    evidence: "Illustrative internal note · 24 Oct 2026",
    note: "Define a short, reviewable pilot. No success claims, commercial launch, or automatic outreach are implied.",
    next: "Read the three pilot checks",
    action: "Preview checklist",
    message:
      "PILOT CHECKLIST\n\n□ Write the question the pilot will test.\n□ Agree the time needed from each person.\n□ Decide what evidence to review together.\n\nThis prototype cannot save completion or create live work.",
    foot: "Sample checklist · changes are not saved",
  },
  {
    id: "kabir",
    initials: "KM",
    person: "Kabir Mehta",
    company: "Northline Studio",
    title: "Keep the follow-up promise",
    short: "Follow-up promise",
    type: "followup",
    kind: "Follow-up",
    owner: "Nahush",
    date: "Tomorrow",
    time: "Mon, 26 Oct",
    status: "Promise to keep",
    why: "A follow-up was promised for tomorrow in this sample. The next step stays visible without implying that it has happened.",
    context:
      "Kabir requested the short outline. Review what was promised and prepare a relevant response; do not infer purchase intent.",
    evidence: "Illustrative conversation note · 22 Oct 2026",
    note: "Promised to return with the pilot outline on Monday. Offer fit and timing have not been confirmed.",
    next: "Review the recorded promise",
    action: "Preview follow-up note",
    message:
      "RECORDED PROMISE\n\nReturn with the short pilot outline on Monday.\n\nBefore writing: check that the outline is current and that it answers the question Kabir asked.\n\nNo follow-up has been approved or sent.",
    foot: "Sample promise · human review required",
  },
];
let selectedId = new URLSearchParams(location.search).get("task") || "mira";
if (!sampleTasks.some((task) => task.id === selectedId)) selectedId = "mira";
const iconArrow =
  '<svg aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14m-5-5 5 5-5 5"/></svg>';
function taskById(id) {
  return sampleTasks.find((task) => task.id === id) || sampleTasks[0];
}
function setSelection(id, focus = false) {
  if (!sampleTasks.some((task) => task.id === id)) return;
  selectedId = id;
  const context = document.getElementById("selected-context");
  if (context) context.hidden = false;
  const emptyContext = document.getElementById("empty-selection");
  if (emptyContext) emptyContext.hidden = true;
  document
    .querySelectorAll("[data-select]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.select === id)),
    );
  document.querySelectorAll("[data-fill]").forEach((element) => {
    const value = taskById(id)[element.dataset.fill];
    element.textContent = value || "";
  });
  document
    .querySelectorAll("[data-current-type]")
    .forEach((element) => (element.textContent = taskById(id).kind));
  const params = new URLSearchParams(location.search);
  params.set("task", id);
  history.replaceState(null, "", `${location.pathname}?${params}`);
  if (focus && matchMedia("(max-width:800px)").matches) {
    context?.scrollIntoView({ behavior: "instant", block: "start" });
    context?.focus({ preventScroll: true });
  }
}
function clearSelection() {
  selectedId = "";
  document
    .querySelectorAll("[data-select]")
    .forEach((button) => button.setAttribute("aria-pressed", "false"));
  const context = document.getElementById("selected-context");
  if (context) context.hidden = true;
  let emptyContext = document.getElementById("empty-selection");
  if (!emptyContext && context) {
    emptyContext = document.createElement("section");
    emptyContext.id = "empty-selection";
    emptyContext.className = "no-results empty-selection";
    emptyContext.setAttribute("aria-live", "polite");
    const heading = document.createElement("strong");
    heading.textContent = "No work selected";
    const text = document.createElement("p");
    text.textContent =
      "Reset the filters or try another search to see the sample context.";
    emptyContext.append(heading, text);
    context.after(emptyContext);
  }
  if (emptyContext) emptyContext.hidden = false;
  const params = new URLSearchParams(location.search);
  params.delete("task");
  history.replaceState(null, "", `${location.pathname}?${params}`);
}
let noticeTimer;
function showNotice(message) {
  const notice = document.getElementById("demo-notice");
  notice.textContent = message;
  notice.hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => (notice.hidden = true), 6500);
}
function openPreview() {
  const task = taskById(selectedId);
  const dialog = document.getElementById("preview-dialog");
  dialog.querySelector("[data-dialog-title]").textContent = task.title;
  dialog.querySelector("[data-dialog-message]").textContent = task.message;
  dialog.querySelector("[data-dialog-foot]").textContent = task.foot;
  dialog.showModal();
}
document
  .querySelectorAll("[data-select]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      setSelection(button.dataset.select, true),
    ),
  );
document
  .querySelectorAll("[data-demo-nav]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      showNotice(
        `${button.dataset.demoNav} is outside this Today-page concept. This prototype has no live navigation or data.`,
      ),
    ),
  );
document
  .querySelectorAll("[data-preview]")
  .forEach((button) => button.addEventListener("click", openPreview));
document
  .querySelectorAll("[data-close-dialog]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      document.getElementById("preview-dialog").close(),
    ),
  );
document
  .querySelectorAll("[data-project]")
  .forEach((button) =>
    button.addEventListener("click", () =>
      showNotice(
        "DealDock is the illustrative project in all three concepts. No live workspace is connected.",
      ),
    ),
  );
document.querySelectorAll("[data-evidence]").forEach((button) =>
  button.addEventListener("click", () => {
    const note = document.getElementById("evidence-detail");
    note.hidden = !note.hidden;
    button.setAttribute("aria-expanded", String(!note.hidden));
  }),
);
let activeQueue = "all";
function filterTasks() {
  const term = (
    document.querySelector("[data-search]")?.value || ""
  ).toLowerCase();
  const visibleIds = [];
  document.querySelectorAll("[data-task-item]").forEach((item) => {
    const task = taskById(item.dataset.taskItem);
    const matchesQueue =
      activeQueue === "all" ||
      task.type === activeQueue ||
      task.owner.toLowerCase() === activeQueue;
    const matchesTerm = `${task.person} ${task.company} ${task.title}`
      .toLowerCase()
      .includes(term);
    item.hidden = !(matchesQueue && matchesTerm);
    if (!item.hidden) visibleIds.push(task.id);
  });
  const shown = visibleIds.length;
  const empty = document.getElementById("empty-queue");
  if (empty) empty.hidden = shown > 0;
  document
    .querySelectorAll("[data-visible-count]")
    .forEach((element) => (element.textContent = shown));
  document
    .querySelectorAll("[data-count-noun]")
    .forEach(
      (element) =>
        (element.textContent =
          element.dataset.countNoun + (shown === 1 ? "" : "s")),
    );
  document
    .querySelectorAll("[data-time-group]")
    .forEach(
      (group) =>
        (group.hidden = ![...group.querySelectorAll("[data-task-item]")].some(
          (item) => !item.hidden,
        )),
    );
  const params = new URLSearchParams(location.search);
  if (activeQueue === "all") params.delete("queue");
  else params.set("queue", activeQueue);
  if (term) params.set("q", term);
  else params.delete("q");
  history.replaceState(null, "", `${location.pathname}?${params}`);
  if (shown)
    setSelection(visibleIds.includes(selectedId) ? selectedId : visibleIds[0]);
  else clearSelection();
}
document.querySelectorAll("[data-queue]").forEach((button) =>
  button.addEventListener("click", () => {
    activeQueue = button.dataset.queue;
    document
      .querySelectorAll("[data-queue]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
    filterTasks();
  }),
);
document
  .querySelectorAll("[data-search]")
  .forEach((input) => input.addEventListener("input", filterTasks));
document.querySelectorAll("[data-reset]").forEach((button) =>
  button.addEventListener("click", () => {
    activeQueue = "all";
    document
      .querySelectorAll("[data-search]")
      .forEach((input) => (input.value = ""));
    document
      .querySelectorAll("[data-queue]")
      .forEach((item) =>
        item.setAttribute("aria-pressed", String(item.dataset.queue === "all")),
      );
    filterTasks();
  }),
);
const initialParams = new URLSearchParams(location.search);
const initialQueue = initialParams.get("queue");
if (
  initialQueue &&
  document.querySelector(`[data-queue="${CSS.escape(initialQueue)}"]`)
) {
  activeQueue = initialQueue;
  document
    .querySelectorAll("[data-queue]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.queue === initialQueue),
      ),
    );
}
document
  .querySelectorAll("[data-search]")
  .forEach((input) => (input.value = initialParams.get("q") || ""));
filterTasks();
