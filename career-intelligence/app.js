const capabilityDetails = {
  "guidance-monitor": {
    pillar: "Knowledge & guidance intelligence",
    title: "Guidance Change Monitor",
    summary: "Watches approved knowledge sources for changes and organizes the findings for human review.",
    problem: "Important guidance arrives across multiple channels and can be difficult to monitor consistently through a manual process.",
    workflow: "Monitor approved sources, identify potential changes, extract key details, classify relevance, and write findings to a structured register.",
    human: "A qualified professional verifies source authority, meaning, effective date, applicability, and any downstream action before relying on the guidance.",
    value: "Creates a visible record of changing guidance and redirects time from repetitive collection toward interpretation."
  },
  "guidance-advisor": {
    pillar: "Knowledge & guidance intelligence",
    title: "Program Guidance Advisor",
    summary: "Turns extensive program guidance and approved precedent into traceable structuring research.",
    problem: "Complex structuring questions can require research across hundreds of pages of changing guidance and prior institutional work.",
    workflow: "Frame the question, retrieve relevant approved sources, compare requirements and precedent, identify exceptions, and assemble a cited research brief.",
    human: "The user evaluates recency, factual similarity, conflicting interpretations, and whether specialist review or escalation is required.",
    value: "Compresses the search and synthesis stage while preserving source traceability and professional accountability."
  },
  "narrative-studio": {
    pillar: "Transaction analysis & decision support",
    title: "Transaction Narrative Studio",
    summary: "Synthesizes the full lending record into a structured transaction narrative for professional refinement.",
    problem: "A credit narrative must reconcile the request, sponsor, property, operations, model, terms, market evidence, due diligence, and governing guidance into one supportable professional argument.",
    workflow: "Assemble the approved transaction record, map each input to a controlled credit outline, draft section by section, connect claims to evidence, and identify missing support or inconsistencies.",
    human: "The author validates every material fact and calculation, resolves conflicts, determines risk framing, and owns the final narrative.",
    value: "Creates a consistent starting point and makes missing evidence easier to see before formal review."
  },
  "risk-lens": {
    pillar: "Transaction analysis & decision support",
    title: "Property & Market Risk Lens",
    summary: "Tests transaction assumptions against market evidence, comparable properties, and scenario sensitivities.",
    problem: "Transaction assumptions can be difficult to evaluate consistently against external market evidence and near-term risk scenarios.",
    workflow: "Capture stated assumptions, normalize approved external evidence, compare relevant data, add location context, and surface discrepancies.",
    human: "A professional selects suitable evidence, assesses data quality, interprets local context, and determines whether a difference is meaningful.",
    value: "Creates an inspectable bridge between transaction claims and market evidence without representing the output as a valuation or decision."
  },
  "integrity-review": {
    pillar: "Review & governance",
    title: "Submission Integrity Review",
    summary: "Reviews a transaction narrative against its supporting files for consistency, completeness, and clarity.",
    problem: "A persuasive narrative can still create risk when it conflicts with its source material or leaves material questions unresolved.",
    workflow: "Map narrative claims to source evidence, compare repeated facts and figures, run controlled completeness checks, and issue a review log.",
    human: "The deal team resolves each substantive flag and determines materiality. The workflow supports review; it does not certify the submission.",
    value: "Introduces a repeatable quality-control pass before committee or external review."
  },
  "comment-responder": {
    pillar: "Review & governance",
    title: "Committee Comment Responder",
    summary: "Organizes reviewer feedback and prepares source-grounded draft responses in the author’s established voice.",
    problem: "Reviewer feedback often requires renewed research, coordinated edits, and careful tracking across a long narrative.",
    workflow: "Classify comments, locate relevant evidence and passages, draft responses, propose revisions, and maintain an issue-resolution record.",
    human: "The author decides whether each comment is substantively resolved, adjusts the language, adds context, and approves every change.",
    value: "Turns review comments into a structured work queue while preserving the author’s responsibility and voice."
  },
  "tracker-pipeline": {
    pillar: "Workflow & document operations",
    title: "Intake-to-Tracker Pipeline",
    summary: "Converts recurring email, PDF, and file-based inputs into a centralized, reviewable operating record.",
    problem: "Quotes, status updates, and document-derived facts are often captured manually and inconsistently across inboxes and files.",
    workflow: "Receive, classify, extract defined fields, validate completeness, check duplicates, update a controlled record, and flag exceptions.",
    human: "Users review low-confidence fields, resolve duplicates and exceptions, and control which sources are authorized for intake.",
    value: "Creates a shared, current record while reducing repetitive re-entry and preserving exception visibility."
  },
  "draw-organizer": {
    pillar: "Workflow & document operations",
    title: "Document Organization Tools",
    summary: "Structures, indexes, and connects transaction materials so teams can find and review the right evidence quickly.",
    problem: "Transaction files arrive across formats, naming conventions, and locations, making review slower and increasing the risk of missed support.",
    workflow: "Classify incoming files, apply consistent naming and metadata, link related materials, identify gaps, and prepare a controlled index.",
    human: "A reviewer confirms document relevance, resolves ambiguous classifications, controls access, and determines whether the record is complete.",
    value: "Turns a scattered file set into a navigable, review-ready transaction record."
  },
  "brand-system": {
    pillar: "Communication & experience design",
    title: "Brand Marketing System",
    summary: "Applies a consistent voice, visual identity, and content structure across professional communications.",
    problem: "Brand and marketing materials lose clarity when content moves across authors, channels, formats, and audiences.",
    workflow: "Map approved messaging and visual standards to content, normalize hierarchy and components, adapt for the channel, and flag exceptions.",
    human: "A brand owner confirms positioning, tone, audience fit, accessibility, and final visual quality before release.",
    value: "Connects structured content operations with consistent, recognizable communication."
  },
  "financial-scenario": {
    pillar: "Transaction analysis & decision support",
    title: "Financial Scenario Analyzer",
    summary: "Tests sizing, sensitivities, and alternative assumptions in a consistent, reviewable framework.",
    problem: "Financial conclusions can shift materially when operating, market, or capital assumptions change, but scenario testing is often fragmented across models and commentary.",
    workflow: "Identify decision-driving assumptions, run approved sensitivities and scenarios, compare results, surface material changes, and organize the findings for review.",
    human: "A finance professional validates the model logic and inputs, selects meaningful scenarios, interprets materiality, and determines which conclusions belong in the decision record.",
    value: "Makes the relationship between assumptions and outcomes easier to inspect without separating analysis from professional judgment."
  }
};

const scopeDetails = {
  "correspondence": { kind: "Transaction input", title: "Request & correspondence", copy: "Captures the transaction request, deal context, questions, decisions, and constraints that initiate and shape the underwriting work.", path: "Request + context → intake, narrative, and tracking", related: ["tracker-pipeline","narrative-studio","comment-responder","human-review","narrative-document","tracker"] },
  "sponsorship": { kind: "Transaction input", title: "Sponsorship & participants", copy: "Adds ownership, borrower and sponsor experience, management, counterparties, responsibilities, and relevant track record.", path: "People + roles → context, accountability, and review", related: ["tracker-pipeline","narrative-studio","integrity-review","human-review","narrative-document","committee-materials"] },
  "property-operations": { kind: "Transaction input", title: "Property & operations", copy: "Provides the property profile, tenancy, operating history, current performance, business plan, and asset-level drivers.", path: "Asset + operations → underwriting and risk framing", related: ["risk-lens","financial-scenario","narrative-studio","integrity-review","human-review","analysis-table"] },
  "financial-model": { kind: "Transaction input", title: "Financial model & sizing", copy: "Supplies cash flow, debt sizing, assumptions, sensitivities, and proposed economics for analysis and review.", path: "Model → analysis, narrative, and integrity review", related: ["risk-lens","financial-scenario","narrative-studio","integrity-review","human-review","analysis-table","narrative-document","committee-materials"] },
  "terms-structure": { kind: "Transaction input", title: "Proposed terms & structure", copy: "Defines requested proceeds, pricing, tenor, amortization, covenants, reserves, recourse, and other structural terms.", path: "Terms + constraints → structuring and decision materials", related: ["guidance-advisor","financial-scenario","narrative-studio","integrity-review","human-review","research-brief","committee-materials"] },
  "due-diligence": { kind: "Transaction input", title: "Third-party due diligence", copy: "Adds appraisal, engineering, environmental, insurance, legal, title, survey, and other supporting evidence.", path: "Third-party evidence → risk, reconciliation, and review", related: ["risk-lens","integrity-review","draw-organizer","narrative-studio","human-review","analysis-table"] },
  "guidance": { kind: "Transaction input", title: "Guidance & precedent", copy: "Provides authoritative program requirements, policy, approved precedent, and institutional standards used to ground recommendations and exceptions.", path: "Guidance → research, structure, and controls", related: ["guidance-monitor","guidance-advisor","integrity-review","narrative-studio","human-review","research-brief"] },
  "market": { kind: "Transaction input", title: "Market & location", copy: "Introduces comparable evidence and place-based context so transaction assumptions can be evaluated in the world around the asset.", path: "Market evidence → risk analysis and presentation", related: ["risk-lens","narrative-studio","human-review","analysis-table","presentation"] },
  "guidance-monitor": { kind: "AI capability", title: "Guidance Change Monitor", copy: "Keeps the working knowledge base current by organizing changes from approved sources for professional interpretation.", path: "Guidance → monitored signals → human interpretation", related: ["guidance","human-review","research-brief","tracker"] },
  "guidance-advisor": { kind: "AI capability", title: "Program Guidance Advisor", copy: "Connects a structuring question to relevant requirements and precedent while preserving source traceability.", path: "Guidance + context → grounded research", related: ["guidance","correspondence","human-review","research-brief"] },
  "narrative-studio": { kind: "AI capability", title: "Transaction Narrative Studio", copy: "Synthesizes the complete transaction record into a coherent credit narrative that a professional can challenge and refine.", path: "All transaction inputs → structured narrative → review", related: ["correspondence","sponsorship","property-operations","financial-model","terms-structure","market","due-diligence","guidance","human-review","narrative-document","committee-materials"] },
  "risk-lens": { kind: "AI capability", title: "Property & Market Risk Lens", copy: "Tests stated assumptions against property evidence, market context, and scenario sensitivities to expose material differences.", path: "Evidence + assumptions → risk framing", related: ["financial-model","due-diligence","market","human-review","analysis-table","presentation"] },
  "integrity-review": { kind: "AI capability", title: "Submission Integrity Review", copy: "Checks whether repeated facts, calculations, support, and guidance remain aligned before the work advances.", path: "Sources + draft → controlled quality review", related: ["financial-model","due-diligence","guidance","human-review","narrative-document"] },
  "comment-responder": { kind: "AI capability", title: "Committee Comment Responder", copy: "Turns reviewer feedback into a traceable work queue and prepares source-grounded draft responses.", path: "Review comments → researched response → decision", related: ["correspondence","guidance","human-review","narrative-document","tracker"] },
  "tracker-pipeline": { kind: "AI capability", title: "Intake-to-Tracker Pipeline", copy: "Converts recurring incoming material into a consistent operating record while making exceptions visible.", path: "Incoming material → structured record", related: ["correspondence","financial-model","human-review","tracker"] },
  "draw-organizer": { kind: "AI capability", title: "Document Organization Tools", copy: "Classifies, names, indexes, and connects transaction materials so the right evidence is easier to find and review.", path: "Scattered files → controlled transaction record", related: ["due-diligence","financial-model","human-review","analysis-table","tracker"] },
  "brand-system": { kind: "AI capability", title: "Brand Marketing System", copy: "Applies a consistent voice, visual identity, and content hierarchy across professional communications.", path: "Approved content → recognizable communication", related: ["human-review","research-brief","narrative-document","presentation"] },
  "financial-scenario": { kind: "AI capability", title: "Financial Scenario Analyzer", copy: "Tests sizing, sensitivities, and alternative assumptions so decision-driving changes are visible and comparable.", path: "Model assumptions → scenarios → interpreted impact", related: ["financial-model","market","risk-lens","human-review","analysis-table","committee-materials"] },
  "human-review": { kind: "Judgment layer", title: "Human Review", copy: "A qualified professional validates sources, interprets risk, resolves exceptions, refines the language, and owns every consequential decision.", path: "Validate · Interpret · Challenge · Refine · Decide", all: true },
  "research-brief": { kind: "Professional output", title: "Research Brief", copy: "Turns guidance, precedent, and transaction context into a concise, cited basis for structuring decisions.", path: "Grounded research → professional recommendation", related: ["guidance","due-diligence","guidance-monitor","guidance-advisor","human-review"] },
  "analysis-table": { kind: "Professional output", title: "Financial Analysis", copy: "Makes calculations, comparisons, sensitivities, and exceptions inspectable in a form teams can evaluate quickly.", path: "Model + evidence → comparable analysis", related: ["financial-model","due-diligence","market","risk-lens","financial-scenario","human-review"] },
  "narrative-document": { kind: "Professional output", title: "Transaction Narrative", copy: "Condenses the transaction story, supporting facts, risk framing, and reviewer responses into a controlled summary.", path: "Structured evidence → coherent summary", related: ["correspondence","financial-model","guidance","narrative-studio","integrity-review","comment-responder","human-review"] },
  "tracker": { kind: "Professional output", title: "Workflow Management", copy: "Creates an operating record of inputs, status, ownership, exceptions, and follow-up across the transaction lifecycle.", path: "Recurring inputs → governed workflow", related: ["correspondence","tracker-pipeline","draw-organizer","human-review"] },
  "presentation": { kind: "Professional output", title: "Executive Presentation", copy: "Distills the approved analysis and narrative into a clear visual story for discussion and decision-making.", path: "Reviewed work → decision-ready communication", related: ["market","risk-lens","brand-system","human-review"] },
  "committee-materials": { kind: "Professional output", title: "Committee Materials", copy: "Assembles the approved research, analysis, narrative, risks, and open decisions into a controlled review package.", path: "Reviewed components → governed decision package", related: ["sponsorship","financial-model","financial-scenario","integrity-review","comment-responder","human-review"] }
};

const cards = [...document.querySelectorAll(".capability-card")];
cards.forEach((card) => card.classList.add("flow-item"));
const flowItems = [...document.querySelectorAll(".flow-item")];
const panel = document.querySelector("#detail-panel");
const closeButton = document.querySelector(".detail-close");
const workflow = document.querySelector(".workflow-shell");
const scopePopover = document.querySelector("#scope-popover");
const scopeClose = document.querySelector(".scope-close");
const scopeMore = document.querySelector(".scope-more");
const reviewGate = document.querySelector(".review-gate");
const embeddedInCareer = window.parent !== window;
let activeFlowItem = null;
let workflowEnteredAt = 0;
let reviewIsVisible = false;
let reviewReleaseTimer = 0;

document.documentElement.classList.add("motion-ready");

function releaseReviewWhenReady() {
  if (!workflow?.classList.contains("is-in-view") || !reviewIsVisible || workflow.classList.contains("is-review-ready")) return;
  clearTimeout(reviewReleaseTimer);
  const remaining = Math.max(0, 1450 - (performance.now() - workflowEnteredAt));
  reviewReleaseTimer = setTimeout(() => workflow.classList.add("is-review-ready"), remaining);
}

function revealWorkflow() {
  if (!workflow || workflow.classList.contains("is-in-view")) return;
  workflowEnteredAt = performance.now();
  workflow.classList.add("is-in-view");
  releaseReviewWhenReady();
}

if (workflow && embeddedInCareer) {
  addEventListener("message", (event) => {
    if (event.origin !== location.origin || event.data?.type !== "career-intelligence-activate") return;
    reviewIsVisible = true;
    revealWorkflow();
    releaseReviewWhenReady();
    parent.postMessage({ type: "career-intelligence-activated" }, location.origin);
  });
  const announceReady = () => parent.postMessage({ type: "career-intelligence-ready" }, location.origin);
  announceReady();
  addEventListener("pageshow", announceReady);
} else if (workflow) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    workflow.classList.add("is-in-view", "is-review-ready");
  } else {
    const availableHeight = innerHeight - 80;
    const visibleThreshold = workflow.offsetHeight <= availableHeight
      ? .9
      : Math.min(.68, Math.max(.12, (availableHeight / workflow.scrollHeight) * .85));
    const motionObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      requestAnimationFrame(revealWorkflow);
      observer.disconnect();
    }, { threshold: visibleThreshold, rootMargin: "0px 0px -3% 0px" });
    motionObserver.observe(workflow);

    if (reviewGate) {
      const reviewObserver = new IntersectionObserver((entries, observer) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        reviewIsVisible = true;
        releaseReviewWhenReady();
        observer.disconnect();
      }, { threshold: .85 });
      reviewObserver.observe(reviewGate);
    }
  }
}

function openDetail(card) {
  const item = capabilityDetails[card.dataset.id];
  if (!item) return;
  cards.forEach((candidate) => candidate.setAttribute("aria-expanded", String(candidate === card)));
  document.querySelector("#detail-pillar").textContent = item.pillar;
  document.querySelector("#detail-title").textContent = item.title;
  document.querySelector("#detail-summary").textContent = item.summary;
  document.querySelector("#detail-problem").textContent = item.problem;
  document.querySelector("#detail-workflow").textContent = item.workflow;
  document.querySelector("#detail-human").textContent = item.human;
  document.querySelector("#detail-value").textContent = item.value;
  panel.hidden = false;
  panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "nearest" });
}

function flowIdFor(element) {
  return element.dataset.flowId || element.dataset.id;
}

function closeScope({ restoreFocus = false } = {}) {
  if (scopePopover.hidden) return;
  scopePopover.hidden = true;
  workflow.classList.remove("has-selection");
  flowItems.forEach((item) => item.classList.remove("is-selected", "is-related"));
  const previous = activeFlowItem;
  activeFlowItem = null;
  if (restoreFocus) previous?.focus();
}

function positionScope(trigger) {
  scopePopover.style.removeProperty("left");
  scopePopover.style.removeProperty("top");
  if (innerWidth <= 760) return;
  const rect = trigger.getBoundingClientRect();
  const width = Math.min(340, innerWidth - 32);
  const height = scopePopover.offsetHeight;
  let left = rect.right + 14;
  if (left + width > innerWidth - 16) left = rect.left - width - 14;
  left = Math.max(16, Math.min(left, innerWidth - width - 16));
  const top = Math.max(16, Math.min(rect.top + rect.height / 2 - height / 2, innerHeight - height - 16));
  scopePopover.style.left = `${left}px`;
  scopePopover.style.top = `${top}px`;
}

function openScope(trigger) {
  const id = flowIdFor(trigger);
  const item = scopeDetails[id];
  if (!item) return;
  if (activeFlowItem === trigger && !scopePopover.hidden) {
    closeScope();
    return;
  }
  activeFlowItem = trigger;
  document.querySelector("#scope-kicker").textContent = item.kind;
  document.querySelector("#scope-title").textContent = item.title;
  document.querySelector("#scope-copy").textContent = item.copy;
  document.querySelector("#scope-path").textContent = item.path;
  scopeMore.hidden = !trigger.classList.contains("capability-card");
  workflow.classList.add("has-selection");
  flowItems.forEach((candidate) => {
    const candidateId = flowIdFor(candidate);
    candidate.classList.toggle("is-selected", candidate === trigger);
    candidate.classList.toggle("is-related", item.all || item.related?.includes(candidateId));
  });
  scopePopover.hidden = false;
  requestAnimationFrame(() => positionScope(trigger));
}

flowItems.forEach((item) => {
  item.setAttribute("aria-expanded", "false");
  item.addEventListener("click", (event) => {
    event.stopPropagation();
    flowItems.forEach((candidate) => candidate.setAttribute("aria-expanded", String(candidate === item)));
    openScope(item);
  });
});

scopePopover.addEventListener("click", (event) => event.stopPropagation());
scopeClose.addEventListener("click", () => closeScope({ restoreFocus: true }));
scopeMore.addEventListener("click", () => {
  if (!activeFlowItem?.classList.contains("capability-card")) return;
  const card = activeFlowItem;
  closeScope();
  openDetail(card);
});
document.addEventListener("click", () => closeScope());
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !scopePopover.hidden) closeScope({ restoreFocus: true });
});
addEventListener("resize", () => activeFlowItem && !scopePopover.hidden && positionScope(activeFlowItem));

closeButton.addEventListener("click", () => {
  const active = cards.find((card) => card.getAttribute("aria-expanded") === "true");
  panel.hidden = true;
  cards.forEach((card) => card.setAttribute("aria-expanded", "false"));
  active?.focus();
});
