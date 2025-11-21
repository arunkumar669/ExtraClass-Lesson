<template>
  <div id="app">
    <header class="app-header">
      <h1>Lesson Store</h1>

      <!-- Toggle between Lessons and Cart -->
      <button 
        @click="isCartVisible = !isCartVisible"
        :disabled="cart.length === 0 && isCartVisible"
        class="cart-button"
      >
        {{ isCartVisible ? '<< Back to Lessons' : 'View Cart' }} ({{ cart.length }})
      </button>
    </header>

    <!-- LESSONS VIEW -->
    <main v-if="!isCartVisible" class="lessons-view">
      <div class="lesson-list">

        <div 
          v-for="lesson in lessons" 
          :key="lesson.id" 
          class="lesson-card"
        >
          <div class="lesson-details">
            <span class="lesson-icon">{{ lesson.icon }}</span>
            <h3>{{ lesson.subject }}</h3>
            <p><strong>Location:</strong> {{ lesson.location }}</p>
            <p><strong>Price:</strong> £{{ lesson.price }}</p>
            <p><strong>Spaces Left:</strong> {{ lesson.spaces }}</p>
          </div>

          <button
            class="add-to-cart-button"
            :disabled="lesson.spaces === 0"
            @click="addToCart(lesson)"
          >
            {{ lesson.spaces === 0 ? 'Full' : 'Add to Cart' }}
          </button>
        </div>

      </div>
    </main>

    <!-- CART VIEW -->
    <main v-else class="cart-view">
      <h2>Shopping Cart</h2>

      <div v-if="cart.length > 0">
        <div 
          v-for="(item, index) in cart" 
          :key="index"
          class="cart-item"
        >
          <p><strong>{{ item.subject }}</strong></p>
          <p>Location: {{ item.location }}</p>
          <p>Price: £{{ item.price }}</p>

          <button class="remove-btn" @click="removeFromCart(index)">
            Remove
          </button>
        </div>
      </div>

      <p v-else>Your cart is empty.</p>

    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue';

// UPDATED LESSON DATA
const lessons = ref([
  { id: 1, subject: "Math", location: "Room 101, Main Building, London", price: 15, spaces: 5, icon: "📐" },
  { id: 2, subject: "English", location: "Library Annex, Kensington", price: 12.5, spaces: 5, icon: "📚" },
  { id: 3, subject: "Physics", location: "Lab A, Westminster", price: 18, spaces: 5, icon: "🔭" },
  { id: 4, subject: "Chemistry", location: "Lab B, Westminster", price: 18, spaces: 5, icon: "⚗️" },
  { id: 5, subject: "History", location: "Room 205, Culture Street", price: 10, spaces: 5, icon: "📜" },
  { id: 6, subject: "Geography", location: "Room 206, Culture Street", price: 10, spaces: 5, icon: "🌍" },
  { id: 7, subject: "Art", location: "Studio 3, Shoreditch", price: 22, spaces: 5, icon: "🎨" },
  { id: 8, subject: "Music", location: "Studio 4, Shoreditch", price: 22, spaces: 5, icon: "🎶" },
  { id: 9, subject: "PE", location: "Sports Complex, Greenwich", price: 8, spaces: 5, icon: "⚽" },
  { id: 10, subject: "Programming", location: "Online via Zoom", price: 25, spaces: 5, icon: "💻" }
]);

const cart = ref([]);
const isCartVisible = ref(false);

// ADD TO CART
function addToCart(lesson) {
  if (lesson.spaces === 0) return;

  lesson.spaces--; // reduce spaces

  cart.value.push({
    subject: lesson.subject,
    price: lesson.price,
    location: lesson.location
  });
}

// REMOVE FROM CART
function removeFromCart(index) {
  const removed = cart.value.splice(index, 1)[0];

  // restore spaces to the matching lesson
  const lesson = lessons.value.find(
    (l) => l.subject === removed.subject && l.location === removed.location
  );

  if (lesson) lesson.spaces++;
}
</script>

<style scoped>
#app {
  font-family: Arial, sans-serif;
  padding: 20px;
}
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #ccc;
  padding-bottom: 10px;
}
h1 {
  font-size: 2.2em;
  color: #333;
}
h2 {
  border-bottom: 2px solid #4CAF50;
  padding-bottom: 5px;
  margin-bottom: 20px;
}
.lesson-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 20px;
  margin-top: 20px;
}
.lesson-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.05);
}
.lesson-details h3 {
  color: #007bff;
}
.lesson-icon {
  font-size: 2.5em;
  margin-bottom: 8px;
}
.cart-button {
  padding: 10px 15px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
}
.add-to-cart-button {
  padding: 8px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
}
.add-to-cart-button[disabled] {
  background-color: #ccc;
}
.cart-item {
  border-bottom: 1px dashed #bbb;
  padding: 10px 0;
}
.remove-btn {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 6px 10px;
  margin-top: 5px;
  border-radius: 4px;
}
</style>
