// UI Effects - like button ripple

export function applyRippleEffect() {
  document.addEventListener('mousedown', function(event) {
    const target = event.target.closest('.btn'); // Check if the click or ancestor is a .btn

    if (target && !target.disabled) {
      // Remove any existing ripple elements to prevent multiple ripples if user clicks fast
      const existingRipple = target.querySelector('.ripple-element');
      if (existingRipple) {
        existingRipple.remove();
      }

      const ripple = document.createElement('span');
      ripple.classList.add('ripple-element');

      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;

      target.appendChild(ripple);

      // Remove the ripple element after the animation completes
      ripple.addEventListener('animationend', () => {
        ripple.remove();
      });
    }
  });
}
