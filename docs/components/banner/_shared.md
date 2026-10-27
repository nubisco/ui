<style>
/* The preview area is a flex column that stretches its single child, which
   would make every banner as tall as the space available and hide the real
   spacing. Stacking them inside one plain child keeps each at its own height. */
.banner-stack {
  display: flex;
  flex-direction: column;
  gap: calc(var(--nb-base-unit) * 1.5);
  width: 100%;
}
</style>
