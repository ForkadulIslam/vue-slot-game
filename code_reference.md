/* --- OPTIMIZED SPRITE SHEET --- */
.symbol-icon {
  width: 153px; 
  height: 136px;
  
  background-image: url('@/assets/images/symbols_sprite.png');
  background-repeat: no-repeat;
  
  position: absolute;
  top: 50%;
  left: 50%;
  
  /* Zoom in slightly and center */
  transform: translate(-50%, -50%) scale(0.55);
  transform-origin: center center;
  
  will-change: transform;
  /* Removed drop-shadow filter for performance */
}

/* SPRITE POSITIONS */
/* Row 1 */
.icon-diamond { background-position: 0px 0px; }
.icon-heart   { background-position: -153px 0px; }
.icon-club    { background-position: -306px 0px; }
.icon-spade   { background-position: -459px 0px; }
/* Row 2 */
.icon-K       { background-position: 0px -136px; }
.icon-Q       { background-position: -153px -136px; }
.icon-J       { background-position: -306px -136px; }
.icon-A       { background-position: -459px -136px; }
/* Row 3 */
.icon-scatter { background-position: 0px -272px; }
.icon-bonus   { background-position: -153px -272px; }
.icon-wild    { background-position: -306px -272px; }
.icon-777     { background-position: -459px -272px; }