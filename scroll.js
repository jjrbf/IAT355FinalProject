const steps = document.querySelectorAll('[data-step]');
let currentStep = 0;

// Scroll to a specific step
const scrollToStep = (index) => {
  if (index >= 0 && index < steps.length) {
    steps[index].scrollIntoView({ behavior: 'smooth' });
    currentStep = index;
  }
};

// Handle scroll for desktop
window.addEventListener('wheel', (event) => {
  if (event.deltaY > 0) {
    scrollToStep(currentStep + 1); // Scrolling down
  } else if (event.deltaY < 0) {
    scrollToStep(currentStep - 1); // Scrolling up
  }
});

// Handle key navigation
window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown') {
    scrollToStep(currentStep + 1);
  } else if (event.key === 'ArrowUp') {
    scrollToStep(currentStep - 1);
  }
});

// Handle button clicks
document.getElementById('next-step').addEventListener('click', () => {
    scrollToStep(currentStep + 1);
  });
  
  document.getElementById('prev-step').addEventListener('click', () => {
    scrollToStep(currentStep - 1);
  });
