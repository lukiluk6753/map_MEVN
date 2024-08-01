<template>
  <button @click="handleClick" class="plus-button">+</button>
</template>

<script> //options API 
export default {
  name: 'PlusButton',
  emits: ['click'],
  methods: {
    handleClick() {
      this.$emit('click'); 
    }
  }
}
</script>

<style scoped>
.plus-button {
  font-size: 24px;
  padding: 10px 15px;
  border: none;
  border-radius: 50%;
  background-color: #50795a;
  color: white;
  cursor: pointer;
}
.plus-button:hover {
  background-color: #709779;
}
</style>
