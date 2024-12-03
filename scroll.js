const steps = document.querySelectorAll('[data-step]');
let currentStep = 5;
let isScrolling = false; // To control the delay

// Scroll to a specific step
const scrollToStep = (index) => {
  if (index >= 0 && index < steps.length) {
    steps[index].scrollIntoView({ behavior: 'smooth' });

    setTimeout(() => {
      currentStep = index;
      if (index < 3) tuitionVis1();
      if (index == 3) salaryVis1();
      if (index == 5) salaryVis3();
      if (index == 6) highlightEntryVis3();
      if (index == 7) allEntriesVis3();
      if (index == 8) adjustYScaleVis3();
      if (index >= 9) filterVis3();
      console.log(currentStep)
    }, 500);

  }
};

// Handle scroll for desktop
window.addEventListener('wheel', (event) => {
  if (isScrolling) return;
  isScrolling = true;

  if (event.deltaY > 0) {
    scrollToStep(currentStep + 1); // Scrolling down
  } else if (event.deltaY < 0) {
    scrollToStep(currentStep - 1); // Scrolling up
  }

  // Allow new scroll after a delay
  setTimeout(() => {
    isScrolling = false;
  }, 600); // Matches or exceeds the scrollToStep delay
});

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
