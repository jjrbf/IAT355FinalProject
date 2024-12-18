const steps = document.querySelectorAll("[data-step]");
const progressBar = document.getElementById("progress-bar");
let currentStep = 0;
let isScrolling = false; // Controls scroll delay
let changeVis = false; // Prevent focus-triggered duplication

// Show the scroll down to continue
document.addEventListener("DOMContentLoaded", () => {
  const scrollDown = document.getElementById("scroll-down");

  // Show the button after 2 seconds
  setTimeout(() => {
    scrollDown.classList.add("show");
  }, 2000);

  // Scroll to the next step when clicked
  scrollDown.addEventListener("click", (event) => {
    const nextStep = document.querySelector('[data-step="2"]');
    if (nextStep) {
      changeVis = true;
      scrollToStep(1);
    }
  });
});

// Create progress bar items
steps.forEach((step, index) => {
  step.setAttribute("tabindex", "0");
  step.addEventListener("focus", () => {
    scrollToStep(index); // Scroll to the step when focused
  });
  const progressItem = document.createElement("div");
  progressItem.classList.add("progress-item");
  if (index === 0) progressItem.classList.add("active");
  progressItem.dataset.step = index;

  // Add a tooltip showing the step name
  const tooltip = document.createElement("span");
  tooltip.textContent = step.id || `Step ${index + 1}`;
  progressItem.appendChild(tooltip);

  // Click event to navigate to step
  progressItem.addEventListener("click", () => {
    changeVis = true;
    scrollToStep(index);
  });

  progressBar.appendChild(progressItem);
});

// Update progress bar
const updateProgressBar = () => {
  const progressItems = document.querySelectorAll(".progress-item");
  progressItems.forEach((item, index) => {
    item.classList.toggle("active", index === currentStep);
  });
};

// accessibility for screenreaders
const liveRegion = document.createElement("div");
liveRegion.setAttribute("aria-live", "polite");
liveRegion.setAttribute("class", "sr-only");
document.body.appendChild(liveRegion);

const announceStepChange = (index) => {
  liveRegion.textContent = `Step ${index + 1}: ${
    steps[index].id || "Untitled Step"
  }`;
};

// Scroll to a specific step
const scrollToStep = (index) => {
  if (index >= 0 && index < steps.length && changeVis) {
    steps[index].scrollIntoView({ behavior: "smooth" });

    setTimeout(() => {
      currentStep = index;
      if (currentStep == 0) progressBar.classList.add("hide");
      else if (progressBar.classList.contains("hide"))
        progressBar.classList.remove("hide");
      updateProgressBar();
      announceStepChange(index);

      // Update the hash in the URL
      const stepId = steps[currentStep].id;
      if (stepId) {
        window.location.hash = stepId; // Set the hash to the step's ID
      }

      if (changeVis) {
        // Trigger visuals based on the current step
        if (index < 3) tuitionVis1();
        if (index == 3) salaryVis1();
        if (index == 5) firstStep();
        if (index == 6) secondStep();
        if (index == 7) clearVis3();
        if (index == 8) salaryVis3();
        if (index == 9) highlightEntryVis3();
        if (index == 10) allEntriesVis3();
        if (index == 11) adjustYScaleVis3();
        if (index >= 12) filterVis3();
        changeVis = false;
      }
    }, 300);
  }
};

// Handle initial URL hash to set the step
const handleInitialHash = () => {
  const hash = window.location.hash.slice(1); // Get the hash without the `#`
  if (hash) {
    // Find the step associated with the hash ID
    const stepIndex = Array.from(steps).findIndex((step) => step.id === hash);
    if (stepIndex !== -1) {
      currentStep = stepIndex; // Update currentStep to match the hash
      changeVis = true;
      scrollToStep(currentStep);
    }
  }
};

// Handle scroll for desktop
window.addEventListener(
  "wheel",
  (event) => {
    if (isScrolling) return;
    isScrolling = true;
    changeVis = true;

    const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY; // Changes to pixels ?

    if (delta > 20) {
      scrollToStep(currentStep + 1);
    } else if (delta < -20) {
      scrollToStep(currentStep - 1);
    }

    setTimeout(() => {
      isScrolling = false;
    }, 600);
  },
  { passive: true }
);

// Handle key navigation
window.addEventListener("keydown", (event) => {
  if (isScrolling) return;
  isScrolling = true;
  changeVis = true;

  if (event.key === "ArrowDown") {
    scrollToStep(currentStep + 1);
  } else if (event.key === "ArrowUp") {
    scrollToStep(currentStep - 1);
  }

  setTimeout(() => {
    isScrolling = false;
  }, 600); // Matches the scrolling delay
});

const firstFocusable = steps[0];
const lastFocusable = steps[steps.length - 1];

document.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;

  const focusedElement = document.activeElement;

  if (event.shiftKey && focusedElement === firstFocusable) {
    // Shift + Tab at the first step
    event.preventDefault();
    lastFocusable.focus(); // Wrap to the last step
  } else if (!event.shiftKey && focusedElement === lastFocusable) {
    // Tab at the last step
    event.preventDefault();
    firstFocusable.focus(); // Wrap to the first step
  }
});

// Handle button clicks
document.getElementById("next-step").addEventListener("click", () => {
  isScrolling = true;
  changeVis = true;
  scrollToStep(currentStep + 1);
});

document.getElementById("prev-step").addEventListener("click", () => {
  isScrolling = true;
  changeVis = true;
  scrollToStep(currentStep - 1);
});

// Initialize step based on hash on page load
handleInitialHash();
