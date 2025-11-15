<template>
  <div class="balance-display">
    <span class="balance-label">Balance</span>
    <span class="balance-amount">৳ {{ balance }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  balance: {
    required: true,
  },
});

</script>

<style scoped>
.balance-display {
  display: flex;
  flex-direction: column;  
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0.5rem 1.5rem;
  border-radius: 10px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.balance-label {
  font-size: 1rem;
  color: var(--light-gray);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.balance-amount {
  font-size: 1.2rem; /* Smaller to fit with win amount */
  font-weight: bold;
  color: #FFD700; /* Gold */
  text-shadow: 0 0 25px rgba(255, 215, 0, 1), 0 0 40px rgba(255, 223, 0, 0.8);
  line-height: 1.5rem;
  min-width: 110px;
}
</style>
