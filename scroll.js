const steps = document.querySelectorAll('[data-step]');
const progressBar = document.getElementById('progress-bar');
let currentStep = 0;
let isScrolling = false; // To control the delay

// Create progress bar items
steps.forEach((step, index) => {
  const progressItem = document.createElement('div');
  progressItem.classList.add('progress-item');
  if (index === 0) progressItem.classList.add('active');
  progressItem.dataset.step = index;

  // Add a tooltip showing the step name
  const tooltip = document.createElement('span');
  tooltip.textContent = step.id || `Step ${index + 1}`;
  progressItem.appendChild(tooltip);

  // Click event to navigate to step
  progressItem.addEventListener('click', () => {
    scrollToStep(index);
  });

  progressBar.appendChild(progressItem);
});

// Update progress bar
const updateProgressBar = () => {
  const progressItems = document.querySelectorAll('.progress-item');
  progressItems.forEach((item, index) => {
    item.classList.toggle('active', index === currentStep);
  });
};

// Scroll to a specific step
const scrollToStep = (index) => {
  if (index >= 0 && index < steps.length) {
    steps[index].scrollIntoView({ behavior: 'smooth' });

    setTimeout(() => {
      currentStep = index;
      if (currentStep == 0) progressBar.classList.add("hide");
      else if (progressBar.classList.contains("hide")) progressBar.classList.remove("hide");
      updateProgressBar();

      // Update the hash in the URL
      const stepId = steps[currentStep].id;
      if (stepId) {
        window.location.hash = stepId; // Set the hash to the step's ID
      }

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
      console.log(currentStep);
    }, 500);
  }
};

// Handle initial URL hash to set the step
const handleInitialHash = () => {
  const hash = window.location.hash.slice(1); // Get the hash without the `#`
  if (hash) {
    // Find the step associated with the hash ID
    const stepIndex = Array.from(steps).findIndex(
      (step) => step.id === hash
    );
    if (stepIndex !== -1) {
      currentStep = stepIndex; // Update currentStep to match the hash
      scrollToStep(currentStep);
    }
  }
  // implement it to go back to original
  // if (index < 3)
  // if (index >= 3) redrawVis1();
};

// Handle scroll for desktop
let scrollTimeout;
window.addEventListener('wheel', (event) => {
  if (isScrolling) return;
  isScrolling = true;

  const delta = event.deltaMode === 1 ? event.deltaY * 33 : event.deltaY; // Changes to pixels ?

  if (delta > 10) {
    scrollToStep(currentStep + 1);
  } else if (delta < -10) {
    scrollToStep(currentStep - 1);
  }

  setTimeout(() => {
    isScrolling = false;
  }, 600);
}, { passive: true });


// Handle key navigation
window.addEventListener('keydown', (event) => {
  if (isScrolling) return;
  isScrolling = true;

  if (event.key === 'ArrowDown') {
    scrollToStep(currentStep + 1);
  } else if (event.key === 'ArrowUp') {
    scrollToStep(currentStep - 1);
  }

  setTimeout(() => {
    isScrolling = false;
  }, 600); // Matches the scrolling delay
});

// Handle button clicks
document.getElementById('next-step').addEventListener('click', () => {
  scrollToStep(currentStep + 1);
});

document.getElementById('prev-step').addEventListener('click', () => {
  scrollToStep(currentStep - 1);
});

// Initialize step based on hash on page load
handleInitialHash();
